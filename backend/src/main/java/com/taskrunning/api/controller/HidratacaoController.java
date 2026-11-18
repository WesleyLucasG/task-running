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
        HidratacaoResponseDTO status = hidratacaoService.obterStatusDiario(usuario.getCpf());
        return ResponseEntity.ok(status);
    }

    @PostMapping("/registrar")
    public ResponseEntity<HidratacaoResponseDTO> registrarConsumo(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody @Valid RegistrarAguaRequestDTO dto) {
        HidratacaoResponseDTO statusAtualizado = hidratacaoService.registrarConsumo(usuario.getCpf(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(statusAtualizado);
    }

    @GetMapping("/historico")
    public ResponseEntity<java.util.List<com.taskrunning.api.dto.response.HistoricoHidratacaoDTO>> historico(
            @AuthenticationPrincipal Usuario usuario,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "14") int dias) {
        return ResponseEntity.ok(hidratacaoService.historico(usuario.getCpf(), dias));
    }

    @PatchMapping("/lembrete")
    public ResponseEntity<Void> alterarStatusLembrete(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody @Valid ConfigurarLembreteRequestDTO dto) {
        hidratacaoService.alterarStatusLembrete(usuario.getCpf(), dto);
        return ResponseEntity.noContent().build();
    }
}