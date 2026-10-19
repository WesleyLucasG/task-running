package com.taskrunning.api.service;

import com.taskrunning.api.dto.request.AtualizarPerfilRequestDTO;
import com.taskrunning.api.dto.response.PerfilResponseDTO;
import com.taskrunning.api.entity.ConfiguracaoHidratacao;
import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.exception.ResourceNotFoundException;
import com.taskrunning.api.repository.ConfiguracaoHidratacaoRepository;
import com.taskrunning.api.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ConfiguracaoHidratacaoRepository configuracaoHidratacaoRepository;

    public PerfilResponseDTO obterPerfil(String cpf) {
        Usuario usuario = buscarPorCpf(cpf);
        ConfiguracaoHidratacao config = configuracaoHidratacaoRepository.findByUsuarioId(usuario.getId())
                .orElse(null);

        Double metaAgua = (config != null && config.getMetaDiariaMl() != null)
                ? config.getMetaDiariaMl().doubleValue()
                : (usuario.getPeso() != null ? usuario.getPeso() * 35.0 : 2000.0);

        String perfil = usuario.getPerfil() != null ? usuario.getPerfil().toString() : "USER";

        return new PerfilResponseDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getCpf(),
                usuario.getPeso(),
                metaAgua,
                perfil
        );
    }

    public PerfilResponseDTO atualizarPerfil(String cpf, AtualizarPerfilRequestDTO dto) {
        Usuario usuario = buscarPorCpf(cpf);

        if (dto.nome() != null) usuario.setNome(dto.nome());
        if (dto.peso() != null) usuario.setPeso(dto.peso());

        usuarioRepository.save(usuario);

        ConfiguracaoHidratacao config = configuracaoHidratacaoRepository.findByUsuarioId(usuario.getId())
                .orElseGet(() -> {
                    ConfiguracaoHidratacao c = new ConfiguracaoHidratacao();
                    c.setUsuario(usuario);
                    return c;
                });

        if (dto.peso() != null) {
            config.setMetaDiariaMl((int) Math.round(dto.peso() * 35.0));
            configuracaoHidratacaoRepository.save(config);
        }

        Double metaAgua = (config.getMetaDiariaMl() != null)
                ? config.getMetaDiariaMl().doubleValue()
                : (usuario.getPeso() != null ? usuario.getPeso() * 35.0 : 2000.0);

        String perfil = usuario.getPerfil() != null ? usuario.getPerfil().toString() : "USER";

        return new PerfilResponseDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getCpf(),
                usuario.getPeso(),
                metaAgua,
                perfil
        );
    }

    public void deletarPerfil(String cpf) {
        Usuario usuario = buscarPorCpf(cpf);
        usuario.setAtivo(false);
        usuarioRepository.save(usuario);
    }

    private Usuario buscarPorCpf(String cpf) {
        return usuarioRepository.findByCpfAndAtivoTrue(cpf)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado para o CPF: " + cpf));
    }
}