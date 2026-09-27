package com.taskrunning.api.service;

import com.taskrunning.api.dto.request.AtualizarPerfilRequestDTO;
import com.taskrunning.api.dto.response.PerfilResponseDTO;
import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.repository.ConfiguracaoHidratacaoRepository;
import com.taskrunning.api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final ConfiguracaoHidratacaoRepository configuracaoHidratacaoRepository;

    @Transactional(readOnly = true)
    public PerfilResponseDTO obterPerfil(String email) {
        Usuario usuario = buscarPorEmail(email);
        return mapearParaDTO(usuario);
    }

    @Transactional
    public PerfilResponseDTO atualizarPerfil(String email, AtualizarPerfilRequestDTO dto) {
        Usuario usuario = buscarPorEmail(email);

        usuario.setNome(dto.nome());
        usuario.setPeso(dto.peso());

        if (dto.peso() != null && dto.peso() > 0) {
            usuario.setMetaAguaMl(dto.peso() * 35.0);
        }

        usuarioRepository.save(usuario);

        if (usuario.getMetaAguaMl() != null) {
            configuracaoHidratacaoRepository.findByUsuarioId(usuario.getId())
                    .ifPresent(config -> {
                        config.setMetaDiariaMl(usuario.getMetaAguaMl().intValue());
                        configuracaoHidratacaoRepository.save(config);
                    });
        }

        return mapearParaDTO(usuario);
    }

    private Usuario buscarPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com o e-mail: " + email));
    }

    private PerfilResponseDTO mapearParaDTO(Usuario usuario) {
        return new PerfilResponseDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getCpf(),
                usuario.getPeso(),
                usuario.getMetaAguaMl(),
                usuario.getPerfil() != null ? usuario.getPerfil().name() : "USER"
        );
    }
}