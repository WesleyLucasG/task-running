package com.taskrunning.api.repository;

import com.taskrunning.api.entity.AparenciaAvatar;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AparenciaAvatarRepository extends JpaRepository<AparenciaAvatar, Long> {
    Optional<AparenciaAvatar> findByUsuarioId(Long usuarioId);
}
