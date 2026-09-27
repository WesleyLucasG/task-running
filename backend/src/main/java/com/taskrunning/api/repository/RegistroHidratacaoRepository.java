package com.taskrunning.api.repository;

import com.taskrunning.api.entity.RegistroHidratacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface RegistroHidratacaoRepository extends JpaRepository<RegistroHidratacao, Long> {

    List<RegistroHidratacao> findByUsuarioIdAndDataRegistro(Long usuarioId, LocalDate dataRegistro);

    @Query("SELECT COALESCE(SUM(r.quantidadeMl), 0) FROM RegistroHidratacao r WHERE r.usuario.id = :usuarioId AND r.dataRegistro = :dataRegistro")
    Integer somarMlConsumidosNoDia(@Param("usuarioId") Long usuarioId, @Param("dataRegistro") LocalDate dataRegistro);
}