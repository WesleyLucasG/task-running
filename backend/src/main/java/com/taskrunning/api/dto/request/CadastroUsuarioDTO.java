package com.taskrunning.api.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CadastroUsuarioDTO {

    @NotBlank(message = "O nome é obrigatório.")
    private String nome;

    @NotBlank(message = "O email é obrigatório.")
    @Email(message = "E-mail em formato inválido.")
    private String email;

    @NotBlank(message = "A senha é obrigatória.")
    @Size(min = 8, message = "A senha deve ter no mínimo 8 caracteres")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "A senha deve conter letras e números")
    private String senha;

    @NotBlank(message = "O CPF é obrigatório")
    private String cpf;

    @NotNull(message = "O peso é obrigatório")
    @Positive(message = "O peso deve ser maior que zero")
    private Double peso;
}
