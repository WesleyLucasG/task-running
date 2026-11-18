package com.taskrunning.api.service;

import com.taskrunning.api.dto.request.CadastroUsuarioDTO;
import com.taskrunning.api.dto.request.ForgotPasswordDTO;
import com.taskrunning.api.dto.request.LoginDTO;
import com.taskrunning.api.dto.request.ResetPasswordDTO;
import com.taskrunning.api.dto.response.TokenResponseDTO;
import com.taskrunning.api.entity.ConfiguracaoHidratacao;
import com.taskrunning.api.entity.PasswordResetToken;
import com.taskrunning.api.entity.RefreshToken;
import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.exception.AutenticacaoException;
import com.taskrunning.api.exception.BusinessRuleException;
import com.taskrunning.api.exception.ConflictException;
import com.taskrunning.api.repository.ConfiguracaoHidratacaoRepository;
import com.taskrunning.api.repository.PasswordResetTokenRepository;
import com.taskrunning.api.repository.RefreshTokenRepository;
import com.taskrunning.api.repository.UsuarioRepository;
import com.taskrunning.api.security.CpfCriptografia;
import com.taskrunning.api.security.TokenService;
import com.taskrunning.api.util.CpfValidator;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    public static final int MAX_TENTATIVAS = 5; // RNF13
    public static final int MINUTOS_BLOQUEIO = 15; // RNF13
    public static final int DIAS_REFRESH = 30; // RNF07
    private static final String CREDENCIAIS_INVALIDAS = "CPF ou senha inválidos.";

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

    @Autowired
    private CpfCriptografia cpfCriptografia;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired(required = false)
    private EmailService emailService;

    private final SecureRandom aleatorio = new SecureRandom();

    @Transactional
    public void cadastrar(CadastroUsuarioDTO dto) {
        // RF02: formato e dígitos verificadores
        if (!CpfValidator.valido(dto.cpf())) {
            throw new BusinessRuleException("CPF inválido.");
        }
        String cpfHash = cpfCriptografia.hash(dto.cpf());
        String cpfDigitos = CpfCriptografia.normalizar(dto.cpf());

        // RF03: um CPF e um e-mail por conta (inclui registros antigos ainda sem hash)
        if (usuarioRepository.existsByCpfHashAndAtivoTrue(cpfHash)
                || usuarioRepository.existsByCpfAndAtivoTrue(cpfDigitos)) {
            throw new ConflictException("CPF já cadastrado no sistema.");
        }
        if (dto.email() != null && !dto.email().isBlank() && usuarioRepository.existsByEmailAndAtivoTrue(dto.email())) {
            throw new ConflictException("E-mail já cadastrado no sistema.");
        }

        int metaDiaria = dto.peso() != null ? (int) Math.round(dto.peso() * 35.0) : 2000;

        // Reativar conta inativa com o mesmo CPF (regra da equipe, preservada)
        Optional<Usuario> inativoOpt = usuarioRepository.findByCpfHashAndAtivoFalse(cpfHash)
                .or(() -> usuarioRepository.findByCpfAndAtivoFalse(cpfDigitos));
        Usuario usuario = inativoOpt.orElseGet(Usuario::new);
        usuario.setNome(dto.nome());
        usuario.setEmail(dto.email());
        usuario.setCpf(cpfCriptografia.criptografar(cpfDigitos));
        usuario.setCpfHash(cpfHash);
        usuario.setSenha(passwordEncoder.encode(dto.senha()));
        usuario.setPeso(dto.peso());
        usuario.setAtivo(true);
        usuario.setTentativasFalhas(0);
        usuario.setBloqueadoAte(null);
        Usuario salvo = usuarioRepository.save(usuario);
        Usuario dono = salvo != null ? salvo : usuario;

        ConfiguracaoHidratacao config = (dono.getId() == null ? Optional.<ConfiguracaoHidratacao>empty()
                : configuracaoHidratacaoRepository.findByUsuarioId(dono.getId()))
                .orElseGet(() -> {
                    ConfiguracaoHidratacao c = new ConfiguracaoHidratacao();
                    c.setUsuario(dono);
                    return c;
                });
        config.setMetaDiariaMl(metaDiaria);
        config.setLembreteAtivo(true);
        configuracaoHidratacaoRepository.save(config);
    }

    /**
     * Login por CPF e senha (decisão autorizada para o Mobile; RF04 do documento cita e-mail).
     * RNF13: 5 falhas consecutivas bloqueiam a conta por 15 minutos. A mensagem de erro é
     * sempre genérica para não revelar se o CPF existe.
     * dontRollbackOn: a falha de senha lança exceção, mas o contador de tentativas PRECISA ser gravado
     * (sem isso o rollback desfazia o incremento e o bloqueio nunca acontecia — achado no teste de integração).
     */
    @Transactional(dontRollbackOn = AutenticacaoException.class)
    public TokenResponseDTO login(LoginDTO dto) {
        Usuario usuario = localizarPorCpf(dto.cpf())
                .orElseThrow(() -> new AutenticacaoException(CREDENCIAIS_INVALIDAS));

        LocalDateTime agora = LocalDateTime.now();
        if (usuario.getBloqueadoAte() != null && usuario.getBloqueadoAte().isAfter(agora)) {
            long minutos = Math.max(1, ChronoUnit.MINUTES.between(agora, usuario.getBloqueadoAte()) + 1);
            throw new AutenticacaoException("Acesso bloqueado por tentativas inválidas. Tente novamente em " + minutos + " min.");
        }

        if (!passwordEncoder.matches(dto.senha(), usuario.getSenha())) {
            int falhas = (usuario.getTentativasFalhas() == null ? 0 : usuario.getTentativasFalhas()) + 1;
            if (falhas >= MAX_TENTATIVAS) {
                usuario.setTentativasFalhas(0);
                usuario.setBloqueadoAte(agora.plusMinutes(MINUTOS_BLOQUEIO));
                usuarioRepository.save(usuario);
                throw new AutenticacaoException("Muitas tentativas inválidas. Acesso bloqueado por " + MINUTOS_BLOQUEIO + " minutos.");
            }
            usuario.setTentativasFalhas(falhas);
            usuarioRepository.save(usuario);
            throw new AutenticacaoException(CREDENCIAIS_INVALIDAS);
        }

        usuario.setTentativasFalhas(0);
        usuario.setBloqueadoAte(null);
        migrarCpfSeNecessario(usuario);
        usuarioRepository.save(usuario);
        return emitirTokens(usuario);
    }

    /** RNF07: troca um refresh token válido por um novo par (o antigo é revogado: rotação). */
    @Transactional
    public TokenResponseDTO renovar(String refreshToken) {
        RefreshToken atual = refreshTokenRepository.findByTokenHash(sha256(refreshToken))
                .orElseThrow(() -> new AutenticacaoException("Sessão expirada. Faça login novamente."));
        if (atual.isRevogado() || atual.getExpiraEm().isBefore(LocalDateTime.now())
                || !Boolean.TRUE.equals(atual.getUsuario().getAtivo())) {
            throw new AutenticacaoException("Sessão expirada. Faça login novamente.");
        }
        atual.setRevogado(true);
        refreshTokenRepository.save(atual);
        return emitirTokens(atual.getUsuario());
    }

    @Transactional
    public void encerrarSessao(String refreshToken) {
        refreshTokenRepository.findByTokenHash(sha256(refreshToken)).ifPresent(t -> {
            t.setRevogado(true);
            refreshTokenRepository.save(t);
        });
    }

    private TokenResponseDTO emitirTokens(Usuario usuario) {
        String acesso = tokenService.gerarToken(usuario);
        byte[] bruto = new byte[32];
        aleatorio.nextBytes(bruto);
        String refresh = Base64.getUrlEncoder().withoutPadding().encodeToString(bruto);

        RefreshToken registro = new RefreshToken();
        registro.setTokenHash(sha256(refresh));
        registro.setUsuario(usuario);
        registro.setExpiraEm(LocalDateTime.now().plusDays(DIAS_REFRESH));
        refreshTokenRepository.save(registro);

        return new TokenResponseDTO(acesso, "Bearer", refresh, TokenService.HORAS_VALIDADE * 3600);
    }

    /** Busca pelo índice cego; cai para o texto puro só em registros antigos (pré-RNF06). */
    private Optional<Usuario> localizarPorCpf(String cpf) {
        if (cpf == null || cpf.isBlank()) return Optional.empty();
        return usuarioRepository.findByCpfHashAndAtivoTrue(cpfCriptografia.hash(cpf))
                .or(() -> usuarioRepository.findByCpfAndAtivoTrue(CpfCriptografia.normalizar(cpf)));
    }

    /** Migração gradual (não destrutiva: o valor continua recuperável com a chave). */
    private void migrarCpfSeNecessario(Usuario usuario) {
        if (CpfCriptografia.estaCriptografado(usuario.getCpf()) && usuario.getCpfHash() != null) return;
        String digitos = cpfCriptografia.descriptografar(usuario.getCpf());
        usuario.setCpf(cpfCriptografia.criptografar(digitos));
        usuario.setCpfHash(cpfCriptografia.hash(digitos));
    }

    private static String sha256(String valor) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(valor.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    @Transactional
    public String recuperarSenha(ForgotPasswordDTO dto) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(dto.email());

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();
            String token = UUID.randomUUID().toString();

            // A tabela possui um único token por usuário; uma nova solicitação invalida o anterior.
            passwordResetTokenRepository.deleteByUsuario(usuario);

            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setToken(token);
            resetToken.setUsuario(usuario);
            resetToken.setDataExpiracao(LocalDateTime.now().plusMinutes(15));
            resetToken.setUsado(false);

            passwordResetTokenRepository.save(resetToken);

            if (emailService != null) {
                emailService.enviarRecuperacaoSenha(usuario.getEmail(), usuario.getNome(), token);
            }

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
