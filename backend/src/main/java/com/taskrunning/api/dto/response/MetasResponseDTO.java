package com.taskrunning.api.dto.response;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Metas do jogador com o progresso calculado pelo servidor. O tempo restante vem do relógio do
 * servidor (fuso de Brasília), não do aparelho.
 */
public record MetasResponseDTO(
        List<MetaDTO> diarias,
        List<MetaDTO> semanais,
        LocalDateTime fimDiarias,
        LocalDateTime fimSemanais,
        long segundosParaRenovarDiarias,
        long segundosParaRenovarSemanais
) {
    public record MetaDTO(
            String codigo,
            String periodo,
            String categoria,
            String titulo,
            String descricao,
            long progresso,
            long alvo,
            String unidade,
            int moedas,
            boolean concluida,
            boolean resgatada,
            boolean bonus
    ) {}

    public record ResgateDTO(String codigo, int moedas, long saldoMoedas) {}
}
