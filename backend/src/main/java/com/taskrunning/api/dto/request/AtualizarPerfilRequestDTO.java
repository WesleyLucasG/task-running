package com.taskrunning.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record AtualizarPerfilRequestDTO(
        @NotBlank(message = "O nome é obrigatório.")
        String nome,

        @NotNull(message = "O peso é obrigatório.")
        @Positive(message = "O peso deve ser maior que zero.")
        Double peso
) {}