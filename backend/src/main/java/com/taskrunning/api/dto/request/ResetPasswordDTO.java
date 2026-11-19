package com.taskrunning.api.dto.request;

import com.taskrunning.api.util.RegraSenha;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordDTO(
        @NotBlank(message = "O token é obrigatório.")
        String token,

        // RF08: mesma regra do cadastro (RegraSenha é a fonte única)
        @NotBlank(message = "A nova senha é obrigatória")
        @Size(min = RegraSenha.TAMANHO_MINIMO, message = "A senha deve ter no mínimo 8 caracteres")
        @Pattern(regexp = RegraSenha.REGEX, message = RegraSenha.MENSAGEM)
        String novaSenha
) {}