package com.taskrunning.api.entity;

public enum PerfilAcesso {
    ADMIN("admin"),
    USER("user");

    private String role;

    PerfilAcesso(String role) {
        this.role = role;
    }

    public String getRole() {
        return role;
    }
}