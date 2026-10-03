package com.taskrunning.api.dto.response;

public record TokenResponseDTO(
        String token,
        String tipo
) {
    public TokenResponseDTO(String token) {
        this(token, "Bearer");
    }
}