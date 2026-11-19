package com.taskrunning.api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Etapa 2 da recuperação: confere o código recebido por e-mail sem consumi-lo. */
public record ValidarCodigoDTO(
        @NotBlank(message = "O e-mail é obrigatório.")
        @Email(message = "E-mail em formato inválido.")
        String email,

        @NotBlank(message = "O código é obrigatório.")
        String codigo
) {}
