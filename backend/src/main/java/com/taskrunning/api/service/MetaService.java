package com.taskrunning.api.service;

import com.taskrunning.api.dto.response.HistoricoHidratacaoDTO;
import com.taskrunning.api.dto.response.MetasResponseDTO;
import com.taskrunning.api.dto.response.MetasResponseDTO.MetaDTO;
import com.taskrunning.api.entity.Atividade;
import com.taskrunning.api.entity.Carteira;
import com.taskrunning.api.entity.MetaResgatada;
import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.enums.StatusAtividade;
import com.taskrunning.api.exception.BusinessRuleException;
import com.taskrunning.api.exception.ConflictException;
import com.taskrunning.api.repository.*;
import com.taskrunning.api.util.Auditoria;
import com.taskrunning.api.util.RegrasMetas;
import com.taskrunning.api.util.RegrasMetas.Meta;
import com.taskrunning.api.util.RegrasMetas.Periodo;
import com.taskrunning.api.util.Relogio;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Metas diárias e semanais. O progresso é CALCULADO a partir do que o próprio servidor registrou
 * (atividades sincronizadas e concluídas, registros de água, abates recompensados e baús abertos);
 * não existe contador que o aparelho possa alterar. Atividades feitas offline passam a contar quando
 * sincronizam, desde que ainda dentro do período. Recompensa: só moedas, via botão "Resgatar".
 *
 * Limitação conhecida: o horário das atividades (dataFim) vem do aparelho; ele só pode mover uma
 * atividade real de dia dentro do mesmo período, nunca criar distância (RNF12 continua valendo).
 */
@Service
@RequiredArgsConstructor
public class MetaService {

    private static final int DISTANCIA_MINIMA_ATIVIDADE_M = 500;

    private final AtividadeRepository atividadeRepo;
    private final RegistroHidratacaoRepository registroAguaRepo;
    private final ConfiguracaoHidratacaoRepository configAguaRepo;
    private final AbateMonstroRepository abateRepo;
    private final BauPendenteRepository bauRepo;
    private final MetaResgatadaRepository resgateRepo;
    private final GamificacaoService gamificacaoService;

    /** Janela de um período em horário de Brasília. */
    private record Janela(LocalDate inicio, LocalDate fimExclusivo) {
        LocalDateTime inicioDt() { return inicio.atStartOfDay(); }
        LocalDateTime fimDt() { return fimExclusivo.atStartOfDay(); }
    }

    private static Janela janela(Periodo p, LocalDate hoje) {
        return p == Periodo.DIARIA
                ? new Janela(hoje, hoje.plusDays(1))
                : new Janela(RegrasMetas.inicioSemana(hoje), RegrasMetas.inicioSemana(hoje).plusDays(7));
    }

    @Transactional
    public MetasResponseDTO listar(Usuario usuario) {
        LocalDate hoje = Relogio.hoje();
        LocalDateTime agora = Relogio.agora();
        Janela dia = janela(Periodo.DIARIA, hoje);
        Janela semana = janela(Periodo.SEMANAL, hoje);

        Set<String> resgatadas = new HashSet<>();
        resgateRepo.findByUsuarioIdAndPeriodoInicioIn(usuario.getId(), List.of(dia.inicio(), semana.inicio()))
                .forEach(r -> resgatadas.add(r.getCodigo() + "@" + r.getPeriodoInicio()));

        Contexto ctx = new Contexto(usuario, agora);
        return new MetasResponseDTO(
                montar(RegrasMetas.diariasDoDia(hoje), dia, ctx, resgatadas),
                montar(RegrasMetas.SEMANAIS, semana, ctx, resgatadas),
                dia.fimDt(),
                semana.fimDt(),
                Math.max(0, Duration.between(agora, dia.fimDt()).getSeconds()),
                Math.max(0, Duration.between(agora, semana.fimDt()).getSeconds()));
    }

    /**
     * Resgata a recompensa de uma meta concluída do período atual. A carteira fica travada durante a
     * operação e a chave única (usuário, meta, período) impede pagamento duplicado.
     */
    @Transactional
    public MetasResponseDTO.ResgateDTO resgatar(Usuario usuario, String codigo) {
        gamificacaoService.carteiraTravada(usuario); // serializa resgates simultâneos da mesma conta
        LocalDate hoje = Relogio.hoje();
        Meta meta = RegrasMetas.diariasDoDia(hoje).stream().filter(m -> m.codigo().equals(codigo)).findFirst()
                .or(() -> RegrasMetas.SEMANAIS.stream().filter(m -> m.codigo().equals(codigo)).findFirst())
                .orElseThrow(() -> new BusinessRuleException("Meta não encontrada ou fora do período atual."));
        Janela j = janela(meta.periodo(), hoje);

        if (resgateRepo.existsByUsuarioIdAndCodigoAndPeriodoInicio(usuario.getId(), codigo, j.inicio())) {
            throw new ConflictException("Recompensa desta meta já resgatada.");
        }
        List<Meta> doPeriodo = meta.periodo() == Periodo.DIARIA ? RegrasMetas.diariasDoDia(hoje) : RegrasMetas.SEMANAIS;
        MetaDTO estado = montar(doPeriodo, j, new Contexto(usuario, Relogio.agora()), Set.of()).stream()
                .filter(m -> m.codigo().equals(codigo)).findFirst().orElseThrow();
        if (!estado.concluida()) {
            throw new BusinessRuleException("Meta ainda não concluída.");
        }

        MetaResgatada r = new MetaResgatada();
        r.setUsuario(usuario);
        r.setCodigo(codigo);
        r.setPeriodoInicio(j.inicio());
        r.setMoedas(meta.moedas());
        resgateRepo.save(r);
        Carteira carteira = gamificacaoService.creditar(usuario, 0, meta.moedas());
        Auditoria.registrar("RESGATE_META", usuario.getEmail(), codigo + " +" + meta.moedas());
        return new MetasResponseDTO.ResgateDTO(codigo, meta.moedas(), carteira.getMoedas());
    }

    // ─── progresso ───────────────────────────────────────────────────────────

    /** Dados do usuário carregados uma vez por chamada. */
    private final class Contexto {
        final Usuario usuario;
        final LocalDateTime agora;
        private final Map<LocalDate, List<Atividade>> atividadesCache = new HashMap<>();
        private Integer metaAgua;

        Contexto(Usuario usuario, LocalDateTime agora) {
            this.usuario = usuario;
            this.agora = agora;
        }

        List<Atividade> atividades(Janela j) {
            return atividadesCache.computeIfAbsent(j.inicio(), k -> {
                // Atividades concluídas e sincronizadas; nada "no futuro" além de 10 min de tolerância
                LocalDateTime limite = j.fimDt().isBefore(agora.plusMinutes(10)) ? j.fimDt() : agora.plusMinutes(10);
                return atividadeRepo.findByUsuarioIdAndStatusAndDataFimGreaterThanEqualAndDataFimLessThan(
                        usuario.getId(), StatusAtividade.CONCLUIDA, j.inicioDt(), limite);
            });
        }

        int metaAgua() {
            if (metaAgua == null) {
                metaAgua = configAguaRepo.findByUsuarioId(usuario.getId())
                        .map(c -> c.getMetaDiariaMl())
                        .orElseGet(() -> usuario.getPeso() != null && usuario.getPeso() > 0
                                ? (int) (usuario.getPeso() * 35) : 2000);
            }
            return Math.max(1, metaAgua);
        }
    }

    private List<MetaDTO> montar(List<Meta> metas, Janela j, Contexto ctx, Set<String> resgatadas) {
        List<MetaDTO> normais = new ArrayList<>();
        Meta bonus = null;
        for (Meta m : metas) {
            if (m.bonus()) { bonus = m; continue; }
            long alvo = alvo(m, ctx);
            long progresso = Math.min(alvo, progresso(m, j, ctx, alvo));
            normais.add(dto(m, j, progresso, alvo, resgatadas));
        }
        List<MetaDTO> todas = new ArrayList<>(normais);
        if (bonus != null) {
            long concluidas = normais.stream().filter(MetaDTO::concluida).count();
            todas.add(dto(bonus, j, Math.min(bonus.alvo(), concluidas), bonus.alvo(), resgatadas));
        }
        return todas;
    }

    private MetaDTO dto(Meta m, Janela j, long progresso, long alvo, Set<String> resgatadas) {
        return new MetaDTO(m.codigo(), m.periodo().name(), m.categoria(), m.titulo(), m.descricao(),
                progresso, alvo, m.unidade(), m.moedas(), progresso >= alvo,
                resgatadas.contains(m.codigo() + "@" + j.inicio()), m.bonus());
    }

    private long alvo(Meta m, Contexto ctx) {
        // Hidratação: percentual da meta PESSOAL (nunca acima de 100%)
        if (m.tipo() == RegrasMetas.Tipo.AGUA_PCT) return (long) Math.ceil(ctx.metaAgua() * m.alvo() / 100.0);
        return m.alvo();
    }

    private long progresso(Meta m, Janela j, Contexto ctx, long alvo) {
        Long uid = ctx.usuario.getId();
        return switch (m.tipo()) {
            case ABATES -> abateRepo.countByUsuarioIdAndRecompensadoTrueAndDiaBetween(uid, j.inicio(), j.fimExclusivo().minusDays(1));
            case ATIVIDADE_MIN_500M -> ctx.atividades(j).stream()
                    .filter(a -> a.getDistanciaMetros() != null && a.getDistanciaMetros() >= DISTANCIA_MINIMA_ATIVIDADE_M)
                    .count();
            case DISTANCIA_M -> (long) Math.floor(ctx.atividades(j).stream()
                    .mapToDouble(a -> a.getDistanciaMetros() == null ? 0 : a.getDistanciaMetros()).sum());
            case DIAS_ATIVIDADE -> ctx.atividades(j).stream()
                    .filter(a -> a.getDistanciaMetros() != null && a.getDistanciaMetros() >= DISTANCIA_MINIMA_ATIVIDADE_M)
                    .map(a -> a.getDataFim().toLocalDate()).distinct().count();
            case AGUA_PCT -> {
                Integer ml = registroAguaRepo.somarMlConsumidosNoDia(uid, j.inicio());
                yield ml == null ? 0 : ml;
            }
            case DIAS_META_AGUA -> registroAguaRepo.historicoDesde(uid, j.inicio()).stream()
                    .filter(d -> d.data().isBefore(j.fimExclusivo()))
                    .filter(d -> d.totalMl() != null && d.totalMl() >= ctx.metaAgua())
                    .map(HistoricoHidratacaoDTO::data).distinct().count();
            case BAUS_ABERTOS -> bauRepo.countByUsuarioIdAndAbertoTrueAndAbertoEmGreaterThanEqualAndAbertoEmLessThan(
                    uid, j.inicioDt(), j.fimDt());
            case BONUS -> 0;
        };
    }
}
