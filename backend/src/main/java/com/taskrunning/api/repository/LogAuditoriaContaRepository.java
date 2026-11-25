package com.taskrunning.api.repository;

import com.taskrunning.api.entity.LogAuditoriaConta;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LogAuditoriaContaRepository extends JpaRepository<LogAuditoriaConta, Long> {
    Page<LogAuditoriaConta> findByOperacao(String operacao, Pageable pageable);
}
