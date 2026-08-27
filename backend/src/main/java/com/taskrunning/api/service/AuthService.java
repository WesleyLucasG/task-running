package com.taskrunning.api.service;

import com.taskrunning.api.dto.request.CadastroUsuarioDTO;
import com.taskrunning.api.dto.request.LoginDTO;
import com.taskrunning.api.dto.response.TokenResponseDTO;
import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.exception.BusinessRuleException;
import com.taskrunning.api.repository.UsuarioRepository;
import com.taskrunning.api.security.TokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TokenService tokenService;

    public void cadastrar(CadastroUsuarioDTO dto)  {
        if(usuarioRepository.existsByEmail(dto.getEmail())){
            throw new BusinessRuleException("Email já cadastrado no sistema.");
        }
        if(usuarioRepository.existsByCpf(dto.getCpf())){
            throw new BusinessRuleException("CPF já cadastrado no sistema.");
        }

        Usuario usuario = new Usuario();
        usuario.setNome(dto.getNome());
        usuario.setEmail(dto.getEmail());
        usuario.setCpf(dto.getCpf());
        usuario.setPeso(dto.getPeso());
        usuario.calcularMetaAgua();
        usuario.setSenha(passwordEncoder.encode(dto.getSenha()));
        usuarioRepository.save(usuario);
    }

    public TokenResponseDTO login(LoginDTO dto){
        Usuario usuario = usuarioRepository.findByEmail(dto.getEmail());
        if(usuario == null){
            throw new BusinessRuleException("E-mail ou senha inválido.");
        }

        boolean senhaValida = passwordEncoder.matches(dto.getSenha(), usuario.getSenha());
        if(!senhaValida){
            throw new BusinessRuleException("E-mail ou senha inválidos.");
        }

        String token = tokenService.gerarToken(usuario);
        return new TokenResponseDTO(token, "Bearer");
    }





}
