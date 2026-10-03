package com.taskrunning.api.enums;

public enum TipoAtividade {
    CORRIDA(8.0),
    CAMINHADA(3.8);

    private final double met;

    TipoAtividade(double met) {
        this.met = met;
    }

    public double getMet() {
        return met;
    }
}