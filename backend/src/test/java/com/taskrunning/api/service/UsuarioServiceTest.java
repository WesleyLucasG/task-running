package com.taskrunning.api.service;

import com.taskrunning.api.dto.request.AtualizarPerfilRequestDTO;
import com.taskrunning.api.dto.response.PerfilResponseDTO;
import com.taskrunning.api.entity.ConfiguracaoHidratacao;
import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.exception.ResourceNotFoundException;
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
        usuario.setAtivo(true);
    }

    @Test
    @DisplayName("Deve obter perfil do usuario ativo por CPF com sucesso")
    void deveObterPerfilComSucesso() {
        when(usuarioRepository.findByCpfAndAtivoTrue(usuario.getCpf())).thenReturn(Optional.of(usuario));

        PerfilResponseDTO perfil = usuarioService.obterPerfil(usuario.getCpf());

        assertNotNull(perfil);
        assertEquals("Corredor Sentinela", perfil.nome());
        assertEquals("runner@taskrunning.com", perfil.email());
        assertEquals("12345678900", perfil.cpf());
    }

    @Test
    @DisplayName("Deve lancar ResourceNotFoundException quando CPF nao for encontrado ou estiver inativo")
    void deveLancarExcecaoQuandoUsuarioNaoEncontrado() {
        when(usuarioRepository.findByCpfAndAtivoTrue("00000000000")).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            usuarioService.obterPerfil("00000000000");
        });

        assertTrue(exception.getMessage().contains("00000000000"));
    }

    @Test
    @DisplayName("Deve atualizar perfil e recalcular meta de agua com sucesso")
    void deveAtualizarPerfilEMetaDeAguaComSucesso() {
        AtualizarPerfilRequestDTO dto = mock(AtualizarPerfilRequestDTO.class);
        when(dto.nome()).thenReturn("Novo Nome");
        when(dto.peso()).thenReturn(80.0);

        ConfiguracaoHidratacao config = new ConfiguracaoHidratacao();
        config.setMetaDiariaMl(2800);

        when(usuarioRepository.findByCpfAndAtivoTrue(usuario.getCpf())).thenReturn(Optional.of(usuario));
        when(configuracaoHidratacaoRepository.findByUsuarioId(usuario.getId())).thenReturn(Optional.of(config));

        PerfilResponseDTO perfil = usuarioService.atualizarPerfil(usuario.getCpf(), dto);

        assertNotNull(perfil);
        assertEquals("Novo Nome", perfil.nome());
        assertEquals(80.0, perfil.peso());

        verify(usuarioRepository, times(1)).save(usuario);
        verify(configuracaoHidratacaoRepository, times(1)).save(config);
    }

    @Test
    @DisplayName("Deve inativar usuario (Soft Delete) alterando a flag ativo para false")
    void deveInativarUsuarioComSucesso() {
        when(usuarioRepository.findByCpfAndAtivoTrue(usuario.getCpf())).thenReturn(Optional.of(usuario));

        assertDoesNotThrow(() -> usuarioService.deletarPerfil(usuario.getCpf()));

        assertFalse(usuario.getAtivo());
        verify(usuarioRepository, times(1)).save(usuario);
        verify(usuarioRepository, never()).delete(any());
        verify(usuarioRepository, never()).deleteById(any());
    }
}