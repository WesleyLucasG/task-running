package com.taskrunning.api.controller;

import com.taskrunning.api.dto.request.AtualizarPerfilRequestDTO;
import com.taskrunning.api.dto.response.PerfilResponseDTO;
import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/perfil")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping
    public ResponseEntity<PerfilResponseDTO> obterPerfil(@AuthenticationPrincipal Usuario usuario) {
        PerfilResponseDTO perfil = usuarioService.obterPerfil(usuario.getCpf());
        return ResponseEntity.ok(perfil);
    }

    @PutMapping
    public ResponseEntity<PerfilResponseDTO> atualizarPerfil(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody @Valid AtualizarPerfilRequestDTO dto) {
        PerfilResponseDTO perfil = usuarioService.atualizarPerfil(usuario.getCpf(), dto);
        return ResponseEntity.ok(perfil);
    }

    @DeleteMapping
    public ResponseEntity<Void> deletarPerfil(@AuthenticationPrincipal Usuario usuario) {
        usuarioService.deletarPerfil(usuario.getCpf());
        return ResponseEntity.noContent().build();
    }
}