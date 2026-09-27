package com.taskrunning.api.dto.response;

public record PerfilResponseDTO(
        Long id,
        String nome,
        String email,
        String cpf,
        Double peso,
        Double metaAguaMl,
        String perfil
) {}