package com.taskrunning.api.controller;

import com.taskrunning.api.dto.request.EnviarPontosRequestDTO;
import com.taskrunning.api.dto.request.SincronizarAtividadeRequestDTO;
import com.taskrunning.api.dto.response.AtividadeResponseDTO;
import com.taskrunning.api.dto.response.AtividadeResumoDTO;
import com.taskrunning.api.dto.response.EstadoSincronizacaoDTO;
import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.service.AtividadeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/atividades")
@RequiredArgsConstructor
public class AtividadeController {

    private final AtividadeService atividadeService;

    /** RF31: histórico paginado. */
    @GetMapping
    public ResponseEntity<Page<AtividadeResumoDTO>> listar(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        return ResponseEntity.ok(atividadeService.listar(usuario.getCpf(), pagina, tamanho));
    }

    /** UC09: finaliza a atividade (idempotente pelo identificadorLocal, RN04). */
    @PostMapping("/sincronizar")
    public ResponseEntity<AtividadeResponseDTO> sincronizarAtividade(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody @Valid SincronizarAtividadeRequestDTO dto) {
        AtividadeResponseDTO resposta = atividadeService.sincronizarAtividade(usuario.getCpf(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(resposta);
    }

    /** RN16: envio incremental de pontos durante a atividade. */
    @PostMapping("/sincronizacao/pontos")
    public ResponseEntity<EstadoSincronizacaoDTO> enviarPontos(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody @Valid EnviarPontosRequestDTO dto) {
        return ResponseEntity.ok(atividadeService.enviarPontos(usuario.getCpf(), dto));
    }

    /** RN16: estado (quantidade + hash dos pontos) para o app comparar com o local. */
    @GetMapping("/sincronizacao/{identificadorLocal}")
    public ResponseEntity<EstadoSincronizacaoDTO> obterEstado(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable String identificadorLocal) {
        return ResponseEntity.ok(atividadeService.obterEstado(usuario.getCpf(), identificadorLocal));
    }

    /** RF33: cancelar atividade em andamento. */
    @PostMapping("/{identificadorLocal}/cancelar")
    public ResponseEntity<Void> cancelar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable String identificadorLocal) {
        atividadeService.cancelar(usuario.getCpf(), identificadorLocal);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<AtividadeResponseDTO> obterPorId(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(atividadeService.obterPorId(id, usuario.getCpf()));
    }

    /** UC06: excluir atividade registrada. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id, @AuthenticationPrincipal Usuario usuario) {
        atividadeService.excluir(id, usuario.getCpf());
        return ResponseEntity.noContent().build();
    }
}
