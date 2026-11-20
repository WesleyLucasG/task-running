package com.taskrunning.api.repository;

import com.taskrunning.api.entity.Atividade;
import com.taskrunning.api.entity.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AtividadeRepository extends JpaRepository<Atividade, Long> {

    Page<Atividade> findByUsuarioIdOrderByDataInicioDesc(Long usuarioId, Pageable pageable);

    Optional<Atividade> findByIdAndUsuarioId(Long id, Long usuarioId);

    Optional<Atividade> findByIdentificadorLocal(String identificadorLocal);

    Optional<Atividade> findByIdentificadorLocalAndUsuarioId(String identificadorLocal, Long usuarioId);

    List<Atividade> findByUsuarioAndStatusAndDataFimAfter(
            Usuario usuario,
            com.taskrunning.api.enums.StatusAtividade status,
            LocalDateTime dataFim);

    /** Metas: atividades de um status com dataFim no intervalo [inicio, fim). */
    List<Atividade> findByUsuarioIdAndStatusAndDataFimGreaterThanEqualAndDataFimLessThan(
            Long usuarioId,
            com.taskrunning.api.enums.StatusAtividade status,
            LocalDateTime inicio,
            LocalDateTime fim);
}