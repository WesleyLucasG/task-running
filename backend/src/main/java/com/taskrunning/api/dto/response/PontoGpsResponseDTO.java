package com.taskrunning.api.dto.response;

import java.time.LocalDateTime;

public record PontoGpsResponseDTO(
        Long id,
        Double latitude,
        Double longitude,
        Double altitude,
        LocalDateTime timestamp
) {}