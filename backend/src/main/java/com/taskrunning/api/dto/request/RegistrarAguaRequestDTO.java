package com.taskrunning.api.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record RegistrarAguaRequestDTO(
        @NotNull(message = "A quantidade de água é obrigatória.")
        @Min(value = 50, message = "A quantidade mínima para registro é de 50ml.")
        Integer quantidadeMl
) {}