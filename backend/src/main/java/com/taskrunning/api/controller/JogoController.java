package com.taskrunning.api.controller;

import com.taskrunning.api.dto.request.AparenciaRequestDTO;
import com.taskrunning.api.dto.request.AtacarChefeRequestDTO;
import com.taskrunning.api.dto.response.*;
import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.service.JogoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jogo")
@RequiredArgsConstructor
public class JogoController {

    private final JogoService jogoService;

    /** Estado completo do jogo: carteira, atributos, aparência, fases, chefe, baús. */
    @GetMapping("/estado")
    public ResponseEntity<EstadoJogoResponseDTO> estado(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(jogoService.obterEstado(usuario));
    }

    /** Salva a aparência do avatar (gênero, cabelo, cores, detalhe de roupa). */
    @PutMapping("/aparencia")
    public ResponseEntity<Void> salvarAparencia(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody @Valid AparenciaRequestDTO dto) {
        jogoService.salvarAparencia(usuario, dto);
        return ResponseEntity.noContent().build();
    }

    /** Lista baús pendentes (ainda não abertos). */
    @GetMapping("/baus")
    public ResponseEntity<List<BauResponseDTO>> listarBaus(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(jogoService.listarBaus(usuario));
    }

    /** Abre um baú específico e retorna o item sorteado. */
    @PostMapping("/baus/{id}/abrir")
    public ResponseEntity<InventarioItemResponseDTO> abrirBau(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable Long id) {
        return ResponseEntity.ok(jogoService.abrirBau(usuario, id));
    }

    /** Lista todos os itens do inventário do usuário. */
    @GetMapping("/inventario")
    public ResponseEntity<List<InventarioItemResponseDTO>> listarInventario(
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(jogoService.listarInventario(usuario));
    }

    /** Equipa ou desequipa um item do inventário. */
    @PutMapping("/inventario/{id}/equipar")
    public ResponseEntity<Void> alternarEquipado(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable Long id) {
        jogoService.alternarEquipado(usuario, id);
        return ResponseEntity.noContent().build();
    }

    /** Ataca o chefe da fase atual com o dano informado pelo app (limitado pela RN12). */
    @PostMapping("/chefe/atacar")
    public ResponseEntity<ResultadoAtaqueResponseDTO> atacarChefe(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody AtacarChefeRequestDTO dto) {
        return ResponseEntity.ok(jogoService.atacarChefe(usuario, dto));
    }
}
