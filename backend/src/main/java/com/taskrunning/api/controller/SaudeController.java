package com.taskrunning.api.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/** Verificação de saúde para a nuvem e para o app checar se a API está no ar (sem dados sensíveis). */
@RestController
public class SaudeController {

    // O Render preenche RENDER_GIT_COMMIT a cada deploy: permite conferir se o último commit está no ar.
    @Value("${RENDER_GIT_COMMIT:local}")
    private String commit;

    @GetMapping("/api/saude")
    public ResponseEntity<Map<String, String>> saude() {
        String versao = commit.length() > 7 ? commit.substring(0, 7) : commit;
        return ResponseEntity.ok(Map.of("status", "UP", "horario", Instant.now().toString(), "versao", versao));
    }
}
