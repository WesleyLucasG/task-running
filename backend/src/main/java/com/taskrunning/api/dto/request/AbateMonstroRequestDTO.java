package com.taskrunning.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * O app informa apenas o identificador do abate. Fase, XP, moedas e baú são decididos pelo servidor;
 * qualquer outro campo enviado é ignorado.
 */
public record AbateMonstroRequestDTO(
        @NotBlank
        @Pattern(regexp = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
                 message = "Identificador do abate inválido.")
        String idAbate
) {}
