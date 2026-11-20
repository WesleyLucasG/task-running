package com.taskrunning.api.dto.response;

import com.taskrunning.api.enums.TipoBau;

/**
 * Resultado de um abate. {@code repetido = true} quando o mesmo idAbate já tinha sido processado:
 * o servidor devolve o resultado original e não paga de novo.
 */
public record AbateMonstroResponseDTO(
        boolean recompensado,
        String motivo,
        boolean repetido,
        int faseNumero,
        int xp,
        int moedas,
        Long bauId,
        TipoBau tipoBau,
        long abatesRecompensadosHoje,
        int limiteDiario,
        int nivel,
        long experienciaXp,
        long saldoMoedas
) {}
