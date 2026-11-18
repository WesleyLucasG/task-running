package com.taskrunning.api.repository;

import com.taskrunning.api.entity.ProgressoFase;
import com.taskrunning.api.enums.SituacaoFase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProgressoFaseRepository extends JpaRepository<ProgressoFase, Long> {

    List<ProgressoFase> findByUsuarioIdOrderByFaseNumeroAsc(Long usuarioId);

    Optional<ProgressoFase> findByUsuarioIdAndFaseNumero(Long usuarioId, Integer faseNumero);

    Optional<ProgressoFase> findFirstByUsuarioIdAndSituacaoOrderByFaseNumeroAsc(Long usuarioId, SituacaoFase situacao);

    @Query("SELECT COUNT(p) FROM ProgressoFase p WHERE p.usuario.id = :id")
    long countByUsuarioId(@Param("id") Long usuarioId);
}
