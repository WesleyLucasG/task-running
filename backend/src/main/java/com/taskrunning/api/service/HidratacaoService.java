package com.taskrunning.api.service;

import com.taskrunning.api.util.Relogio;
import com.taskrunning.api.dto.request.ConfigurarLembreteRequestDTO;
import com.taskrunning.api.dto.request.RegistrarAguaRequestDTO;
import com.taskrunning.api.dto.response.HidratacaoResponseDTO;
import com.taskrunning.api.entity.ConfiguracaoHidratacao;
import com.taskrunning.api.entity.RegistroHidratacao;
import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.exception.ResourceNotFoundException;
import com.taskrunning.api.repository.ConfiguracaoHidratacaoRepository;
import com.taskrunning.api.repository.RegistroHidratacaoRepository;
import com.taskrunning.api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor
public class HidratacaoService {

    public static final java.util.Set<Integer> INTERVALOS_PERMITIDOS = java.util.Set.of(30, 60, 120, 180, 240);

    private final GamificacaoService gamificacaoService;
    private final JogoService jogoService;

    /** RF30: histórico agrupado por data (últimos N dias). */
    @Transactional
    public java.util.List<com.taskrunning.api.dto.response.HistoricoHidratacaoDTO> historico(String cpfUsuario, int dias) {
        Usuario usuario = buscarUsuarioPorCpf(cpfUsuario);
        int n = Math.max(1, Math.min(dias, 90));
        return registroRepository.historicoDesde(usuario.getId(), Relogio.hoje().minusDays(n - 1L));
    }

    private final ConfiguracaoHidratacaoRepository configuracaoRepository;
    private final RegistroHidratacaoRepository registroRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public HidratacaoResponseDTO obterStatusDiario(String cpfUsuario) {
        Usuario usuario = buscarUsuarioPorCpf(cpfUsuario);
        ConfiguracaoHidratacao config = buscarConfiguracaoDoUsuario(usuario);
        int consumidoHoje = obterConsumoDoDia(usuario.getId());

        return mapearParaResponseDTO(config, consumidoHoje);
    }

    @Transactional
    public HidratacaoResponseDTO registrarConsumo(String cpfUsuario, RegistrarAguaRequestDTO dto) {
        Usuario usuario = buscarUsuarioPorCpf(cpfUsuario);

        RegistroHidratacao novoRegistro = new RegistroHidratacao();
        novoRegistro.setUsuario(usuario);
        novoRegistro.setQuantidadeMl(dto.quantidadeMl());
        novoRegistro.setDataRegistro(Relogio.hoje());

        registroRepository.save(novoRegistro);
        gamificacaoService.creditarXpHidratacao(usuario, dto.quantidadeMl()); // RN10

        ConfiguracaoHidratacao config = buscarConfiguracaoDoUsuario(usuario);
        int consumidoHoje = obterConsumoDoDia(usuario.getId());
        jogoService.concederBauHidratacaoSeDevido(usuario, consumidoHoje, config.getMetaDiariaMl()); // RN14

        return mapearParaResponseDTO(config, consumidoHoje);
    }

    @Transactional
    public void alterarStatusLembrete(String cpfUsuario, ConfigurarLembreteRequestDTO dto) {
        Usuario usuario = buscarUsuarioPorCpf(cpfUsuario);
        ConfiguracaoHidratacao config = buscarConfiguracaoDoUsuario(usuario);

        config.setLembreteAtivo(dto.lembreteAtivo());
        if (dto.intervaloMinutos() != null) {
            if (!INTERVALOS_PERMITIDOS.contains(dto.intervaloMinutos())) {
                throw new com.taskrunning.api.exception.BusinessRuleException("Intervalo inválido. Use 30, 60, 120, 180 ou 240 minutos.");
            }
            config.setIntervaloMinutos(dto.intervaloMinutos());
        }
        configuracaoRepository.save(config);
    }



    private Usuario buscarUsuarioPorCpf(String cpf) {
        return usuarioRepository.findByCpfAndAtivoTrue(cpf)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
    }

    private ConfiguracaoHidratacao buscarConfiguracaoDoUsuario(Usuario usuario) {
        return configuracaoRepository.findByUsuarioId(usuario.getId())
                    .orElseGet(() -> {
                        int metaCalculada = (usuario.getPeso() != null && usuario.getPeso() > 0)
                                ? (int) (usuario.getPeso() * 35)
                                : 2000;

                        ConfiguracaoHidratacao novaConfig = new ConfiguracaoHidratacao();
                        novaConfig.setUsuario(usuario);
                        novaConfig.setMetaDiariaMl(metaCalculada);
                        novaConfig.setLembreteAtivo(true);

                        return configuracaoRepository.save(novaConfig);
                    });
        }

    private int obterConsumoDoDia(Long usuarioId) {
        Integer totalConsumido = registroRepository.somarMlConsumidosNoDia(usuarioId, Relogio.hoje());
        return (totalConsumido != null) ? totalConsumido : 0;
    }

    private HidratacaoResponseDTO mapearParaResponseDTO(ConfiguracaoHidratacao config, int consumidoHoje) {
        double porcentagem = calcularPorcentagem(consumidoHoje, config.getMetaDiariaMl());
        return new HidratacaoResponseDTO(
                config.getMetaDiariaMl(),
                consumidoHoje,
                porcentagem,
                config.getLembreteAtivo(),
                config.getIntervaloMinutos() != null ? config.getIntervaloMinutos() : 120
        );
    }

    private double calcularPorcentagem(int consumido, int meta) {
        if (meta <= 0) return 0.0;
        double porcentagem = ((double) consumido / meta) * 100;
        return Math.min(porcentagem, 100.0);
    }
}