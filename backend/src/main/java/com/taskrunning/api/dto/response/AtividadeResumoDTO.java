package com.taskrunning.api.dto.response;

import java.time.LocalDateTime;

/** RF31: item do histórico (sem a lista de pontos). */
public record AtividadeResumoDTO(
        Long id,
        String identificadorLocal,
        String tipoAtividade,
        String status,
        LocalDateTime dataInicio,
        LocalDateTime dataFim,
        Long duracaoSegundos,
        Double distanciaMetros,
        Integer calorias,
        Double paceMedio
) {}
