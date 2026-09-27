package com.taskrunning.api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordDTO {

    @NotBlank(message = "O e-mail é obrigatório.")
    @Email(message  = "E-mail em formato inválido.")
    private String email;
}
