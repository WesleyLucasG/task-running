package com.taskrunning.api.dto.response;

public record ResultadoAtaqueResponseDTO(
        int dano,
        int vidaRestante,
        int vidaMaxima,
        boolean derrotado,
        String proximaFase
) {}
