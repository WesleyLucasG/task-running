package com.taskrunning.api.repository;

import com.taskrunning.api.entity.AbateMonstro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

public interface AbateMonstroRepository extends JpaRepository<AbateMonstro, Long> {

    Optional<AbateMonstro> findByUsuarioIdAndIdAbate(Long usuarioId, String idAbate);

    long countByUsuarioIdAndDiaAndRecompensadoTrue(Long usuarioId, LocalDate dia);

    long countByUsuarioIdAndDiaAndBauIdIsNotNull(Long usuarioId, LocalDate dia);

    long countByUsuarioIdAndRecompensadoTrueAndCriadoEmAfter(Long usuarioId, LocalDateTime desde);

    /** Metas: abates recompensados entre dois dias (inclusive). */
    long countByUsuarioIdAndRecompensadoTrueAndDiaBetween(Long usuarioId, LocalDate inicio, LocalDate fim);
}
