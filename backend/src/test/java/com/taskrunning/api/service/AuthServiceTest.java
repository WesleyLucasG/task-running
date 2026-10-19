package com.taskrunning.api.service;

import com.taskrunning.api.dto.request.CadastroUsuarioDTO;
import com.taskrunning.api.dto.request.LoginDTO;
import com.taskrunning.api.dto.response.TokenResponseDTO;
import com.taskrunning.api.entity.ConfiguracaoHidratacao;
import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.exception.BusinessRuleException;
import com.taskrunning.api.repository.ConfiguracaoHidratacaoRepository;
import com.taskrunning.api.repository.PasswordResetTokenRepository;
import com.taskrunning.api.repository.UsuarioRepository;
import com.taskrunning.api.security.TokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private TokenService tokenService;

    @Mock
    private ConfiguracaoHidratacaoRepository configuracaoHidratacaoRepository;

    @InjectMocks
    private AuthService authService;

    private CadastroUsuarioDTO cadastroDTO;
    private LoginDTO loginDTO;
    private Usuario usuario;

    @BeforeEach
    void setup() {
        cadastroDTO = new CadastroUsuarioDTO(
                "Kilo",
                "runner@taskrunning.com",
                "senha123",
                "12345678900",
                70.00
        );

        loginDTO = new LoginDTO(
                "runner@taskrunning.com",
                "senha123"
        );

        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setEmail("runner@taskrunning.com");
        usuario.setSenha("senhaCriptografada");
        usuario.setAtivo(true);
    }

    @Test
    @DisplayName("Deve lancar BusinessRuleException quando CPF ja estiver cadastrado entre usuarios ativos")
    void deveLancarExcecaoQuandoCpfJaCadastrado() {
        when(usuarioRepository.existsByCpfAndAtivoTrue(cadastroDTO.cpf())).thenReturn(true);

        BusinessRuleException exception = assertThrows(BusinessRuleException.class, () -> {
            authService.cadastrar(cadastroDTO);
        });

        assertEquals("CPF já cadastrado no sistema.", exception.getMessage());
        verify(usuarioRepository, never()).save(any());
        verify(configuracaoHidratacaoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve cadastrar usuario com e-mail preenchido e criar configuracao de hidratacao com sucesso")
    void deveCadastrarUsuarioComSucesso() {
        when(usuarioRepository.existsByCpfAndAtivoTrue(cadastroDTO.cpf())).thenReturn(false);
        when(passwordEncoder.encode("senha123")).thenReturn("senhaCriptografada");
        // CORREÇÃO: Stub do save para retornar o objeto usuario passado no repositório
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertDoesNotThrow(() -> authService.cadastrar(cadastroDTO));

        verify(usuarioRepository, times(1)).save(any(Usuario.class));
        verify(configuracaoHidratacaoRepository, times(1)).save(any(ConfiguracaoHidratacao.class));
    }

    @Test
    @DisplayName("Deve cadastrar usuario sem e-mail (opcional) com sucesso")
    void deveCadastrarUsuarioSemEmailComSucesso() {
        CadastroUsuarioDTO dtoSemEmail = new CadastroUsuarioDTO(
                "Kilo",
                null,
                "senha123",
                "12345678900",
                70.00
        );

        when(usuarioRepository.existsByCpfAndAtivoTrue(dtoSemEmail.cpf())).thenReturn(false);
        when(passwordEncoder.encode("senha123")).thenReturn("senhaCriptografada");
        // CORREÇÃO: Stub do save para retornar o objeto usuario passado no repositório
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertDoesNotThrow(() -> authService.cadastrar(dtoSemEmail));

        verify(usuarioRepository, times(1)).save(any(Usuario.class));
        verify(configuracaoHidratacaoRepository, times(1)).save(any(ConfiguracaoHidratacao.class));
    }

    @Test
    @DisplayName("Deve autenticar usuario ativo e retornar token JWT com sucesso")
    void deveAutenticarEGerarTokenComSucesso() {
        when(usuarioRepository.findByEmailAndAtivoTrue(loginDTO.email())).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches(loginDTO.senha(), usuario.getSenha())).thenReturn(true);
        when(tokenService.gerarToken(usuario)).thenReturn("tokenJwtFake123");

        TokenResponseDTO response = authService.login(loginDTO);

        assertNotNull(response);
        // CORREÇÃO: Ajuste na ordem dos campos do DTO
        assertEquals("tokenJwtFake123", response.token());
        assertEquals("Bearer", response.tipo());
    }
}