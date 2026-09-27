package com.taskrunning.api.dto.request;

import jakarta.validation.constraints.NotNull;

public record ConfigurarLembreteRequestDTO(
        @NotNull(message = "O status do lembrete deve ser informado.")
        Boolean lembreteAtivo
) {}