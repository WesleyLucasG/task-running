package com.taskrunning.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/** Verificação de saúde para a nuvem e para o app checar se a API está no ar (sem dados sensíveis). */
@RestController
public class SaudeController {

    @GetMapping("/api/saude")
    public ResponseEntity<Map<String, String>> saude() {
        return ResponseEntity.ok(Map.of("status", "UP", "horario", Instant.now().toString()));
    }
}
