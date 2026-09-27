package com.taskrunning.api.service;

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

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class HidratacaoService {

    private final ConfiguracaoHidratacaoRepository configuracaoRepository;
    private final RegistroHidratacaoRepository registroRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public HidratacaoResponseDTO obterStatusDiario(String emailUsuario) {
        Usuario usuario = buscarUsuarioPorEmail(emailUsuario);
        ConfiguracaoHidratacao config = buscarConfiguracaoDoUsuario(usuario);
        int consumidoHoje = obterConsumoDoDia(usuario.getId());

        return mapearParaResponseDTO(config, consumidoHoje);
    }

    @Transactional
    public HidratacaoResponseDTO registrarConsumo(String emailUsuario, RegistrarAguaRequestDTO dto) {
        Usuario usuario = buscarUsuarioPorEmail(emailUsuario);

        RegistroHidratacao novoRegistro = new RegistroHidratacao();
        novoRegistro.setUsuario(usuario);
        novoRegistro.setQuantidadeMl(dto.quantidadeMl());
        novoRegistro.setDataRegistro(LocalDate.now());

        registroRepository.save(novoRegistro);

        ConfiguracaoHidratacao config = buscarConfiguracaoDoUsuario(usuario);
        int consumidoHoje = obterConsumoDoDia(usuario.getId());

        return mapearParaResponseDTO(config, consumidoHoje);
    }

    @Transactional
    public void alterarStatusLembrete(String emailUsuario, ConfigurarLembreteRequestDTO dto) {
        Usuario usuario = buscarUsuarioPorEmail(emailUsuario);
        ConfiguracaoHidratacao config = buscarConfiguracaoDoUsuario(usuario);

        config.setLembreteAtivo(dto.lembreteAtivo());
    }



    private Usuario buscarUsuarioPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado para o e-mail: " + email));
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
        Integer totalConsumido = registroRepository.somarMlConsumidosNoDia(usuarioId, LocalDate.now());
        return (totalConsumido != null) ? totalConsumido : 0;
    }

    private HidratacaoResponseDTO mapearParaResponseDTO(ConfiguracaoHidratacao config, int consumidoHoje) {
        double porcentagem = calcularPorcentagem(consumidoHoje, config.getMetaDiariaMl());
        return new HidratacaoResponseDTO(
                config.getMetaDiariaMl(),
                consumidoHoje,
                porcentagem,
                config.getLembreteAtivo()
        );
    }

    private double calcularPorcentagem(int consumido, int meta) {
        if (meta <= 0) return 0.0;
        double porcentagem = ((double) consumido / meta) * 100;
        return Math.min(porcentagem, 100.0);
    }
}