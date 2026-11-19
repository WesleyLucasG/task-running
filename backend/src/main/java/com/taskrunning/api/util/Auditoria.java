package com.taskrunning.api.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * RNF18/RNF19: trilha de auditoria das tentativas de autenticação e das ações críticas
 * (cadastro, alteração/recuperação de senha, sincronização de sessão offline).
 * Data e hora vêm do próprio log. RNF20: o e-mail sai mascarado e nunca entram senha, CPF,
 * tokens ou códigos de recuperação.
 */
public final class Auditoria {

    private static final Logger LOG = LoggerFactory.getLogger("AUDITORIA");

    private Auditoria() {}

    public static void registrar(String evento, String email, String resultado) {
        LOG.info("evento={} email={} resultado={}", evento, mascararEmail(email), resultado);
    }

    public static String mascararEmail(String email) {
        if (email == null || email.isBlank()) return "-";
        int arroba = email.indexOf('@');
        if (arroba <= 0) return "***";
        return email.substring(0, Math.min(2, arroba)) + "***" + email.substring(arroba);
    }
}
