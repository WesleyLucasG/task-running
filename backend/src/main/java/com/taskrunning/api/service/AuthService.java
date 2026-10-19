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

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

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
    public void cadastrar(CadastroUsuarioDTO dto) {
        if (usuarioRepository.existsByCpfAndAtivoTrue(dto.cpf())) {
            throw new BusinessRuleException("CPF já cadastrado no sistema.");
        }

        Usuario usuario = new Usuario();
        usuario.setNome(dto.nome());
        usuario.setEmail(dto.email());
        usuario.setCpf(dto.cpf());
        usuario.setSenha(passwordEncoder.encode(dto.senha()));
        usuario.setPeso(dto.peso());
        usuario.setAtivo(true);

        // 1. Salvar o usuário no repositório
        Usuario usuarioSalvo = usuarioRepository.save(usuario);

        // 2. Cálculo defensivo para a meta diária de água (evita NullPointerException)
        int metaDiaria = 2000; // Valor padrão de fallback
        if (usuarioSalvo != null && usuarioSalvo.getMetaAguaMl() != null) {
            metaDiaria = usuarioSalvo.getMetaAguaMl().intValue();
        } else if (dto.peso() != null) {
            metaDiaria = (int) Math.round(dto.peso() * 35.0); // 35ml por kg
        }

        // 3. Criar e vincular a configuração de hidratação
        ConfiguracaoHidratacao configuracao = new ConfiguracaoHidratacao();
        configuracao.setUsuario(usuarioSalvo != null ? usuarioSalvo : usuario);
        configuracao.setMetaDiariaMl(metaDiaria);
        configuracao.setLembreteAtivo(true);

        configuracaoHidratacaoRepository.save(configuracao);
    }

    public TokenResponseDTO login(LoginDTO dto) {
        Usuario usuario = usuarioRepository.findByEmailAndAtivoTrue(dto.email())
                .orElseThrow(() -> new BusinessRuleException("Usuário não encontrado ou conta inativa."));

        if (!passwordEncoder.matches(dto.senha(), usuario.getSenha())) {
            throw new BusinessRuleException("Senha inválida.");
        }

        String token = tokenService.gerarToken(usuario);
        return new TokenResponseDTO(token, "Bearer");
    }

    @Transactional
    public String recuperarSenha(ForgotPasswordDTO dto) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(dto.email());

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

    public void redefinirSenha(ResetPasswordDTO dto) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(dto.token())
                .orElseThrow(() -> new BusinessRuleException("Token de recuperação inválido ou inexistente"));

        if (resetToken.isUsado()) {
            throw new BusinessRuleException("Este token de recuperação já foi utilizado.");
        }
        if (resetToken.isExpirado()) {
            throw new BusinessRuleException("Este token de recuperação expirou. Solicite um novo.");
        }

        Usuario usuario = resetToken.getUsuario();
        usuario.setSenha(passwordEncoder.encode(dto.novaSenha()));
        usuarioRepository.save(usuario);

        resetToken.setUsado(true);
        passwordResetTokenRepository.save(resetToken);
    }
}