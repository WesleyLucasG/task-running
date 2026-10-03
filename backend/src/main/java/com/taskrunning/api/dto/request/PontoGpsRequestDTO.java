package com.taskrunning.api.dto.request;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record PontoGpsRequestDTO(
        @NotNull(message = "A latitude é obrigatória.")
        Double latitude,

        @NotNull(message = "A longitude é obrigatória.")
        Double longitude,

        Double altitude,

        @NotNull(message = "O timestamp do ponto do GPS é obrigatório.")
        LocalDateTime timestamp
) {}