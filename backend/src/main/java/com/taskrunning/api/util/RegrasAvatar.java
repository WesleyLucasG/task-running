package com.taskrunning.api.util;

/**
 * D42: regras de crescimento de atributos por nível, canônicas do servidor.
 * Base nível 1: Força 10, Agilidade 0, Vida 100. Cresce +2/+2/+10 por nível.
 * RN10: multiplicador de recompensa = 1 + 0,01 × (nível-1), teto 1,5 a partir do nível 51.
 */
public final class RegrasAvatar {

    private RegrasAvatar() {}

    public static int forcaBase(int nivel) {
        return 10 + 2 * (nivel - 1);
    }

    public static int agilidade(int nivel) {
        return 2 * (nivel - 1);
    }

    public static int vidaMaxima(int nivel) {
        return 100 + 10 * (nivel - 1);
    }

    public static double multiplicadorRecompensa(int nivel) {
        return Math.min(1.5, 1.0 + 0.01 * (nivel - 1));
    }

    /** RN12: dano = max(1, floor((forcaBase + bonusItens) * (1 + maiorKm / 10))) */
    public static int calcularDano(int forcaBase, int bonusItens, double maiorKm) {
        return Math.max(1, (int) Math.floor((forcaBase + bonusItens) * (1.0 + maiorKm / 10.0)));
    }

    public static int xpParaProximoNivel(int nivel) {
        return nivel * 1000;
    }
}
