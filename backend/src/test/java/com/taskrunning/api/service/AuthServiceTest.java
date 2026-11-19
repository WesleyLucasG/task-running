package com.taskrunning.api.service;

import com.taskrunning.api.dto.request.CadastroUsuarioDTO;
import com.taskrunning.api.dto.request.ForgotPasswordDTO;
import com.taskrunning.api.dto.request.LoginDTO;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final String CPF_VALIDO = "529.982.247-25";
    private static final String CPF_DIGITOS = "52998224725";

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private TokenService tokenService;
    @Mock private ConfiguracaoHidratacaoRepository configuracaoHidratacaoRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Spy private CpfCriptografia cpfCriptografia = new CpfCriptografia("chave-de-teste");

    @InjectMocks
    private AuthService authService;

    private CadastroUsuarioDTO cadastroDTO;
    private Usuario usuario;

    @BeforeEach
    void setup() {
        cadastroDTO = new CadastroUsuarioDTO("Kilo", "runner@taskrunning.com", "Senha@123", CPF_VALIDO, 70.00);
        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setCpf(cpfCriptografia.criptografar(CPF_DIGITOS));
        usuario.setCpfHash(cpfCriptografia.hash(CPF_DIGITOS));
        usuario.setEmail("runner@taskrunning.com");
        usuario.setSenha("senhaCriptografada");
        usuario.setAtivo(true);
    }

    @Test
    @DisplayName("RF02: cadastro rejeita CPF com dígitos verificadores inválidos")
    void deveRejeitarCpfInvalido() {
        var dto = new CadastroUsuarioDTO("Kilo", "a@b.com", "Senha@123", "12345678900", 70.0);
        assertThrows(BusinessRuleException.class, () -> authService.cadastrar(dto));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("RF03: CPF já cadastrado retorna conflito e nada é gravado")
    void deveLancarExcecaoQuandoCpfJaCadastrado() {
        when(usuarioRepository.existsByCpfHashAndAtivoTrue(cpfCriptografia.hash(CPF_VALIDO))).thenReturn(true);
        ConflictException e = assertThrows(ConflictException.class, () -> authService.cadastrar(cadastroDTO));
        assertEquals("CPF já cadastrado no sistema.", e.getMessage());
        verify(usuarioRepository, never()).save(any());
        verify(configuracaoHidratacaoRepository, never()).save(any());
    }

    @Test
    @DisplayName("RNF06: cadastro grava o CPF criptografado e o índice cego, nunca em texto puro")
    void deveCadastrarComCpfCriptografado() {
        when(passwordEncoder.encode("Senha@123")).thenReturn("senhaCriptografada");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(i -> i.getArgument(0));

        authService.cadastrar(cadastroDTO);

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        Usuario salvo = captor.getValue();
        assertTrue(CpfCriptografia.estaCriptografado(salvo.getCpf()));
        assertFalse(salvo.getCpf().contains(CPF_DIGITOS));
        assertEquals(cpfCriptografia.hash(CPF_DIGITOS), salvo.getCpfHash());
        assertEquals(CPF_DIGITOS, cpfCriptografia.descriptografar(salvo.getCpf()));
        verify(configuracaoHidratacaoRepository).save(any(ConfiguracaoHidratacao.class));
    }

    @Test
    @DisplayName("Login por CPF com máscara gera access token de 24h e refresh token")
    void deveAutenticarEGerarTokens() {
        when(usuarioRepository.findByCpfHashAndAtivoTrue(cpfCriptografia.hash(CPF_DIGITOS))).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("Senha@123", "senhaCriptografada")).thenReturn(true);
        when(tokenService.gerarToken(usuario)).thenReturn("tokenJwtFake123");

        TokenResponseDTO resposta = authService.login(new LoginDTO(CPF_VALIDO, "Senha@123"));

        assertEquals("tokenJwtFake123", resposta.token());
        assertEquals("Bearer", resposta.tipo());
        assertNotNull(resposta.refreshToken());
        assertEquals(24 * 3600L, resposta.expiraEmSegundos());
        // Só o hash do refresh token é gravado
        ArgumentCaptor<RefreshToken> rt = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(rt.capture());
        assertNotEquals(resposta.refreshToken(), rt.getValue().getTokenHash());
        assertTrue(rt.getValue().getExpiraEm().isAfter(LocalDateTime.now().plusDays(29)));
    }

    @Test
    @DisplayName("Registro antigo com CPF em texto puro é migrado para criptografado no login")
    void deveMigrarCpfLegadoNoLogin() {
        usuario.setCpf(CPF_DIGITOS);
        usuario.setCpfHash(null);
        when(usuarioRepository.findByCpfHashAndAtivoTrue(anyString())).thenReturn(Optional.empty());
        when(usuarioRepository.findByCpfAndAtivoTrue(CPF_DIGITOS)).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("Senha@123", "senhaCriptografada")).thenReturn(true);
        when(tokenService.gerarToken(usuario)).thenReturn("t");

        authService.login(new LoginDTO(CPF_DIGITOS, "Senha@123"));

        assertTrue(CpfCriptografia.estaCriptografado(usuario.getCpf()));
        assertEquals(cpfCriptografia.hash(CPF_DIGITOS), usuario.getCpfHash());
    }

    @Test
    @DisplayName("RNF13: 5 senhas erradas seguidas bloqueiam por 15 minutos com mensagem genérica")
    void deveBloquearAposCincoFalhas() {
        when(usuarioRepository.findByCpfHashAndAtivoTrue(anyString())).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        for (int i = 1; i <= 4; i++) {
            AutenticacaoException e = assertThrows(AutenticacaoException.class,
                    () -> authService.login(new LoginDTO(CPF_VALIDO, "errada")));
            assertEquals("CPF ou senha inválidos.", e.getMessage());
            assertEquals(i, usuario.getTentativasFalhas());
        }
        AutenticacaoException quinta = assertThrows(AutenticacaoException.class,
                () -> authService.login(new LoginDTO(CPF_VALIDO, "errada")));
        assertTrue(quinta.getMessage().contains("bloqueado"));
        assertNotNull(usuario.getBloqueadoAte());
        assertTrue(usuario.getBloqueadoAte().isAfter(LocalDateTime.now().plusMinutes(14)));

        // Bloqueado: nem a senha certa entra, e a senha não chega a ser verificada
        reset(passwordEncoder);
        assertThrows(AutenticacaoException.class, () -> authService.login(new LoginDTO(CPF_VALIDO, "Senha@123")));
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    @DisplayName("CPF inexistente devolve a mesma mensagem genérica")
    void deveUsarMensagemGenericaParaCpfInexistente() {
        when(usuarioRepository.findByCpfHashAndAtivoTrue(anyString())).thenReturn(Optional.empty());
        when(usuarioRepository.findByCpfAndAtivoTrue(anyString())).thenReturn(Optional.empty());
        AutenticacaoException e = assertThrows(AutenticacaoException.class,
                () -> authService.login(new LoginDTO(CPF_VALIDO, "x")));
        assertEquals("CPF ou senha inválidos.", e.getMessage());
    }

    @Test
    @DisplayName("RNF07: refresh token válido gera novo par e revoga o anterior; revogado não serve mais")
    void deveRenovarERevogarRefreshToken() {
        RefreshToken atual = new RefreshToken();
        atual.setUsuario(usuario);
        atual.setExpiraEm(LocalDateTime.now().plusDays(10));
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(atual));
        when(tokenService.gerarToken(usuario)).thenReturn("novo");

        TokenResponseDTO novo = authService.renovar("qualquer");
        assertEquals("novo", novo.token());
        assertTrue(atual.isRevogado());

        assertThrows(AutenticacaoException.class, () -> authService.renovar("qualquer"));
    }

    @Test
    @DisplayName("RNF07: refresh token expirado é recusado")
    void deveRecusarRefreshExpirado() {
        RefreshToken velho = new RefreshToken();
        velho.setUsuario(usuario);
        velho.setExpiraEm(LocalDateTime.now().minusMinutes(1));
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(velho));
        assertThrows(AutenticacaoException.class, () -> authService.renovar("x"));
    }

    @Test
    @DisplayName("Recuperação de senha substitui o token anterior reaproveitando a linha (sem DELETE + INSERT)")
    void deveSubstituirTokenAnteriorNaRecuperacaoDeSenha() {
        ForgotPasswordDTO dto = new ForgotPasswordDTO("runner@taskrunning.com");
        PasswordResetToken anterior = tokenRecuperacao("token-antigo", LocalDateTime.now().plusMinutes(10), false);
        when(usuarioRepository.findFirstByEmailAndAtivoTrue(dto.email())).thenReturn(Optional.of(usuario));
        when(passwordResetTokenRepository.findByUsuario(usuario)).thenReturn(Optional.of(anterior));

        String token = authService.recuperarSenha(dto);

        assertNotNull(token);
        assertNotEquals("token-antigo", token);
        assertEquals(token, anterior.getToken());
        assertFalse(anterior.isUsado());
        assertTrue(anterior.getDataExpiracao().isAfter(LocalDateTime.now().plusMinutes(14)));
        assertTrue(anterior.getDataExpiracao().isBefore(LocalDateTime.now().plusMinutes(16)));
        verify(passwordResetTokenRepository).save(anterior);
        verify(passwordResetTokenRepository, never()).deleteByUsuario(any());
    }

    @Test
    @DisplayName("E-mail inexistente: nada é gravado nem enviado (resposta genérica no controller)")
    void naoGeraTokenParaEmailInexistente() {
        EmailService email = mock(EmailService.class);
        org.springframework.test.util.ReflectionTestUtils.setField(authService, "emailService", email);
        when(usuarioRepository.findFirstByEmailAndAtivoTrue("ninguem@x.com")).thenReturn(Optional.empty());

        assertNull(authService.recuperarSenha(new ForgotPasswordDTO("ninguem@x.com")));
        verify(passwordResetTokenRepository, never()).save(any());
        verifyNoInteractions(email);
    }

    @Test
    @DisplayName("Falha no provedor de e-mail é propagada (nunca vira 'recuperação concluída')")
    void falhaNoEnvioEhPropagada() {
        EmailService email = mock(EmailService.class);
        org.springframework.test.util.ReflectionTestUtils.setField(authService, "emailService", email);
        when(usuarioRepository.findFirstByEmailAndAtivoTrue(usuario.getEmail())).thenReturn(Optional.of(usuario));
        when(passwordResetTokenRepository.findByUsuario(usuario)).thenReturn(Optional.empty());
        doThrow(new com.taskrunning.api.exception.EmailIndisponivelException("timeout", null))
                .when(email).enviarRecuperacaoSenha(anyString(), any(), anyString());

        assertThrows(com.taskrunning.api.exception.EmailIndisponivelException.class,
                () -> authService.recuperarSenha(new ForgotPasswordDTO(usuario.getEmail())));
    }

    @Test
    @DisplayName("Solicitação repetida em menos de 60 s não reenvia o e-mail nem troca o token")
    void solicitacaoRepetidaNaoReenvia() {
        EmailService email = mock(EmailService.class);
        org.springframework.test.util.ReflectionTestUtils.setField(authService, "emailService", email);
        PasswordResetToken recente = tokenRecuperacao("recente", LocalDateTime.now().plusMinutes(15).minusSeconds(5), false);
        when(usuarioRepository.findFirstByEmailAndAtivoTrue(usuario.getEmail())).thenReturn(Optional.of(usuario));
        when(passwordResetTokenRepository.findByUsuario(usuario)).thenReturn(Optional.of(recente));

        assertNull(authService.recuperarSenha(new ForgotPasswordDTO(usuario.getEmail())));
        assertEquals("recente", recente.getToken());
        verifyNoInteractions(email);
    }

    @Test
    @DisplayName("Token já utilizado ou expirado não redefine a senha")
    void tokenUsadoOuExpiradoEhRecusado() {
        when(passwordResetTokenRepository.findByToken("usado"))
                .thenReturn(Optional.of(tokenRecuperacao("usado", LocalDateTime.now().plusMinutes(5), true)));
        when(passwordResetTokenRepository.findByToken("velho"))
                .thenReturn(Optional.of(tokenRecuperacao("velho", LocalDateTime.now().minusSeconds(1), false)));

        assertThrows(BusinessRuleException.class,
                () -> authService.redefinirSenha(new com.taskrunning.api.dto.request.ResetPasswordDTO("usado", "Nova@2026")));
        assertThrows(BusinessRuleException.class,
                () -> authService.redefinirSenha(new com.taskrunning.api.dto.request.ResetPasswordDTO("velho", "Nova@2026")));
        assertThrows(BusinessRuleException.class,
                () -> authService.redefinirSenha(new com.taskrunning.api.dto.request.ResetPasswordDTO("inexistente", "Nova@2026")));
        verify(usuarioRepository, never()).save(any());
    }

    private PasswordResetToken tokenRecuperacao(String valor, LocalDateTime expira, boolean usado) {
        PasswordResetToken t = new PasswordResetToken();
        t.setId(9L);
        t.setToken(valor);
        t.setUsuario(usuario);
        t.setDataExpiracao(expira);
        t.setUsado(usado);
        return t;
    }
}
