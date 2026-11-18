package com.taskrunning.api.dto.response;

/**
 * Resposta do login/renovação. "token" e "tipo" continuam iguais (compatível com o frontend Web);
 * refreshToken e expiraEmSegundos foram acrescentados para a RNF07.
 */
public record TokenResponseDTO(String token, String tipo, String refreshToken, Long expiraEmSegundos) {

    public TokenResponseDTO(String token, String tipo) {
        this(token, tipo, null, null);
    }

    public TokenResponseDTO(String token) {
        this(token, "Bearer");
    }
}
