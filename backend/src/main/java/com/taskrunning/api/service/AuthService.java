package com.taskrunning.api.service;

import com.taskrunning.api.dto.request.CadastroUsuarioDTO;
import com.taskrunning.api.dto.request.ForgotPasswordDTO;
import com.taskrunning.api.dto.request.LoginDTO;
import com.taskrunning.api.dto.request.ResetPasswordDTO;
import com.taskrunning.api.dto.request.ValidarCodigoDTO;
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
    public static final int MINUTOS_VALIDADE_RECUPERACAO = 15; // RF06
    public static final int SEGUNDOS_ENTRE_ENVIOS = 60;
    public static final int MAX_TENTATIVAS_CODIGO = 5;
    public static final String CODIGO_INVALIDO = "Código inválido ou expirado. Confira o e-mail ou solicite um novo.";
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

    /**
     * RF05/RF06. Devolve o token gerado (exposto na resposta somente em desenvolvimento) ou null quando
     * o e-mail não existe ou a solicitação caiu no intervalo mínimo de reenvio — em ambos os casos o
     * controller responde com a mesma mensagem genérica (RNF09: não revelar se o e-mail existe).
     *
     * Se o provedor de e-mail falhar, EmailIndisponivelException é propagada e o @Transactional desfaz a
     * gravação do token: nada fica "meio concluído" e o usuário recebe 503 em vez de um falso sucesso.
     */
    @Transactional
    public String recuperarSenha(ForgotPasswordDTO dto) {
        String email = dto.email() == null ? "" : dto.email().trim();
        Optional<Usuario> usuarioOpt = usuarioRepository.findFirstByEmailAndAtivoTrue(email);
        if (usuarioOpt.isEmpty()) return null;

        Usuario usuario = usuarioOpt.get();
        LocalDateTime agora = LocalDateTime.now();

        // A tabela guarda um único token por usuário (usuario_id é único). Reaproveitar a linha evita
        // o DELETE + INSERT no mesmo flush, que o Hibernate ordena como INSERT antes do DELETE.
        PasswordResetToken resetToken = passwordResetTokenRepository.findByUsuario(usuario)
                .orElseGet(PasswordResetToken::new);

        // Solicitações repetidas: evita reenvio em rajada (spam e consumo da cota diária do provedor).
        if (resetToken.getId() != null && !resetToken.isUsado() && resetToken.getDataExpiracao() != null) {
            LocalDateTime criadoEm = resetToken.getDataExpiracao().minusMinutes(MINUTOS_VALIDADE_RECUPERACAO);
            if (criadoEm.plusSeconds(SEGUNDOS_ENTRE_ENVIOS).isAfter(agora)) {
                return null;
            }
        }

        // Código de 6 dígitos (fácil de digitar no app). No banco fica só o hash, atrelado ao usuário.
        String codigo = String.format("%06d", aleatorio.nextInt(1_000_000));
        resetToken.setToken(hashCodigo(usuario, codigo)); // uma nova solicitação invalida o código anterior
        resetToken.setUsuario(usuario);
        resetToken.setDataExpiracao(agora.plusMinutes(MINUTOS_VALIDADE_RECUPERACAO));
        resetToken.setUsado(false);
        resetToken.setTentativas(0);
        passwordResetTokenRepository.save(resetToken);

        if (emailService != null) {
            emailService.enviarRecuperacaoSenha(usuario.getEmail(), usuario.getNome(), codigo);
        }
        return codigo;
    }

    /**
     * Etapa 2: confere e-mail + código SEM consumir o código (o site/app só então pede a nova senha).
     * dontRollbackOn: a tentativa errada precisa ser gravada mesmo com a exceção (anti força bruta).
     */
    @Transactional(dontRollbackOn = BusinessRuleException.class)
    public void validarCodigo(ValidarCodigoDTO dto) {
        conferirCodigo(dto.email(), dto.codigo());
    }

    /** Etapa 3: confere o código de novo (a API não confia no cliente), grava a senha e invalida o código. */
    @Transactional(dontRollbackOn = BusinessRuleException.class)
    public void redefinirSenha(ResetPasswordDTO dto) {
        PasswordResetToken resetToken = conferirCodigo(dto.email(), dto.codigo());

        Usuario usuario = resetToken.getUsuario();
        usuario.setSenha(passwordEncoder.encode(dto.novaSenha()));
        usuarioRepository.save(usuario);

        resetToken.setUsado(true); // RF07: uso único
        passwordResetTokenRepository.save(resetToken);
    }

    /**
     * Mesma mensagem para e-mail inexistente, código errado ou sem solicitação ativa (RNF09: não revela
     * se o e-mail existe). Ao atingir MAX_TENTATIVAS_CODIGO erros, o código é invalidado.
     */
    private PasswordResetToken conferirCodigo(String emailBruto, String codigoBruto) {
        String email = emailBruto == null ? "" : emailBruto.trim();
        String codigo = codigoBruto == null ? "" : codigoBruto.replaceAll("\\s", "");

        Usuario usuario = usuarioRepository.findFirstByEmailAndAtivoTrue(email)
                .orElseThrow(() -> new BusinessRuleException(CODIGO_INVALIDO));
        PasswordResetToken resetToken = passwordResetTokenRepository.findByUsuario(usuario)
                .orElseThrow(() -> new BusinessRuleException(CODIGO_INVALIDO));

        boolean confere = MessageDigest.isEqual(
                resetToken.getToken().getBytes(StandardCharsets.UTF_8),
                hashCodigo(usuario, codigo).getBytes(StandardCharsets.UTF_8));

        if (!confere) {
            if (!resetToken.isUsado()) {
                int erros = (resetToken.getTentativas() == null ? 0 : resetToken.getTentativas()) + 1;
                resetToken.setTentativas(erros);
                if (erros >= MAX_TENTATIVAS_CODIGO) resetToken.setUsado(true);
                passwordResetTokenRepository.save(resetToken);
            }
            throw new BusinessRuleException(CODIGO_INVALIDO);
        }
        if (resetToken.isUsado()) {
            throw new BusinessRuleException("Este código já foi utilizado. Solicite um novo.");
        }
        if (resetToken.isExpirado()) {
            throw new BusinessRuleException("Este código expirou. Solicite um novo.");
        }
        return resetToken;
    }

    private static String hashCodigo(Usuario usuario, String codigo) {
        return sha256("recuperacao:" + usuario.getId() + ":" + codigo);
    }
}
