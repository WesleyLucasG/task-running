package com.taskrunning.api.dto.request;

import com.taskrunning.api.enums.TipoAtividade;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

/** RN16: envio incremental (delta) dos pontos de uma atividade ainda em andamento. */
public record EnviarPontosRequestDTO(
        @NotBlank(message = "O identificador local (UUID) é obrigatório.") String identificadorLocal,
        @NotNull(message = "O tipo de atividade é obrigatório.") TipoAtividade tipoAtividade,
        @NotNull(message = "A data/hora de início é obrigatória.") LocalDateTime dataInicio,
        @NotNull(message = "A lista de pontos é obrigatória.") @Valid List<PontoGpsRequestDTO> pontos
) {}
