package com.taskrunning.api.exception;

public class ResourceNotFoundException extends RuntimeException{

    public ResourceNotFoundException(String menssage){
        super(menssage);
    }

}
