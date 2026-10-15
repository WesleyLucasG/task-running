package com.taskrunning.api.repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.taskrunning.api.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByCpf(String cpf);
    @Modifying
    @Query(value = "DELETE FROM usuarios WHERE id = :id", nativeQuery = true)
    void deletarUsuarioPorIdNativo(@Param("id") Long id);
}
