package com.taskrunning.api.exception;

/** 409 Conflict: dado já existente (ex.: CPF/e-mail cadastrado, UUID de outra conta). */
public class ConflictException extends RuntimeException {
    public ConflictException(String mensagem) {
        super(mensagem);
    }
}
