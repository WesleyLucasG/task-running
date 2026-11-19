package com.taskrunning.api.exception;

/** O provedor de e-mail não aceitou a mensagem (rede, credencial, remetente não verificado, cota...). */
public class EmailIndisponivelException extends RuntimeException {

    public EmailIndisponivelException(String message, Throwable causa) {
        super(message, causa);
    }
}
