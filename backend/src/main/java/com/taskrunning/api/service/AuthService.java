package com.taskrunning.api.service;

import com.taskrunning.api.dto.request.CadastroUsuarioDTO;
import com.taskrunning.api.dto.request.ForgotPasswordDTO;
import com.taskrunning.api.dto.request.LoginDTO;
import com.taskrunning.api.dto.request.ResetPasswordDTO;
import com.taskrunning.api.dto.response.TokenResponseDTO;
import com.taskrunning.api.entity.ConfiguracaoHidratacao;
import com.taskrunning.api.entity.PasswordResetToken;
import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.exception.BusinessRuleException;
import com.taskrunning.api.repository.ConfiguracaoHidratacaoRepository;
import com.taskrunning.api.repository.PasswordResetTokenRepository;
import com.taskrunning.api.repository.UsuarioRepository;
import com.taskrunning.api.security.TokenService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.taskrunning.api.entity.ConfiguracaoHidratacao;



import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;

@Service
public class AuthService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private ConfiguracaoHidratacaoRepository configuracaoHidratacaoRepository;

    @Transactional
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

        ConfiguracaoHidratacao  configuracao = new ConfiguracaoHidratacao();
        configuracao.setUsuario(usuario);
        configuracao.setMetaDiariaMl(usuario.getMetaAguaMl().intValue());
        configuracao.setLembreteAtivo(true);

        configuracaoHidratacaoRepository.save(configuracao);

        }

    public TokenResponseDTO login(LoginDTO dto) {
        Usuario usuario = usuarioRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new BusinessRuleException("E-mail ou senha inválidos."));

        if (!passwordEncoder.matches(dto.getSenha(), usuario.getSenha())) {
            throw new BusinessRuleException("E-mail ou senha inválidos.");
        }

        String token = tokenService.gerarToken(usuario);
        return new TokenResponseDTO("Bearer", token);
    }

    @Transactional
    public String recuperarSenha(ForgotPasswordDTO dto) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(dto.getEmail());

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();
            String token = UUID.randomUUID().toString();

            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setToken(token);
            resetToken.setUsuario(usuario);
            resetToken.setDataExpiracao(LocalDateTime.now().plusMinutes(15));
            resetToken.setUsado(false);

            passwordResetTokenRepository.save(resetToken);
            return token;
        }
        return null;

    }

    public void redefinirSenha(ResetPasswordDTO dto){
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(dto.getToken())
                .orElseThrow(() -> new BusinessRuleException("Token de recuperação inválido ou inexistente"));
        if(resetToken.isUsado()){
            throw new BusinessRuleException("Este token de recuperação já foi utilizado.");
        }
        if(resetToken.isExpirado()){
            throw new BusinessRuleException("Este token de recuperação expirou. Solicite um novo.");
        }

        Usuario usuario = resetToken.getUsuario();
        usuario.setSenha(passwordEncoder.encode(dto.getNovaSenha()));
        usuarioRepository.save(usuario);

        resetToken.setUsado(true);
        passwordResetTokenRepository.save(resetToken);
    }



}
