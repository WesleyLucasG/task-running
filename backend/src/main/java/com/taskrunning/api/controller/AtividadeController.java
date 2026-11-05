package com.taskrunning.api.controller;

import com.taskrunning.api.dto.request.SincronizarAtividadeRequestDTO;
import com.taskrunning.api.dto.response.AtividadeResponseDTO;
import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.service.AtividadeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/atividades")
@RequiredArgsConstructor
public class AtividadeController {

    private final AtividadeService atividadeService;

    @PostMapping("/sincronizar")
    public ResponseEntity<AtividadeResponseDTO> sincronizarAtividade(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody @Valid SincronizarAtividadeRequestDTO dto) {

        // Passa o CPF explicitamente a partir do objeto do usuario logado
        AtividadeResponseDTO resposta = atividadeService.sincronizarAtividade(usuario.getCpf(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(resposta);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AtividadeResponseDTO> obterPorId(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario) {

        AtividadeResponseDTO resposta = atividadeService.obterPorId(id, usuario.getCpf());
        return ResponseEntity.ok(resposta);
    }
}