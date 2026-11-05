package com.taskrunning.api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginDTO(
        @NotBlank(message = "O CPF é obrigatório.")
        String cpf,

        @NotBlank(message = "A senha é obrigatória.")
        String senha
) {}