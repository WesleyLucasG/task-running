package com.taskrunning.api.dto.response;

import com.taskrunning.api.enums.TipoBau;

import java.time.LocalDateTime;

public record BauResponseDTO(long id, TipoBau tipo, LocalDateTime criadoEm) {}
