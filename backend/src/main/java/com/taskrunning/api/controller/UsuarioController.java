package com.taskrunning.api.controller;

import com.taskrunning.api.dto.request.AtualizarPerfilRequestDTO;
import com.taskrunning.api.dto.response.PerfilResponseDTO;
import com.taskrunning.api.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/perfil")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping
    public ResponseEntity<PerfilResponseDTO> obterPerfil(Authentication authentication) {
        PerfilResponseDTO perfil = usuarioService.obterPerfil(authentication.getName());
        return ResponseEntity.ok(perfil);
    }

    @PutMapping
    public ResponseEntity<PerfilResponseDTO> atualizarPerfil(
            Authentication authentication,
            @RequestBody @Valid AtualizarPerfilRequestDTO dto) {
        PerfilResponseDTO perfilAtualizado = usuarioService.atualizarPerfil(authentication.getName(), dto);
        return ResponseEntity.ok(perfilAtualizado);
    }
}