package com.taskrunning.api.repository;

import com.taskrunning.api.entity.Carteira;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CarteiraRepository extends JpaRepository<Carteira, Long> {
    Optional<Carteira> findByUsuarioId(Long usuarioId);

    /**
     * RNF26: lê a carteira com trava de escrita (SELECT … FOR UPDATE) até o fim da transação.
     * Serializa, por usuário, as operações que creditam XP/moedas e as que contam limites diários,
     * evitando crédito perdido ou limite ultrapassado por requisições simultâneas.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Carteira c WHERE c.usuario.id = :uid")
    Optional<Carteira> travarPorUsuarioId(@Param("uid") Long usuarioId);
}
