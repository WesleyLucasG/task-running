package com.taskrunning.api.dto.response;

import java.time.LocalDate;

/** RF30: consumo total de água em um dia. */
public record HistoricoHidratacaoDTO(LocalDate data, Integer totalMl) {}
