package com.taskrunning.api.repository;

import com.taskrunning.api.entity.LogAuditoriaAtividade;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LogAuditoriaAtividadeRepository extends JpaRepository<LogAuditoriaAtividade, Long> {
    Page<LogAuditoriaAtividade> findByOperacao(String operacao, Pageable pageable);
}
