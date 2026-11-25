package com.taskrunning.api.repository;

import com.taskrunning.api.entity.LogAuditoriaEconomia;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LogAuditoriaEconomiaRepository extends JpaRepository<LogAuditoriaEconomia, Long> {
    Page<LogAuditoriaEconomia> findByOperacao(String operacao, Pageable pageable);
}
