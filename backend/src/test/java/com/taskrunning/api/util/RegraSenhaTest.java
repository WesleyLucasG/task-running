package com.taskrunning.api.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RegraSenhaTest {

    @ParameterizedTest(name = "[{index}] \"{0}\" → {1}")
    @DisplayName("RF08: mínimo 8 caracteres, letra, número e caractere especial")
    @CsvSource(delimiter = '|', value = {
            "abc123!     | false",   // menos de 8 caracteres
            "abcdefgh!   | false",   // sem número
            "12345678!   | false",   // sem letra
            "Abcdefg1    | false",   // sem caractere especial
            "Abcdefg1!   | true",
            "Task@2026   | true",
            "ação2026!   | true",    // letras acentuadas contam como letra
            "ação20266   | false",   // "ç"/"ã" NÃO contam como caractere especial
            "Senha 2026  | false",   // espaço não é caractere especial
            "Ñandú#2026  | true",
            "пароль1!    | true",    // alfabeto cirílico
    })
    void validaRegra(String senha, boolean esperado) {
        assertEquals(esperado, RegraSenha.valida(senha.strip()));
    }
}
