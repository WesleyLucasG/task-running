package com.taskrunning.api.util;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

/**
 * Metas diárias e semanais (extensão aprovada de engajamento). Recompensam só MOEDAS, nunca XP,
 * para não acelerar a curva de nível. Valores aprovados.
 *
 * Diárias: 3 por dia, uma de cada categoria; a variante (A/B) alterna pelo dia para variar a
 * dificuldade. Semanais: semana de segunda a domingo. Períodos sempre no fuso de Brasília do servidor.
 * Saúde: a hidratação nunca passa de 100% da meta pessoal e a corrida para em 2 km/dia e 5 km/semana.
 */
public final class RegrasMetas {

    public enum Periodo { DIARIA, SEMANAL }

    public enum Tipo { ABATES, ATIVIDADE_MIN_500M, DISTANCIA_M, AGUA_PCT, DIAS_ATIVIDADE, DIAS_META_AGUA, BAUS_ABERTOS, BONUS }

    public record Meta(String codigo, Periodo periodo, String categoria, Tipo tipo, int alvo,
                       String titulo, String descricao, String unidade, int moedas) {
        public boolean bonus() { return tipo == Tipo.BONUS; }
    }

    // Diárias (pares A/B por categoria)
    public static final Meta COMBATE_10 = new Meta("COMBATE_10", Periodo.DIARIA, "COMBATE", Tipo.ABATES, 10,
            "Caçador iniciante", "Derrote 10 monstros na esteira", "monstros", 5);
    public static final Meta COMBATE_25 = new Meta("COMBATE_25", Periodo.DIARIA, "COMBATE", Tipo.ABATES, 25,
            "Caçador dedicado", "Derrote 25 monstros na esteira", "monstros", 8);
    public static final Meta ATIVIDADE_1 = new Meta("ATIVIDADE_1", Periodo.DIARIA, "CORRIDA", Tipo.ATIVIDADE_MIN_500M, 1,
            "Passo do dia", "Complete 1 corrida ou caminhada de pelo menos 500 m", "atividade", 8);
    public static final Meta DISTANCIA_2KM = new Meta("DISTANCIA_2KM", Periodo.DIARIA, "CORRIDA", Tipo.DISTANCIA_M, 2000,
            "Estrada de Hermes", "Percorra 2 km no dia, somando corridas e caminhadas", "m", 12);
    public static final Meta AGUA_50 = new Meta("AGUA_50", Periodo.DIARIA, "HIDRATACAO", Tipo.AGUA_PCT, 50,
            "Meio cântaro", "Alcance 50% da sua meta de água de hoje", "ml", 5);
    public static final Meta AGUA_100 = new Meta("AGUA_100", Periodo.DIARIA, "HIDRATACAO", Tipo.AGUA_PCT, 100,
            "Fonte de Hebe", "Alcance a sua meta de água de hoje", "ml", 8);
    public static final Meta BONUS_DIARIO = new Meta("BONUS_DIARIO", Periodo.DIARIA, "BONUS", Tipo.BONUS, 3,
            "Dia completo", "Conclua as 3 metas do dia", "metas", 5);

    // Semanais
    public static final List<Meta> SEMANAIS = List.of(
            new Meta("SEMANA_5KM", Periodo.SEMANAL, "CORRIDA", Tipo.DISTANCIA_M, 5000,
                    "Maratonista da semana", "Percorra 5 km na semana", "m", 30),
            new Meta("SEMANA_3DIAS", Periodo.SEMANAL, "CORRIDA", Tipo.DIAS_ATIVIDADE, 3,
                    "Constância", "Faça atividades em 3 dias diferentes", "dias", 30),
            new Meta("SEMANA_AGUA_5DIAS", Periodo.SEMANAL, "HIDRATACAO", Tipo.DIAS_META_AGUA, 5,
                    "Hidratação em dia", "Alcance a meta de água em 5 dias diferentes", "dias", 30),
            new Meta("SEMANA_100_MONSTROS", Periodo.SEMANAL, "COMBATE", Tipo.ABATES, 100,
                    "Terror dos monstros", "Derrote 100 monstros na semana", "monstros", 20),
            new Meta("SEMANA_3BAUS", Periodo.SEMANAL, "PROGRESSAO", Tipo.BAUS_ABERTOS, 3,
                    "Caçador de tesouros", "Abra 3 baús na semana", "baús", 20),
            new Meta("BONUS_SEMANAL", Periodo.SEMANAL, "BONUS", Tipo.BONUS, 5,
                    "Semana lendária", "Conclua as 5 metas da semana", "metas", 40));

    private RegrasMetas() {}

    /** As 3 metas do dia + o bônus. Dia par: 10 monstros, 2 km, 50% da água; dia ímpar: 25, 1 atividade, 100%. */
    public static List<Meta> diariasDoDia(LocalDate dia) {
        boolean par = Math.floorMod(dia.toEpochDay(), 2) == 0;
        return List.of(
                par ? COMBATE_10 : COMBATE_25,
                par ? DISTANCIA_2KM : ATIVIDADE_1,
                par ? AGUA_50 : AGUA_100,
                BONUS_DIARIO);
    }

    public static LocalDate inicioSemana(LocalDate dia) {
        return dia.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }
}
