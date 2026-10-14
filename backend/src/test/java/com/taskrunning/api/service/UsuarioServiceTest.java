package com.taskrunning.api.service;

import com.taskrunning.api.dto.request.AtualizarPerfilRequestDTO;
import com.taskrunning.api.dto.response.PerfilResponseDTO;
import com.taskrunning.api.entity.ConfiguracaoHidratacao;
import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.repository.ConfiguracaoHidratacaoRepository;
import com.taskrunning.api.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private ConfiguracaoHidratacaoRepository configuracaoHidratacaoRepository;

    @InjectMocks
    private UsuarioService usuarioService;

    private Usuario usuario;

    @BeforeEach
    void setup() {
        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setNome("Corredor Sentinela");
        usuario.setEmail("runner@taskrunning.com");
        usuario.setCpf("12345678900");
        usuario.setPeso(70.0);
        usuario.setMetaAguaMl(2450.0);
    }

    @Test
    @DisplayName("Deve obter perfil do usuario com sucesso")
    void deveObterPerfilComSucesso() {
        when(usuarioRepository.findByEmail(usuario.getEmail())).thenReturn(Optional.of(usuario));

        PerfilResponseDTO perfil = usuarioService.obterPerfil(usuario.getEmail());

        assertNotNull(perfil);
        assertEquals("Corredor Sentinela", perfil.nome());
        assertEquals("runner@taskrunning.com", perfil.email());
    }

    @Test
    @DisplayName("Deve lancar RuntimeException quando usuario nao for encontrado ao obter perfil")
    void deveLancarExcecaoQuandoUsuarioNaoEncontrado() {
        when(usuarioRepository.findByEmail("inexistente@taskrunning.com")).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            usuarioService.obterPerfil("inexistente@taskrunning.com");
        });

        assertEquals("Usuário não encontrado com o e-mail: inexistente@taskrunning.com", exception.getMessage());
    }

    @Test
    @DisplayName("Deve atualizar perfil e recalcular meta de agua com sucesso")
    void deveAtualizarPerfilEMetaDeAguaComSucesso() {
        AtualizarPerfilRequestDTO dto = mock(AtualizarPerfilRequestDTO.class);
        when(dto.nome()).thenReturn("Novo Nome");
        when(dto.peso()).thenReturn(80.0);

        ConfiguracaoHidratacao config = new ConfiguracaoHidratacao();

        when(usuarioRepository.findByEmail(usuario.getEmail())).thenReturn(Optional.of(usuario));
        when(configuracaoHidratacaoRepository.findByUsuarioId(usuario.getId())).thenReturn(Optional.of(config));

        PerfilResponseDTO perfil = usuarioService.atualizarPerfil(usuario.getEmail(), dto);

        assertNotNull(perfil);
        assertEquals("Novo Nome", perfil.nome());
        assertEquals(80.0, perfil.peso());
        assertEquals(2800.0, perfil.metaAguaMl()); // 80 * 35 = 2800

        verify(usuarioRepository, times(1)).save(usuario);
        verify(configuracaoHidratacaoRepository, times(1)).save(config);
    }
}