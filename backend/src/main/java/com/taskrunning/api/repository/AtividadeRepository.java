package com.taskrunning.api.repository;

import com.taskrunning.api.entity.Atividade;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AtividadeRepository extends JpaRepository<Atividade, Long> {

    Page<Atividade> findByUsuarioIdOrderByDataInicioDesc(Long usuarioId, Pageable pageable);

    Optional<Atividade> findByIdAndUsuarioId(Long id, Long usuarioId);

    Optional<Atividade> findByIdentificadorLocalAndUsuarioId(String identificadorLocal, Long usuarioId);
}