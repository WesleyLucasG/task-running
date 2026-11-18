package com.taskrunning.api.dto.request;

import com.taskrunning.api.enums.Cabelo;
import com.taskrunning.api.enums.DetalheRoupa;
import com.taskrunning.api.enums.Genero;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AparenciaRequestDTO(
        @NotNull Genero genero,
        @NotNull Cabelo cabelo,
        @NotBlank String corCabelo,
        @NotBlank String corPele,
        @NotBlank String corRoupa,
        @NotNull DetalheRoupa detalheRoupa
) {}
