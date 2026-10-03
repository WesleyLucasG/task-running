package com.taskrunning.api.dto.request;

import com.taskrunning.api.enums.TipoAtividade;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.time.LocalDateTime;
import java.util.List;

public record SincronizarAtividadeRequestDTO(
        @NotBlank(message = "O identificador local (UUID) do aplicativo móvel é obrigatório.")
        String identificadorLocal,

        @NotNull(message = "O tipo de atividade é obrigatório (CORRIDA ou CAMINHADA).")
        TipoAtividade tipoAtividade,

        @NotNull(message = "A data/hora de início é obrigatória.")
        LocalDateTime dataInicio,

        @NotNull(message = "A data/hora de término é obrigatória.")
        LocalDateTime dataFim,

        @NotNull(message = "A duração em segundos é obrigatória.")
        @PositiveOrZero(message = "A duração não pode ser negativa.")
        Long duracaoSegundos,

        @NotEmpty(message = "A lista de pontos GPS não pode estar vazia.")
        @Valid
        List<PontoGpsRequestDTO> pontosGps
) {}