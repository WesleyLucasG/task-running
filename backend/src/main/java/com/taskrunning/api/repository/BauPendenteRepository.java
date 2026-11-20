package com.taskrunning.api.repository;

import com.taskrunning.api.entity.BauPendente;
import com.taskrunning.api.enums.TipoBau;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BauPendenteRepository extends JpaRepository<BauPendente, Long> {
    List<BauPendente> findByUsuarioIdAndAbertoFalseOrderByCriadoEmAsc(Long usuarioId);
    long countByUsuarioIdAndAbertoFalse(Long usuarioId);
    Optional<BauPendente> findByIdAndUsuarioIdAndAbertoFalse(Long id, Long usuarioId);
    Optional<BauPendente> findByIdAndUsuarioId(Long id, Long usuarioId);

    /** RN14: já houve baú deste tipo no intervalo (dia de Brasília)? */
    boolean existsByUsuarioIdAndTipoAndCriadoEmGreaterThanEqualAndCriadoEmLessThan(
            Long usuarioId, TipoBau tipo, LocalDateTime inicio, LocalDateTime fim);

    /**
     * UC12: marca o baú como aberto SOMENTE se ainda estiver fechado. O banco aplica a condição de
     * forma atômica: com dois toques simultâneos, só uma transação altera a linha (retorna 1) e a
     * outra recebe 0 → 409, sem gerar um segundo item.
     */
    @Modifying
    @Query("UPDATE BauPendente b SET b.aberto = true, b.abertoEm = :agora WHERE b.id = :id AND b.usuario.id = :uid AND b.aberto = false")
    int marcarAberto(@Param("id") Long id, @Param("uid") Long usuarioId, @Param("agora") LocalDateTime agora);

    /** Metas: baús abertos no período (horário de Brasília). */
    long countByUsuarioIdAndAbertoTrueAndAbertoEmGreaterThanEqualAndAbertoEmLessThan(
            Long usuarioId, LocalDateTime inicio, LocalDateTime fim);
}
