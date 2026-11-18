package com.taskrunning.api.dto.request;

import jakarta.validation.constraints.NotNull;

/** RF10: liga/desliga o lembrete e, opcionalmente, define o intervalo (30, 60, 120, 180 ou 240 min). */
public record ConfigurarLembreteRequestDTO(
        @NotNull(message = "O status do lembrete deve ser informado.") Boolean lembreteAtivo,
        Integer intervaloMinutos
) {
    public ConfigurarLembreteRequestDTO(Boolean lembreteAtivo) {
        this(lembreteAtivo, null);
    }
}
