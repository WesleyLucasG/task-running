package com.taskrunning.api.service;

import com.taskrunning.api.dto.response.CarteiraResponseDTO;
import com.taskrunning.api.entity.Avatar;
import com.taskrunning.api.entity.Carteira;
import com.taskrunning.api.entity.Inventario;
import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.repository.AvatarRepository;
import com.taskrunning.api.repository.CarteiraRepository;
import com.taskrunning.api.repository.InventarioRepository;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GamificacaoServiceTest {

    @Mock
    private CarteiraRepository carteiraRepository;

    @Mock
    private AvatarRepository avatarRepository;

    @Mock
    private InventarioRepository inventarioRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private GamificacaoService gamificacaoService;

    private Usuario usuario;
    private Carteira carteira;
    private Avatar avatarLendario;

    @BeforeEach
    void setup() {
        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setEmail("runner@taskrunning.com");

        carteira = new Carteira();
        carteira.setId(1L);
        carteira.setUsuario(usuario);
        carteira.setMoedas(50);
        carteira.setExperienciaXp(0L);
        carteira.setNivel(1);

        avatarLendario = new Avatar();
        avatarLendario.setId(10L);
        avatarLendario.setNome("Maratonista Lendário");
        avatarLendario.setPrecoMoedas(100);
    }

    @Test
    @DisplayName("Deve lancar excecao quando o usuario ja possuir o avatar no inventario")
    void deveLancarExcecaoQuandoAvatarJaFoiAdquirido() {
        when(usuarioRepository.findByEmail(usuario.getEmail())).thenReturn(Optional.of(usuario));
        when(carteiraRepository.findByUsuarioId(usuario.getId())).thenReturn(Optional.of(carteira));
        when(avatarRepository.findById(avatarLendario.getId())).thenReturn(Optional.of(avatarLendario));
        when(inventarioRepository.findByUsuarioIdAndAvatarId(usuario.getId(), avatarLendario.getId()))
                .thenReturn(Optional.of(new Inventario()));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            gamificacaoService.comprarAvatar(usuario.getEmail(), avatarLendario.getId());
        });

        assertEquals("Você já possui este avatar em seu inventário.", exception.getMessage());
        verify(carteiraRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve lancar excecao e nao deduzir moedas quando o saldo for insuficiente")
    void deveLancarExcecaoQuandoSaldoForInsuficiente() {
        when(usuarioRepository.findByEmail(usuario.getEmail())).thenReturn(Optional.of(usuario));
        when(carteiraRepository.findByUsuarioId(usuario.getId())).thenReturn(Optional.of(carteira));
        when(avatarRepository.findById(avatarLendario.getId())).thenReturn(Optional.of(avatarLendario));
        when(inventarioRepository.findByUsuarioIdAndAvatarId(usuario.getId(), avatarLendario.getId()))
                .thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            gamificacaoService.comprarAvatar(usuario.getEmail(), avatarLendario.getId());
        });

        assertEquals("Saldo insuficiente de moedas para comprar este avatar.", exception.getMessage());
        verify(carteiraRepository, never()).save(any());
        verify(inventarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve comprar avatar com sucesso quando usuario possuir saldo suficiente")
    void deveComprarAvatarComSucessoQuandoSaldoForSuficiente() {
        carteira.setMoedas(150);

        when(usuarioRepository.findByEmail(usuario.getEmail())).thenReturn(Optional.of(usuario));
        when(carteiraRepository.findByUsuarioId(usuario.getId())).thenReturn(Optional.of(carteira));
        when(avatarRepository.findById(avatarLendario.getId())).thenReturn(Optional.of(avatarLendario));
        when(inventarioRepository.findByUsuarioIdAndAvatarId(usuario.getId(), avatarLendario.getId()))
                .thenReturn(Optional.empty());

        CarteiraResponseDTO resultado = gamificacaoService.comprarAvatar(usuario.getEmail(), avatarLendario.getId());

        assertNotNull(resultado);
        assertEquals(50, carteira.getMoedas());
        verify(carteiraRepository, times(1)).save(carteira);
        verify(inventarioRepository, times(1)).save(any(Inventario.class));
    }

    @Test
    @DisplayName("Deve equipar avatar com sucesso substituindo o avatar equipado anterior")
    void deveEquiparAvatarComSucesso() {
        Inventario itemNovo = new Inventario();
        itemNovo.setAvatar(avatarLendario);
        itemNovo.setEquipado(false);

        Inventario itemAntigo = new Inventario();
        itemAntigo.setEquipado(true);

        when(usuarioRepository.findByEmail(usuario.getEmail())).thenReturn(Optional.of(usuario));
        when(inventarioRepository.findByUsuarioIdAndAvatarId(usuario.getId(), avatarLendario.getId()))
                .thenReturn(Optional.of(itemNovo));
        when(inventarioRepository.findByUsuarioIdAndEquipadoTrue(usuario.getId()))
                .thenReturn(Optional.of(itemAntigo));

        assertDoesNotThrow(() -> gamificacaoService.equiparAvatar(usuario.getEmail(), avatarLendario.getId()));

        assertFalse(itemAntigo.getEquipado());
        assertTrue(itemNovo.getEquipado());
        verify(inventarioRepository, times(2)).save(any(Inventario.class));
    }
}