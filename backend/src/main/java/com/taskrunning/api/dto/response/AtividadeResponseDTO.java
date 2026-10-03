package com.taskrunning.api.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record AtividadeResponseDTO(
        Long id,
        String identificadorLocal,
        String tipoAtividade,
        String status,
        LocalDateTime dataInicio,
        LocalDateTime dataFim,
        Long duracaoSegundos,
        Double distanciaMetros,
        Integer calorias,
        Double paceMedio,
        List<PontoGpsResponseDTO> pontosGps
) {}