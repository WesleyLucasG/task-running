package com.taskrunning.api.dto.response;

import com.taskrunning.api.enums.Raridade;

/** Resultado da venda. {@code repetido = true}: o item já tinha sido vendido; nada foi pago de novo. */
public record VendaItemResponseDTO(
        long registroId,
        String nome,
        Raridade raridade,
        int moedas,
        long saldoMoedas,
        boolean repetido
) {}
