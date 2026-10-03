package com.taskrunning.api.dto.request;

import jakarta.validation.constraints.*;

public record CadastroUsuarioDTO(
        @NotBlank(message = "O nome é obrigatório.")
        String nome,

        @NotBlank(message = "O email é obrigatório.")
        @Email(message = "E-mail em formato inválido.")
        String email,

        @NotBlank(message = "A senha é obrigatória.")
        @Size(min = 8, message = "A senha deve ter no mínimo 8 caracteres")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "A senha deve conter letras e números")
        String senha,

        @NotBlank(message = "O CPF é obrigatório")
        String cpf,

        @NotNull(message = "O peso é obrigatório")
        @Positive(message = "O peso deve ser maior que zero")
        Double peso
) {}