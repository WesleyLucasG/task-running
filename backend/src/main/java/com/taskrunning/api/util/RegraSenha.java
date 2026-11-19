package com.taskrunning.api.util;

/**
 * RF08: a senha deve ter no mínimo 8 caracteres, ao menos uma letra, um número e um caractere especial.
 * Fonte única da regra no Backend (autoridade final da validação), usada no cadastro e na redefinição.
 *
 * Letras e números seguem as classes Unicode (\p{L} e \p{Nd}), então "é", "ç" ou "ñ" contam como letra,
 * e não como caractere especial. Caractere especial é qualquer símbolo que não seja letra, dígito ou espaço.
 * As mesmas regras existem no Web (frontend/src/utils/senha.ts) e no Mobile (mobile/src/domain/validacoes.ts).
 */
public final class RegraSenha {

    public static final int TAMANHO_MINIMO = 8;

    public static final String REGEX = "^(?=.*\\p{L})(?=.*\\p{Nd})(?=.*[^\\p{L}\\p{Nd}\\s]).{8,}$";

    public static final String MENSAGEM =
            "A senha deve ter no mínimo 8 caracteres, com pelo menos uma letra, um número e um caractere especial.";

    private RegraSenha() {}

    public static boolean valida(String senha) {
        return senha != null && senha.matches(REGEX);
    }
}
