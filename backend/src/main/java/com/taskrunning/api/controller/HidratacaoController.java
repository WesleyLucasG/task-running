package com.taskrunning.api.controller;

import com.taskrunning.api.dto.request.ConfigurarLembreteRequestDTO;
import com.taskrunning.api.dto.request.RegistrarAguaRequestDTO;
import com.taskrunning.api.dto.response.HidratacaoResponseDTO;
import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.service.HidratacaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hidratacao")
@RequiredArgsConstructor
public class HidratacaoController {

    private final HidratacaoService hidratacaoService;

    @GetMapping
    public ResponseEntity<HidratacaoResponseDTO> obterStatusDiario(@AuthenticationPrincipal Usuario usuario) {
        HidratacaoResponseDTO status = hidratacaoService.obterStatusDiario(usuario.getEmail());
        return ResponseEntity.ok(status);
    }

    @PostMapping("/registrar")
    public ResponseEntity<HidratacaoResponseDTO> registrarConsumo(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody @Valid RegistrarAguaRequestDTO dto) {
        HidratacaoResponseDTO statusAtualizado = hidratacaoService.registrarConsumo(usuario.getUsername(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(statusAtualizado);
    }

    @PatchMapping("/lembrete")
    public ResponseEntity<Void> alterarStatusLembrete(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody @Valid ConfigurarLembreteRequestDTO dto) {
        hidratacaoService.alterarStatusLembrete(usuario.getUsername(), dto);
        return ResponseEntity.noContent().build();
    }
}