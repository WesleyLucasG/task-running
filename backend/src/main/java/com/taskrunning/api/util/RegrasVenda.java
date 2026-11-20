package com.taskrunning.api.util;

import com.taskrunning.api.enums.Raridade;

/** Venda de itens do inventário (aprovada): valor em moedas pela raridade REAL do item, decidido no servidor. */
public final class RegrasVenda {

    private RegrasVenda() {}

    public static int valor(Raridade raridade) {
        if (raridade == null) return 0;
        return switch (raridade) {
            case COMUM -> 10;
            case INCOMUM -> 25;
            case RARO -> 60;
            case EPICO -> 120;
            case LENDARIO -> 250;
        };
    }
}
