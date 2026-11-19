package com.taskrunning.api.service;

import com.taskrunning.api.dto.request.EnviarPontosRequestDTO;
import com.taskrunning.api.dto.request.PontoGpsRequestDTO;
import com.taskrunning.api.dto.request.SincronizarAtividadeRequestDTO;
import com.taskrunning.api.dto.response.AtividadeResponseDTO;
import com.taskrunning.api.dto.response.AtividadeResumoDTO;
import com.taskrunning.api.dto.response.EstadoSincronizacaoDTO;
import com.taskrunning.api.dto.response.PontoGpsResponseDTO;
import com.taskrunning.api.entity.Atividade;
import com.taskrunning.api.entity.PontoGps;
import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.enums.StatusAtividade;
import com.taskrunning.api.enums.TipoAtividade;
import com.taskrunning.api.exception.BusinessRuleException;
import com.taskrunning.api.exception.ConflictException;
import com.taskrunning.api.exception.ResourceNotFoundException;
import com.taskrunning.api.repository.AtividadeRepository;
import com.taskrunning.api.repository.PontoGpsRepository;
import com.taskrunning.api.repository.UsuarioRepository;
import com.taskrunning.api.util.CalculoGeograficoUtil;
import com.taskrunning.api.util.Auditoria;
import com.taskrunning.api.util.HashPontosGps;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AtividadeService {

    /** RNF12: segmentos acima desta velocidade são descartados do cálculo de distância. */
    public static final double VELOCIDADE_MAXIMA_KMH = 30.0;

    private final AtividadeRepository atividadeRepository;
    private final PontoGpsRepository pontoGpsRepository;
    private final UsuarioRepository usuarioRepository;
    private final GamificacaoService gamificacaoService;
    private final JogoService jogoService;

    /**
     * UC09: finaliza (ou recebe de uma vez) a atividade. Idempotente pelo identificadorLocal (RN04):
     * reenvios de uma atividade já concluída só devolvem o estado, sem nova recompensa.
     */
    @Transactional
    public AtividadeResponseDTO sincronizarAtividade(String cpf, SincronizarAtividadeRequestDTO dto) {
        Usuario usuario = buscarUsuario(cpf);
        if (dto.dataFim().isBefore(dto.dataInicio())) {
            throw new BusinessRuleException("A data de término não pode ser anterior à data de início.");
        }

        Atividade atividade = atividadeDoUsuario(usuario, dto.identificadorLocal());
        if (atividade != null && atividade.getStatus() != StatusAtividade.EM_ANDAMENTO) {
            Auditoria.registrar("SINCRONIZACAO_ATIVIDADE", usuario.getEmail(), "REENVIO_IGNORADO atividade_id=" + atividade.getId());
            return mapearParaDTO(atividade); // RN04: já processada
        }
        if (atividade == null) {
            atividade = novaAtividade(usuario, dto.identificadorLocal(), dto.tipoAtividade(), dto.dataInicio());
        }

        acrescentarPontos(atividade, dto.pontosGps());
        List<PontoGps> pontos = pontoGpsRepository.findByAtividadeIdOrderByTimestampAsc(atividade.getId());

        double distancia = calcularDistanciaValida(pontos);
        long duracao = Duration.between(dto.dataInicio(), dto.dataFim()).getSeconds(); // RN06
        double peso = usuario.getPeso() != null ? usuario.getPeso() : 70.0;

        atividade.setDataFim(dto.dataFim());
        atividade.setDuracaoSegundos(duracao);
        atividade.setDistanciaMetros(distancia);
        atividade.setPaceMedio(CalculoGeograficoUtil.calcularPaceMedio(distancia, duracao)); // RN08
        atividade.setCalorias(CalculoGeograficoUtil.calcularCalorias(atividade.getTipoAtividade(), peso, duracao));
        atividade.setStatus(StatusAtividade.CONCLUIDA);
        Atividade salva = atividadeRepository.save(atividade);

        // RN10: a recompensa só é paga na transição para CONCLUIDA (uma única vez)
        gamificacaoService.creditarRecompensaAtividade(usuario, salva.getCalorias(), salva.getDistanciaMetros());
        jogoService.registrarDistancia(usuario, salva.getDistanciaMetros()); // RF20–RF22: mapa e chefe
        Auditoria.registrar("SINCRONIZACAO_ATIVIDADE", usuario.getEmail(), String.format(java.util.Locale.ROOT,
                "CONCLUIDA atividade_id=%d distancia_m=%.1f", salva.getId(), salva.getDistanciaMetros()));
        return mapearParaDTO(salva);
    }

    /** RN16: recebe só os pontos novos de uma atividade em andamento (cria o registro na primeira vez). */
    @Transactional
    public EstadoSincronizacaoDTO enviarPontos(String cpf, EnviarPontosRequestDTO dto) {
        Usuario usuario = buscarUsuario(cpf);
        Atividade atividade = atividadeDoUsuario(usuario, dto.identificadorLocal());
        if (atividade == null) {
            atividade = novaAtividade(usuario, dto.identificadorLocal(), dto.tipoAtividade(), dto.dataInicio());
        }
        if (atividade.getStatus() == StatusAtividade.EM_ANDAMENTO) {
            acrescentarPontos(atividade, dto.pontos());
        }
        return estado(atividade);
    }

    @Transactional(readOnly = true)
    public EstadoSincronizacaoDTO obterEstado(String cpf, String identificadorLocal) {
        Usuario usuario = buscarUsuario(cpf);
        Atividade atividade = atividadeDoUsuario(usuario, identificadorLocal);
        if (atividade == null) {
            return new EstadoSincronizacaoDTO(identificadorLocal, false, null, 0, null, HashPontosGps.calcular(List.of()));
        }
        return estado(atividade);
    }

    /** RF31 / UC07: histórico paginado, do mais recente para o mais antigo. */
    @Transactional(readOnly = true)
    public Page<AtividadeResumoDTO> listar(String cpf, int pagina, int tamanho) {
        Usuario usuario = buscarUsuario(cpf);
        int tam = Math.max(1, Math.min(tamanho, 50));
        return atividadeRepository.findByUsuarioIdOrderByDataInicioDesc(usuario.getId(), PageRequest.of(Math.max(0, pagina), tam))
                .map(a -> new AtividadeResumoDTO(a.getId(), a.getIdentificadorLocal(), a.getTipoAtividade().name(),
                        a.getStatus().name(), a.getDataInicio(), a.getDataFim(), a.getDuracaoSegundos(),
                        a.getDistanciaMetros(), a.getCalorias(), a.getPaceMedio()));
    }

    /** RF33 / UC06: cancela uma atividade em andamento (não conta nas métricas). */
    @Transactional
    public void cancelar(String cpf, String identificadorLocal) {
        Usuario usuario = buscarUsuario(cpf);
        Atividade atividade = atividadeDoUsuario(usuario, identificadorLocal);
        if (atividade == null) return; // nunca chegou ao servidor: nada a cancelar
        if (atividade.getStatus() == StatusAtividade.CONCLUIDA) {
            throw new BusinessRuleException("Atividade concluída não pode ser cancelada; apenas excluída.");
        }
        atividade.setStatus(StatusAtividade.CANCELADA);
        atividadeRepository.save(atividade);
    }

    /** UC06: exclusão física da atividade e dos seus pontos. */
    @Transactional
    public void excluir(Long id, String cpf) {
        Usuario usuario = buscarUsuario(cpf);
        Atividade atividade = atividadeRepository.findByIdAndUsuarioId(id, usuario.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Atividade não encontrada ou não pertence ao usuário."));
        atividadeRepository.delete(atividade);
    }

    @Transactional(readOnly = true)
    public AtividadeResponseDTO obterPorId(Long id, String cpf) {
        Usuario usuario = buscarUsuario(cpf);
        Atividade atividade = atividadeRepository.findByIdAndUsuarioId(id, usuario.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Atividade não encontrada ou não pertence ao usuário."));
        return mapearParaDTO(atividade);
    }

    // ---------------------------------------------------------------------------------------

    private Usuario buscarUsuario(String cpf) {
        return usuarioRepository.findByCpfAndAtivoTrue(cpf)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado.")); // RNF20: sem CPF na mensagem
    }

    /** RN04 + RN07: o UUID é único no sistema; se pertencer a outra conta, é conflito. */
    private Atividade atividadeDoUsuario(Usuario usuario, String identificadorLocal) {
        return atividadeRepository.findByIdentificadorLocal(identificadorLocal)
                .map(a -> {
                    if (!a.getUsuario().getId().equals(usuario.getId())) {
                        throw new ConflictException("Identificador de atividade já utilizado.");
                    }
                    return a;
                })
                .orElse(null);
    }

    private Atividade novaAtividade(Usuario usuario, String uuid, TipoAtividade tipo, LocalDateTime inicio) {
        Atividade a = new Atividade();
        a.setUsuario(usuario);
        a.setIdentificadorLocal(uuid);
        a.setTipoAtividade(tipo);
        a.setStatus(StatusAtividade.EM_ANDAMENTO);
        a.setDataInicio(inicio);
        a.setDataFim(inicio); // provisório até a finalização
        a.setDuracaoSegundos(0L);
        a.setDistanciaMetros(0.0);
        a.setCalorias(0);
        a.setPaceMedio(0.0);
        return atividadeRepository.save(a);
    }

    /**
     * RN02 / RNF24: só entram pontos com coordenadas válidas; pontos com timestamp já existente
     * são ignorados (reenvio de delta não duplica nada).
     */
    private void acrescentarPontos(Atividade atividade, List<PontoGpsRequestDTO> recebidos) {
        if (recebidos == null || recebidos.isEmpty()) return;
        Set<LocalDateTime> existentes = new HashSet<>();
        if (atividade.getId() != null) {
            pontoGpsRepository.findByAtividadeIdOrderByTimestampAsc(atividade.getId())
                    .forEach(p -> existentes.add(p.getTimestamp()));
        }
        List<PontoGps> novos = new ArrayList<>();
        recebidos.stream()
                .filter(AtividadeService::coordenadaValida)
                .sorted(Comparator.comparing(PontoGpsRequestDTO::timestamp))
                .forEach(p -> {
                    if (existentes.add(p.timestamp())) {
                        PontoGps ponto = new PontoGps();
                        ponto.setAtividade(atividade);
                        ponto.setLatitude(p.latitude());
                        ponto.setLongitude(p.longitude());
                        ponto.setAltitude(p.altitude());
                        ponto.setTimestamp(p.timestamp());
                        novos.add(ponto);
                    }
                });
        if (!novos.isEmpty()) pontoGpsRepository.saveAll(novos);
    }

    static boolean coordenadaValida(PontoGpsRequestDTO p) {
        return p != null && p.latitude() != null && p.longitude() != null && p.timestamp() != null
                && p.latitude() >= -90 && p.latitude() <= 90 && p.longitude() >= -180 && p.longitude() <= 180
                && !(p.latitude() == 0.0 && p.longitude() == 0.0);
    }

    /** RN03 + RNF12: Haversine só entre pontos sequenciais e plausíveis (≤ 30 km/h). */
    static double calcularDistanciaValida(List<PontoGps> ordenados) {
        double total = 0;
        for (int i = 1; i < ordenados.size(); i++) {
            PontoGps a = ordenados.get(i - 1);
            PontoGps b = ordenados.get(i);
            double metros = CalculoGeograficoUtil.calcularDistanciaHaversine(
                    a.getLatitude(), a.getLongitude(), b.getLatitude(), b.getLongitude());
            double segundos = Duration.between(a.getTimestamp(), b.getTimestamp()).toMillis() / 1000.0;
            if (segundos <= 0) continue;
            double kmh = (metros / segundos) * 3.6;
            if (kmh > VELOCIDADE_MAXIMA_KMH) continue; // segmento implausível: descartado
            total += metros;
        }
        return total;
    }

    private EstadoSincronizacaoDTO estado(Atividade atividade) {
        List<PontoGps> pontos = pontoGpsRepository.findByAtividadeIdOrderByTimestampAsc(atividade.getId());
        List<HashPontosGps.Ponto> paraHash = pontos.stream()
                .map(p -> new HashPontosGps.Ponto(p.getLatitude(), p.getLongitude(), p.getTimestamp()))
                .toList();
        LocalDateTime ultimo = pontos.isEmpty() ? null : pontos.get(pontos.size() - 1).getTimestamp();
        return new EstadoSincronizacaoDTO(atividade.getIdentificadorLocal(), true, atividade.getStatus().name(),
                pontos.size(), ultimo, HashPontosGps.calcular(paraHash));
    }

    private AtividadeResponseDTO mapearParaDTO(Atividade atividade) {
        List<PontoGpsResponseDTO> pontosGpsDTO = atividade.getId() == null ? List.of()
                : pontoGpsRepository.findByAtividadeIdOrderByTimestampAsc(atividade.getId()).stream()
                .map(p -> new PontoGpsResponseDTO(p.getId(), p.getLatitude(), p.getLongitude(), p.getAltitude(), p.getTimestamp()))
                .toList();

        return new AtividadeResponseDTO(
                atividade.getId(),
                atividade.getIdentificadorLocal(),
                atividade.getTipoAtividade().name(),
                atividade.getStatus().name(),
                atividade.getDataInicio(),
                atividade.getDataFim(),
                atividade.getDuracaoSegundos(),
                atividade.getDistanciaMetros(),
                atividade.getCalorias(),
                atividade.getPaceMedio(),
                pontosGpsDTO
        );
    }
}
