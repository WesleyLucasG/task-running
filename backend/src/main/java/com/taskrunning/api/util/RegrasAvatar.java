package com.taskrunning.api.util;

/**
 * D42: regras de crescimento de atributos por nível, canônicas do servidor.
 * Base nível 1: Força 10, Agilidade 0, Vida 100. Cresce +2/+2/+10 por nível.
 * RN10: multiplicador de recompensa = 1 + agilidade × 0,005 (= 1 + 0,01 × (nível-1)), teto 1,5.
 *
 * RF19 (curva aprovada): para sair do nível n são necessários 50 × n + 50 XP
 * (100, 150, 200 … 500), até o nível máximo 10. O banco guarda só o XP TOTAL; nível e progresso
 * na barra são sempre calculados a partir dele, então nenhuma experiência é perdida e uma recompensa
 * grande pode subir vários níveis de uma vez. Corrida, hidratação e abates usam esta mesma regra.
 */
public final class RegrasAvatar {

    public static final int NIVEL_MAXIMO = 10;

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

    /** XP necessário para sair do nível informado; 0 no nível máximo. */
    public static int xpParaProximoNivel(int nivel) {
        if (nivel >= NIVEL_MAXIMO) return 0;
        return 50 * Math.max(1, nivel) + 50;
    }

    /** XP total acumulado necessário para chegar ao nível (nível 1 = 0, nível 10 = 2.700). */
    public static long xpTotalParaNivel(int nivel) {
        long total = 0;
        for (int n = 1; n < Math.min(nivel, NIVEL_MAXIMO); n++) total += xpParaProximoNivel(n);
        return total;
    }

    /** Nível correspondente ao XP total, limitado ao nível máximo. */
    public static int nivelPorXp(long xpTotal) {
        int nivel = 1;
        long restante = Math.max(0, xpTotal);
        while (nivel < NIVEL_MAXIMO && restante >= xpParaProximoNivel(nivel)) {
            restante -= xpParaProximoNivel(nivel);
            nivel++;
        }
        return nivel;
    }

    /** XP já conquistado dentro do nível atual (o que preenche a barra); 0 no nível máximo. */
    public static long xpNoNivel(long xpTotal) {
        int nivel = nivelPorXp(xpTotal);
        if (nivel >= NIVEL_MAXIMO) return 0;
        return Math.max(0, xpTotal) - xpTotalParaNivel(nivel);
    }
}
