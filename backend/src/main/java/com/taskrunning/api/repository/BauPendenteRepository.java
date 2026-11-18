package com.taskrunning.api.repository;

import com.taskrunning.api.entity.BauPendente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BauPendenteRepository extends JpaRepository<BauPendente, Long> {
    List<BauPendente> findByUsuarioIdAndAbertoFalseOrderByCriadoEmAsc(Long usuarioId);
    long countByUsuarioIdAndAbertoFalse(Long usuarioId);
    Optional<BauPendente> findByIdAndUsuarioIdAndAbertoFalse(Long id, Long usuarioId);
}
