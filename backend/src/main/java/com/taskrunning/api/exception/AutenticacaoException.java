package com.taskrunning.api.exception;

/** 401 Unauthorized: credenciais inválidas, conta bloqueada (RNF13) ou refresh token inválido. */
public class AutenticacaoException extends RuntimeException {
    public AutenticacaoException(String mensagem) {
        super(mensagem);
    }
}
