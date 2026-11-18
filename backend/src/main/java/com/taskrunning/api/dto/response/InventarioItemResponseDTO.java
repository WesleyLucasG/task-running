package com.taskrunning.api.dto.response;

import com.taskrunning.api.enums.Raridade;
import com.taskrunning.api.enums.TipoItem;

public record InventarioItemResponseDTO(
        long id,
        int itemId,
        String nome,
        TipoItem tipo,
        Raridade raridade,
        int bonusForca,
        int bonusVida,
        boolean equipado
) {}
