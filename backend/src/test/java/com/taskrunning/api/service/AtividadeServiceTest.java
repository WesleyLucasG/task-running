package com.taskrunning.api.service;

import com.taskrunning.api.dto.request.EnviarPontosRequestDTO;
import com.taskrunning.api.dto.request.PontoGpsRequestDTO;
import com.taskrunning.api.dto.request.SincronizarAtividadeRequestDTO;
import com.taskrunning.api.dto.response.AtividadeResponseDTO;
import com.taskrunning.api.dto.response.EstadoSincronizacaoDTO;
import com.taskrunning.api.entity.Atividade;
import com.taskrunning.api.entity.PontoGps;
import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.enums.StatusAtividade;
import com.taskrunning.api.enums.TipoAtividade;
import com.taskrunning.api.exception.ConflictException;
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
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AtividadeServiceTest {

    @Mock private AtividadeRepository atividadeRepository;
    @Mock private PontoGpsRepository pontoGpsRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private GamificacaoService gamificacaoService;

    @InjectMocks
    private AtividadeService atividadeService;

    private final List<PontoGps> banco = new ArrayList<>(); // pontos "gravados"
    private Usuario usuario;
    private String uuid;
    private final LocalDateTime t0 = LocalDateTime.of(2026, 11, 17, 7, 0, 0);

    @BeforeEach
    void setup() {
        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setCpf("enc:v1:abc");
        usuario.setPeso(70.0);
        uuid = UUID.randomUUID().toString();
        lenient().when(usuarioRepository.findByCpfAndAtivoTrue("enc:v1:abc")).thenReturn(Optional.of(usuario));
        lenient().when(atividadeRepository.save(any(Atividade.class))).thenAnswer(i -> {
            Atividade a = i.getArgument(0);
            if (a.getId() == null) a.setId(10L);
            return a;
        });
        lenient().when(pontoGpsRepository.saveAll(anyCollection())).thenAnswer(i -> {
            banco.addAll((Collection<PontoGps>) i.getArgument(0));
            return i.getArgument(0);
        });
        lenient().when(pontoGpsRepository.findByAtividadeIdOrderByTimestampAsc(anyLong())).thenAnswer(i ->
                banco.stream().sorted((a, b) -> a.getTimestamp().compareTo(b.getTimestamp())).toList());
    }

    private PontoGpsRequestDTO ponto(double lat, double lon, int segundos) {
        return new PontoGpsRequestDTO(lat, lon, null, t0.plusSeconds(segundos));
    }

    private SincronizarAtividadeRequestDTO finalizar(List<PontoGpsRequestDTO> pontos, int duracaoSeg) {
        return new SincronizarAtividadeRequestDTO(uuid, TipoAtividade.CORRIDA, t0, t0.plusSeconds(duracaoSeg),
                (long) duracaoSeg, pontos);
    }

    @Test
    @DisplayName("RN04: reenvio de atividade já concluída não grava nem recompensa de novo")
    void deveRetornarAtividadeExistenteQuandoJaSincronizada() {
        Atividade existente = new Atividade();
        existente.setId(5L);
        existente.setUsuario(usuario);
        existente.setIdentificadorLocal(uuid);
        existente.setTipoAtividade(TipoAtividade.CORRIDA);
        existente.setStatus(StatusAtividade.CONCLUIDA);
        when(atividadeRepository.findByIdentificadorLocal(uuid)).thenReturn(Optional.of(existente));

        AtividadeResponseDTO r = atividadeService.sincronizarAtividade("enc:v1:abc", finalizar(List.of(), 60));

        assertEquals(5L, r.id());
        verify(atividadeRepository, never()).save(any());
        verify(gamificacaoService, never()).creditarRecompensaAtividade(any(), anyInt(), anyDouble());
    }

    @Test
    @DisplayName("RN07: UUID pertencente a outra conta gera conflito")
    void deveRecusarUuidDeOutroUsuario() {
        Usuario outro = new Usuario();
        outro.setId(99L);
        Atividade alheia = new Atividade();
        alheia.setUsuario(outro);
        alheia.setStatus(StatusAtividade.CONCLUIDA);
        when(atividadeRepository.findByIdentificadorLocal(uuid)).thenReturn(Optional.of(alheia));
        assertThrows(ConflictException.class,
                () -> atividadeService.sincronizarAtividade("enc:v1:abc", finalizar(List.of(), 60)));
    }

    @Test
    @DisplayName("RNF20: usuário inexistente não expõe o CPF na mensagem")
    void deveLancarExcecaoQuandoUsuarioNaoExiste() {
        when(usuarioRepository.findByCpfAndAtivoTrue("x")).thenReturn(Optional.empty());
        ResourceNotFoundException e = assertThrows(ResourceNotFoundException.class,
                () -> atividadeService.sincronizarAtividade("x", finalizar(List.of(), 60)));
        assertEquals("Usuário não encontrado.", e.getMessage());
    }

    @Test
    @DisplayName("Sincroniza, descarta coordenadas inválidas (RN02), calcula duração por datas (RN06) e recompensa uma vez")
    void deveSincronizarAtividadeComSucesso() {
        when(atividadeRepository.findByIdentificadorLocal(uuid)).thenReturn(Optional.empty());
        // ~111 m a cada 60 s (6,7 km/h) + um ponto inválido (latitude 95)
        var pontos = List.of(ponto(-18.9000, -48.2700, 0), ponto(95, -48.27, 30),
                ponto(-18.9010, -48.2700, 60), ponto(-18.9020, -48.2700, 120));

        AtividadeResponseDTO r = atividadeService.sincronizarAtividade("enc:v1:abc", finalizar(pontos, 120));

        assertEquals("CONCLUIDA", r.status());
        assertEquals(3, banco.size());
        assertEquals(120L, r.duracaoSegundos());
        assertTrue(r.distanciaMetros() > 215 && r.distanciaMetros() < 230, "distância " + r.distanciaMetros());
        verify(gamificacaoService, times(1)).creditarRecompensaAtividade(eq(usuario), anyInt(), anyDouble());
    }

    @Test
    @DisplayName("RNF12: segmento acima de 30 km/h não soma distância")
    void deveDescartarSegmentoImplausivel() {
        when(atividadeRepository.findByIdentificadorLocal(uuid)).thenReturn(Optional.empty());
        // 1,1 km em 10 s (~400 km/h) seguido de 111 m em 60 s
        var pontos = List.of(ponto(-18.9000, -48.27, 0), ponto(-18.9100, -48.27, 10), ponto(-18.9110, -48.27, 70));

        AtividadeResponseDTO r = atividadeService.sincronizarAtividade("enc:v1:abc", finalizar(pontos, 70));

        assertTrue(r.distanciaMetros() > 105 && r.distanciaMetros() < 120, "distância " + r.distanciaMetros());
    }

    @Test
    @DisplayName("RN16: delta de pontos não duplica pontos repetidos e o estado reflete o hash")
    void deveAcumularDeltaSemDuplicar() {
        when(atividadeRepository.findByIdentificadorLocal(uuid)).thenReturn(Optional.empty());
        var lote1 = List.of(ponto(-18.9000, -48.27, 0), ponto(-18.9010, -48.27, 60));
        EstadoSincronizacaoDTO e1 = atividadeService.enviarPontos("enc:v1:abc",
                new EnviarPontosRequestDTO(uuid, TipoAtividade.CORRIDA, t0, lote1));
        assertEquals(2, e1.quantidadePontos());
        assertEquals("EM_ANDAMENTO", e1.status());

        // O segundo lote repete o último ponto (reenvio) e traz um novo
        Atividade emAndamento = new Atividade();
        emAndamento.setId(10L);
        emAndamento.setUsuario(usuario);
        emAndamento.setIdentificadorLocal(uuid);
        emAndamento.setTipoAtividade(TipoAtividade.CORRIDA);
        emAndamento.setStatus(StatusAtividade.EM_ANDAMENTO);
        emAndamento.setDataInicio(t0);
        when(atividadeRepository.findByIdentificadorLocal(uuid)).thenReturn(Optional.of(emAndamento));
        var lote2 = List.of(ponto(-18.9010, -48.27, 60), ponto(-18.9020, -48.27, 120));
        EstadoSincronizacaoDTO e2 = atividadeService.enviarPontos("enc:v1:abc",
                new EnviarPontosRequestDTO(uuid, TipoAtividade.CORRIDA, t0, lote2));
        assertEquals(3, e2.quantidadePontos());
        assertNotEquals(e1.hashPontos(), e2.hashPontos());

        // Finalizar sem pontos novos (tudo já foi por delta) conclui e recompensa uma vez
        AtividadeResponseDTO fim = atividadeService.sincronizarAtividade("enc:v1:abc", finalizar(List.of(), 120));
        assertEquals("CONCLUIDA", fim.status());
        assertEquals(3, fim.pontosGps().size());
        verify(gamificacaoService, times(1)).creditarRecompensaAtividade(eq(usuario), anyInt(), anyDouble());
    }
}
