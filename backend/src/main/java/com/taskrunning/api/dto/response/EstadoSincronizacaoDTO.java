package com.taskrunning.api.dto.response;

import java.time.LocalDateTime;

/** RN16: estado da atividade no servidor, para o app comparar por hash e enviar só a diferença. */
public record EstadoSincronizacaoDTO(
        String identificadorLocal,
        boolean existe,
        String status,
        long quantidadePontos,
        LocalDateTime ultimoTimestamp,
        String hashPontos
) {}
