package com.taskrunning.api.repository;

import com.taskrunning.api.entity.MetaResgatada;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface MetaResgatadaRepository extends JpaRepository<MetaResgatada, Long> {

    List<MetaResgatada> findByUsuarioIdAndPeriodoInicioIn(Long usuarioId, List<LocalDate> inicios);

    boolean existsByUsuarioIdAndCodigoAndPeriodoInicio(Long usuarioId, String codigo, LocalDate periodoInicio);
}
