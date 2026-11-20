package com.taskrunning.api.util;

import com.taskrunning.api.enums.TipoBau;

import java.util.function.DoubleSupplier;

/**
 * Extensão complementar de gameplay (aprovada; NÃO faz parte da RN10): recompensa por monstro comum
 * derrotado na esteira idle. Tabelas A e B aprovadas. Os números de vida/dano dos monstros ficam no
 * motor do app (mobile/src/domain/idle.ts); aqui ficam só as recompensas, que o servidor decide.
 *
 * Limites:
 * - 50 abates recompensados por dia e no máximo 2 baús de monstro por dia (data de Brasília);
 * - ritmo: o motor da esteira, mesmo com um herói que derrota tudo num golpe, não passa de
 *   6 abates em 10 s nem de 28 em 60 s (intervalo mínimo medido: 1,9 s). O servidor aceita até
 *   8 em 10 s e 32 em 60 s (folga para requisições que chegam juntas pela rede); acima disso o abate
 *   é registrado sem recompensa.
 * Limitação conhecida: o combate é simulado no aparelho, então o servidor não tem como provar que
 * o monstro foi derrotado. Os limites apenas tornam inútil forjar requisições (no máximo o mesmo
 * que alguns minutos de jogo honesto por dia).
 */
public final class RegrasMonstro {

    public static final int LIMITE_DIARIO_ABATES = 50;
    public static final int LIMITE_DIARIO_BAUS = 2;
    public static final int MAX_ABATES_10S = 8;
    public static final int MAX_ABATES_60S = 32;

    private static final int[] XP = {1, 2, 3, 4, 5};
    private static final int[] MOEDAS = {1, 1, 2, 2, 3};
    private static final double[] CHANCE_BAU = {0.02, 0.03, 0.04, 0.05, 0.06};
    /** Pesos (%) de Comum, Incomum e Raro por fase (Tabela B). */
    private static final int[][] RARIDADE = {
            {85, 15, 0},
            {75, 22, 3},
            {65, 28, 7},
            {55, 33, 12},
            {45, 38, 17},
    };

    private RegrasMonstro() {}

    private static int indice(int fase) {
        return Math.max(0, Math.min(XP.length - 1, fase - 1));
    }

    public static int xpPorAbate(int fase) {
        return XP[indice(fase)];
    }

    public static int moedasPorAbate(int fase) {
        return MOEDAS[indice(fase)];
    }

    public static double chanceBau(int fase) {
        return CHANCE_BAU[indice(fase)];
    }

    /** Sorteia o drop: null = sem baú. Usa dois números aleatórios em [0, 1). */
    public static TipoBau sortearBau(int fase, DoubleSupplier aleatorio) {
        if (aleatorio.getAsDouble() >= chanceBau(fase)) return null;
        int[] pesos = RARIDADE[indice(fase)];
        double r = aleatorio.getAsDouble() * 100;
        if (r < pesos[0]) return TipoBau.COMUM;
        if (r < pesos[0] + pesos[1]) return TipoBau.INCOMUM;
        return pesos[2] > 0 ? TipoBau.RARO : TipoBau.INCOMUM;
    }
}
