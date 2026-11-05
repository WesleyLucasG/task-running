package com.taskrunning.api.service;

import com.taskrunning.api.dto.request.PontoGpsRequestDTO;
import com.taskrunning.api.dto.request.SincronizarAtividadeRequestDTO;
import com.taskrunning.api.dto.response.AtividadeResponseDTO;
import com.taskrunning.api.entity.Atividade;
import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.enums.StatusAtividade;
import com.taskrunning.api.enums.TipoAtividade;
import com.taskrunning.api.exception.ResourceNotFoundException;
import com.taskrunning.api.repository.AtividadeRepository;
import com.taskrunning.api.repository.PontoGpsRepository;
import com.taskrunning.api.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AtividadeServiceTest {

    @Mock
    private AtividadeRepository atividadeRepository;

    @Mock
    private PontoGpsRepository pontoGpsRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private GamificacaoService gamificacaoService;

    @InjectMocks
    private AtividadeService atividadeService;

    private Usuario usuario;
    private SincronizarAtividadeRequestDTO dto;
    private String identificadorLocalUuid;

    @BeforeEach
    void setup() {
        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setCpf("12345678900");
        usuario.setEmail("runner@taskrunning.com");
        usuario.setPeso(70.0);

        identificadorLocalUuid = UUID.randomUUID().toString();

        PontoGpsRequestDTO ponto1 = new PontoGpsRequestDTO(-18.9186, -48.2772, 800.0, LocalDateTime.now().minusMinutes(30));
        PontoGpsRequestDTO ponto2 = new PontoGpsRequestDTO(-18.9276, -48.2772, 800.0, LocalDateTime.now());

        dto = new SincronizarAtividadeRequestDTO(
                identificadorLocalUuid,
                TipoAtividade.CORRIDA,
                LocalDateTime.now().minusMinutes(30),
                LocalDateTime.now(),
                1800L,
                List.of(ponto1, ponto2)
        );
    }

    @Test
    @DisplayName("Deve retornar atividade existente sem re-processar quando identificadorLocal ja existir (Idempotencia)")
    void deveRetornarAtividadeExistenteQuandoJaSincronizada() {
        Atividade atividadeExistente = new Atividade();
        atividadeExistente.setId(100L);
        atividadeExistente.setUsuario(usuario);
        atividadeExistente.setIdentificadorLocal(identificadorLocalUuid);
        atividadeExistente.setTipoAtividade(TipoAtividade.CORRIDA);
        atividadeExistente.setStatus(StatusAtividade.CONCLUIDA);
        atividadeExistente.setDuracaoSegundos(1800L);
        atividadeExistente.setDistanciaMetros(1000.0);
        atividadeExistente.setCalorias(300);
        atividadeExistente.setPaceMedio(5.0);

        when(usuarioRepository.findByCpfAndAtivoTrue(usuario.getCpf())).thenReturn(Optional.of(usuario));
        when(atividadeRepository.findByIdentificadorLocal(identificadorLocalUuid))
                .thenReturn(Optional.of(atividadeExistente));

        AtividadeResponseDTO resultado = atividadeService.sincronizarAtividade(usuario.getCpf(), dto);

        assertNotNull(resultado);
        assertEquals(identificadorLocalUuid, resultado.identificadorLocal());

        verify(atividadeRepository, never()).save(any());
        verify(gamificacaoService, never()).creditarRecompensaAtividade(any(), anyInt(), anyDouble());
    }

    @Test
    @DisplayName("Deve lancar ResourceNotFoundException quando o CPF do usuario nao for encontrado")
    void deveLancarExcecaoQuandoUsuarioNaoExiste() {
        when(usuarioRepository.findByCpfAndAtivoTrue("00000000000")).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            atividadeService.sincronizarAtividade("00000000000", dto);
        });

        assertEquals("Usuário não encontrado para o CPF: 00000000000", exception.getMessage());
        verify(atividadeRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve sincronizar nova atividade e creditar recompensa com sucesso")
    void deveSincronizarAtividadeComSucesso() {
        Atividade atividadeSalva = new Atividade();
        atividadeSalva.setId(1L);
        atividadeSalva.setUsuario(usuario);
        atividadeSalva.setIdentificadorLocal(identificadorLocalUuid);
        atividadeSalva.setTipoAtividade(TipoAtividade.CORRIDA);
        atividadeSalva.setStatus(StatusAtividade.CONCLUIDA);
        atividadeSalva.setCalorias(350);
        atividadeSalva.setDistanciaMetros(1000.0);

        when(usuarioRepository.findByCpfAndAtivoTrue(usuario.getCpf())).thenReturn(Optional.of(usuario));
        when(atividadeRepository.findByIdentificadorLocal(identificadorLocalUuid))
                .thenReturn(Optional.empty());
        when(atividadeRepository.save(any(Atividade.class))).thenReturn(atividadeSalva);

        AtividadeResponseDTO resultado = atividadeService.sincronizarAtividade(usuario.getCpf(), dto);

        assertNotNull(resultado);
        verify(atividadeRepository, times(1)).save(any(Atividade.class));
        verify(pontoGpsRepository, times(1)).saveAll(anyList());
        verify(gamificacaoService, times(1)).creditarRecompensaAtividade(eq(usuario), anyInt(), anyDouble());
    }
}