package com.taskrunning.api.repository;

import com.taskrunning.api.entity.PasswordResetToken;
import com.taskrunning.api.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);

    void deleteByUsuario(Usuario usuario);
}
