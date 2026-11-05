package com.taskrunning.api.config;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AuditContextInterceptor {

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public void registrarUsuarioExecutor(Long usuarioId) {
        entityManager.createNativeQuery("SET @usuario_executor_id = :id")
                .setParameter("id", usuarioId)
                .executeUpdate();
    }
}