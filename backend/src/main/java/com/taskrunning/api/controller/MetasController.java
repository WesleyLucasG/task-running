package com.taskrunning.api.controller;

import com.taskrunning.api.dto.response.MetasResponseDTO;
import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.service.MetaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Metas diárias e semanais: progresso calculado no servidor; o app só exibe e pede o resgate. */
@RestController
@RequestMapping("/api/jogo/metas")
@RequiredArgsConstructor
public class MetasController {

    private final MetaService metaService;

    @GetMapping
    public ResponseEntity<MetasResponseDTO> listar(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(metaService.listar(usuario));
    }

    @PostMapping("/{codigo}/resgatar")
    public ResponseEntity<MetasResponseDTO.ResgateDTO> resgatar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable String codigo) {
        return ResponseEntity.ok(metaService.resgatar(usuario, codigo));
    }
}
