package com.taskrunning.api.dto.response;

public record HidratacaoResponseDTO(
        Integer metaDiariaMl,
        Integer consumidoHojeMl,
        Double porcentagemConcluida,
        Boolean lembreteAtivo
) {}