package com.taskrunning.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordDTO {

    @NotBlank(message = "O token é obrigatório.")
    private String token;

    @NotBlank(message = "A nova senha é obrigatória")
    @Size(min = 8, message = "A senha deve ter no mínimo 8 caracteres")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "A senha deve conter letras e números")
    private String novaSenha;
}
