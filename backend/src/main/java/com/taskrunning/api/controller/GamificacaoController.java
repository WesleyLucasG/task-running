package com.taskrunning.api.controller;

import com.taskrunning.api.dto.response.AvatarResponseDTO;
import com.taskrunning.api.dto.response.CarteiraResponseDTO;
import com.taskrunning.api.service.GamificacaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gamificacao")
@RequiredArgsConstructor
public class GamificacaoController {

    private final GamificacaoService gamificacaoService;

    @GetMapping("/carteira")
    public ResponseEntity<CarteiraResponseDTO> obterCarteira(Authentication authentication) {
        return ResponseEntity.ok(gamificacaoService.obterCarteira(authentication.getName()));
    }

    @GetMapping("/loja")
    public ResponseEntity<List<AvatarResponseDTO>> listarLoja(Authentication authentication) {
        return ResponseEntity.ok(gamificacaoService.listarLojaAvatares(authentication.getName()));
    }

    @PostMapping("/comprar/{avatarId}")
    public ResponseEntity<CarteiraResponseDTO> comprarAvatar(
            @PathVariable Long avatarId,
            Authentication authentication) {
        return ResponseEntity.ok(gamificacaoService.comprarAvatar(authentication.getName(), avatarId));
    }

    @PutMapping("/equipar/{avatarId}")
    public ResponseEntity<Void> equiparAvatar(
            @PathVariable Long avatarId,
            Authentication authentication) {
        gamificacaoService.equiparAvatar(authentication.getName(), avatarId);
        return ResponseEntity.noContent().build();
    }
}