package com.taskrunning.api.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record ErrorResponseDTO(
        LocalDateTime timestamp,
        Integer status,
        String error,
        String message,
        String path,
        List<FieldErrorDTO> errors
) {
    public ErrorResponseDTO(LocalDateTime timestamp, Integer status, String error, String message, String path) {
        this(timestamp, status, error, message, path, null);
    }

    public record FieldErrorDTO(
            String field,
            String message
    ) {}
}