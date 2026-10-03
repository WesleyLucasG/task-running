package com.taskrunning.api.controller;

import com.taskrunning.api.dto.request.SincronizarAtividadeRequestDTO;
import com.taskrunning.api.dto.response.AtividadeResponseDTO;
import com.taskrunning.api.service.AtividadeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/atividades")
@RequiredArgsConstructor
public class AtividadeController {

    private final AtividadeService atividadeService;

    @PostMapping("/sincronizar")
    public ResponseEntity<AtividadeResponseDTO> sincronizarAtividade(
            Authentication authentication,
            @RequestBody @Valid SincronizarAtividadeRequestDTO dto) {
        AtividadeResponseDTO resposta = atividadeService.sincronizarAtividade(authentication.getName(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(resposta);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AtividadeResponseDTO> obterPorId(
            @PathVariable Long id,
            Authentication authentication) {
        AtividadeResponseDTO resposta = atividadeService.obterPorId(id, authentication.getName());
        return ResponseEntity.ok(resposta);
    }
}