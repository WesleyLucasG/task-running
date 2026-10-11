package com.taskrunning.api.dto.response;

public record AvatarResponseDTO(
        Long id,
        String nome,
        String descricao,
        Integer precoMoedas,
        String imagemUrl,
        String raridade,
        Boolean adquirido,
        Boolean equipado
) {}