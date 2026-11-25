package com.taskrunning.api.dto.response;

import com.fasterxml.jackson.annotation.JsonRawValue;
import com.taskrunning.api.entity.LogAuditoriaBase;

import java.time.LocalDateTime;

public record LogAuditoriaResponseDTO(
        Long id,
        String tabelaNome,
        String operacao,
        Long idRegistroAfetado,
        Long usuarioExecutorId,
        Long usuarioProprietarioId,
        @JsonRawValue String dadosAnteriores,
        @JsonRawValue String dadosNovos,
        LocalDateTime dataHora
) {
    public static LogAuditoriaResponseDTO from(LogAuditoriaBase log) {
        return new LogAuditoriaResponseDTO(
                log.getId(),
                log.getTabelaNome(),
                log.getOperacao(),
                log.getIdRegistroAfetado(),
                log.getUsuarioExecutorId(),
                log.getUsuarioProprietarioId(),
                blankToNull(log.getDadosAnteriores()),
                blankToNull(log.getDadosNovos()),
                log.getDataHora()
        );
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }
}
