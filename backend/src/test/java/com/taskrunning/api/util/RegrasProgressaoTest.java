package com.taskrunning.api.util;

import com.taskrunning.api.enums.TipoBau;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.EnumMap;
import java.util.Map;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.*;

/** RNF16 — regras puras de nível (RF19) e da extensão de recompensa por monstro (Tabelas A, B e C). */
class RegrasProgressaoTest {

    @Test
    @DisplayName("Tabela C: XP por evolução, XP total acumulado e atributos do nível 1 ao 10")
    void tabelaDeNiveis() {
        int[] xpParaSubir = {100, 150, 200, 250, 300, 350, 400, 450, 500};
        long[] totalAcumulado = {0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700};
        for (int n = 1; n <= 10; n++) {
            assertEquals(totalAcumulado[n - 1], RegrasAvatar.xpTotalParaNivel(n), "XP total do nível " + n);
            assertEquals(n, RegrasAvatar.nivelPorXp(totalAcumulado[n - 1]), "entrar no nível " + n);
            if (n < 10) {
                assertEquals(xpParaSubir[n - 1], RegrasAvatar.xpParaProximoNivel(n));
                assertEquals(n, RegrasAvatar.nivelPorXp(totalAcumulado[n] - 1), "1 XP antes de subir do " + n);
            }
            assertEquals(10 + 2 * (n - 1), RegrasAvatar.forcaBase(n));
            assertEquals(2 * (n - 1), RegrasAvatar.agilidade(n));
            assertEquals(25 + 10 * (n - 1), RegrasAvatar.vidaMaxima(n));
        }
        // D45: tabela de vida aprovada
        int[] vida = {25, 35, 45, 55, 65, 75, 85, 95, 105, 115};
        for (int n = 1; n <= 10; n++) assertEquals(vida[n - 1], RegrasAvatar.vidaMaxima(n), "vida do nível " + n);
        assertEquals(28, RegrasAvatar.forcaBase(10));
        assertEquals(115, RegrasAvatar.vidaMaxima(10));
        assertEquals(0, RegrasAvatar.xpParaProximoNivel(10), "nível máximo não tem próximo nível");
    }

    @Test
    @DisplayName("Barra de XP: progresso dentro do nível, vários níveis de uma vez e teto 10")
    void barraDeXp() {
        assertEquals(0, RegrasAvatar.xpNoNivel(0));
        assertEquals(99, RegrasAvatar.xpNoNivel(99));
        assertEquals(0, RegrasAvatar.xpNoNivel(100));
        assertEquals(120, RegrasAvatar.xpNoNivel(370)); // nível 3 (250) + 120
        assertEquals(3, RegrasAvatar.nivelPorXp(370));
        // 0 → 800 XP numa única recompensa: sobe do 1 ao 5 de uma vez (700 = início do 5)
        assertEquals(5, RegrasAvatar.nivelPorXp(800));
        assertEquals(100, RegrasAvatar.xpNoNivel(800));
        // No 10 a barra fica cheia/fixa e o XP total continua sendo guardado
        assertEquals(10, RegrasAvatar.nivelPorXp(9999));
        assertEquals(0, RegrasAvatar.xpNoNivel(9999));
    }

    @Test
    @DisplayName("RN12 e RN10 continuam iguais (divisor 10; bônus de agilidade 0,5% por ponto)")
    void regrasOficiaisInalteradas() {
        assertEquals(10, RegrasAvatar.calcularDano(10, 0, 0));
        assertEquals(15, RegrasAvatar.calcularDano(10, 0, 5.0)); // 10 × (1 + 5/10)
        assertEquals(1.09, RegrasAvatar.multiplicadorRecompensa(10), 1e-9); // agilidade 18 × 0,005
    }

    @Test
    @DisplayName("Tabela A: XP e moedas por monstro em cada fase")
    void tabelaDeMonstros() {
        int[] xp = {1, 2, 3, 4, 5};
        int[] moedas = {1, 1, 2, 2, 3};
        double[] chance = {0.04, 0.05, 0.06, 0.07, 0.08}; // D45
        for (int f = 1; f <= 5; f++) {
            assertEquals(xp[f - 1], RegrasMonstro.xpPorAbate(f));
            assertEquals(moedas[f - 1], RegrasMonstro.moedasPorAbate(f));
            assertEquals(chance[f - 1], RegrasMonstro.chanceBau(f), 1e-9);
        }
        assertEquals(50, RegrasMonstro.LIMITE_DIARIO_ABATES);
        assertEquals(3, RegrasMonstro.LIMITE_DIARIO_BAUS);
    }

    @Test
    @DisplayName("D45: armadura reduz o dano recebido com teto de 60% e golpe mínimo 1")
    void armadura() {
        assertEquals(0.0, RegrasAvatar.reducaoDano(0), 1e-9);
        assertEquals(0.2, RegrasAvatar.reducaoDano(10), 1e-9);
        assertEquals(0.5, RegrasAvatar.reducaoDano(40), 1e-9);
        assertEquals(0.6, RegrasAvatar.reducaoDano(500), 1e-9, "teto de 60%");
        assertEquals(0.0, RegrasAvatar.reducaoDano(-5), 1e-9);
        assertEquals(5, RegrasAvatar.danoRecebido(5, 0));
        assertEquals(4, RegrasAvatar.danoRecebido(5, 10)); // 5 × 0,8
        assertEquals(1, RegrasAvatar.danoRecebido(1, 10_000), "nunca zero: ninguém fica invulnerável");
        assertEquals(2, RegrasAvatar.danoRecebido(5, 10_000), "60% de 5 = 3 absorvidos, 2 recebidos");
        for (int arm = 0; arm <= 1000; arm += 7) {
            for (int golpe = 1; golpe <= 30; golpe++) {
                int d = RegrasAvatar.danoRecebido(golpe, arm);
                assertTrue(d >= 1 && d <= golpe, "golpe " + golpe + " armadura " + arm);
            }
        }
    }

    @Test
    @DisplayName("D45: agilidade reduz o intervalo entre ataques, no máximo 30% (700 ms)")
    void agilidade() {
        assertEquals(1000, RegrasAvatar.intervaloAtaqueMs(0));
        assertEquals(847, RegrasAvatar.intervaloAtaqueMs(18)); // nível 10 sem itens
        assertEquals(700, RegrasAvatar.intervaloAtaqueMs(43));
        assertEquals(700, RegrasAvatar.intervaloAtaqueMs(10_000), "teto: ataques nunca descontrolados");
        int anterior = Integer.MAX_VALUE;
        for (int a = 0; a <= 100; a++) {
            int i = RegrasAvatar.intervaloAtaqueMs(a);
            assertTrue(i <= anterior && i >= 700);
            anterior = i;
        }
    }

    @Test
    @DisplayName("Tabela B: drop só Comum/Incomum/Raro (nunca Bronze/Prata/Ouro), nas proporções aprovadas")
    void tabelaDeDrops() {
        int[][] pesos = {{85, 15, 0}, {75, 22, 3}, {65, 28, 7}, {55, 33, 12}, {45, 38, 17}};
        int amostras = 400_000;
        for (int f = 1; f <= 5; f++) {
            Random rng = new Random(42 + f);
            Map<TipoBau, Integer> cont = new EnumMap<>(TipoBau.class);
            int drops = 0;
            for (int i = 0; i < amostras; i++) {
                TipoBau t = RegrasMonstro.sortearBau(f, rng::nextDouble);
                if (t == null) continue;
                drops++;
                cont.merge(t, 1, Integer::sum);
            }
            assertEquals(RegrasMonstro.chanceBau(f), drops / (double) amostras, 0.002, "chance de drop da fase " + f);
            for (TipoBau oficial : new TipoBau[]{TipoBau.BRONZE, TipoBau.PRATA, TipoBau.OURO, TipoBau.LENDARIO}) {
                assertFalse(cont.containsKey(oficial), "monstro não pode deixar " + oficial);
            }
            assertEquals(pesos[f - 1][0] / 100.0, cont.getOrDefault(TipoBau.COMUM, 0) / (double) drops, 0.02, "Comum fase " + f);
            assertEquals(pesos[f - 1][1] / 100.0, cont.getOrDefault(TipoBau.INCOMUM, 0) / (double) drops, 0.02, "Incomum fase " + f);
            assertEquals(pesos[f - 1][2] / 100.0, cont.getOrDefault(TipoBau.RARO, 0) / (double) drops, 0.02, "Raro fase " + f);
        }
        // Valores fixos: 0,0399 cai no drop; 0,04 não cai (fase 1)
        assertEquals(TipoBau.COMUM, RegrasMonstro.sortearBau(1, sequencia(0.0399, 0.10)));
        assertEquals(TipoBau.INCOMUM, RegrasMonstro.sortearBau(1, sequencia(0.0399, 0.90)));
        assertNull(RegrasMonstro.sortearBau(1, sequencia(0.04, 0.0)));
        assertEquals(TipoBau.RARO, RegrasMonstro.sortearBau(5, sequencia(0.0, 0.99)));
    }

    private static java.util.function.DoubleSupplier sequencia(double... valores) {
        int[] i = {0};
        return () -> valores[i[0]++];
    }
}
