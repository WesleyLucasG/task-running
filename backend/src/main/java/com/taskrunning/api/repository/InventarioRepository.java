package com.taskrunning.api.repository;

import com.taskrunning.api.entity.Inventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventarioRepository extends JpaRepository<Inventario, Long> {
    List<Inventario> findByUsuarioId(Long usuarioId);
    Optional<Inventario> findByUsuarioIdAndAvatarId(Long usuarioId, Long avatarId);
    boolean existsByUsuarioIdAndAvatarId(Long usuarioId, Long avatarId);
    Optional<Inventario> findByUsuarioIdAndEquipadoTrue(Long usuarioId);
}