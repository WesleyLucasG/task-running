package com.taskrunning.api.dto.request;

import com.taskrunning.api.util.RegraSenha;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Etapa final da recuperação: e-mail + código recebido + nova senha (o código é conferido de novo aqui). */
public record ResetPasswordDTO(
        @NotBlank(message = "O e-mail é obrigatório.")
        @Email(message = "E-mail em formato inválido.")
        String email,

        @NotBlank(message = "O código é obrigatório.")
        String codigo,

        // RF08: mesma regra do cadastro (RegraSenha é a fonte única)
        @NotBlank(message = "A nova senha é obrigatória")
        @Size(min = RegraSenha.TAMANHO_MINIMO, message = "A senha deve ter no mínimo 8 caracteres")
        @Pattern(regexp = RegraSenha.REGEX, message = RegraSenha.MENSAGEM)
        String novaSenha
) {}
