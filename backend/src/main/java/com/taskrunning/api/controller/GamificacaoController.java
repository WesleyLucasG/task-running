package com.taskrunning.api.controller;

import com.taskrunning.api.dto.response.AvatarResponseDTO;
import com.taskrunning.api.dto.response.CarteiraResponseDTO;
import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.service.GamificacaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gamificacao")
@RequiredArgsConstructor
public class GamificacaoController {

    private final GamificacaoService gamificacaoService;

    @GetMapping("/carteira")
    public ResponseEntity<CarteiraResponseDTO> obterCarteira(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(gamificacaoService.obterCarteira(usuario.getCpf()));
    }

    @GetMapping("/loja")
    public ResponseEntity<List<AvatarResponseDTO>> listarLoja(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(gamificacaoService.listarLojaAvatares(usuario.getCpf()));
    }

    @PostMapping("/comprar/{avatarId}")
    public ResponseEntity<CarteiraResponseDTO> comprarAvatar(
            @PathVariable Long avatarId,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(gamificacaoService.comprarAvatar(usuario.getCpf(), avatarId));
    }

    @PutMapping("/equipar/{avatarId}")
    public ResponseEntity<Void> equiparAvatar(
            @PathVariable Long avatarId,
            @AuthenticationPrincipal Usuario usuario) {
        gamificacaoService.equiparAvatar(usuario.getCpf(), avatarId);
        return ResponseEntity.noContent().build();
    }
}