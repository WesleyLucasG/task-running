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
    @Query(value = "DELETE FROM pontos_gps WHERE atividade_id IN (SELECT id FROM atividades WHERE usuario_id = :id)", nativeQuery = true)
        void deletarPontosGpsPorUsuarioId(@Param("id") Long id);
    
        @Modifying
        @Query(value = "DELETE FROM atividades WHERE usuario_id = :id", nativeQuery = true)
        void deletarAtividadesPorUsuarioId(@Param("id") Long id);
    
        @Modifying
        @Query(value = "DELETE FROM registros_hidratacao WHERE usuario_id = :id", nativeQuery = true)
        void deletarRegistrosHidratacaoPorUsuarioId(@Param("id") Long id);
    
        @Modifying
        @Query(value = "DELETE FROM inventario WHERE usuario_id = :id", nativeQuery = true)
        void deletarInventarioPorUsuarioId(@Param("id") Long id);
    
        @Modifying
        @Query(value = "DELETE FROM carteiras WHERE usuario_id = :id", nativeQuery = true)
        void deletarCarteiraPorUsuarioId(@Param("id") Long id);
    
        @Modifying
        @Query(value = "DELETE FROM configuracoes_hidratacao WHERE usuario_id = :id", nativeQuery = true)
        void deletarConfiguracaoHidratacaoPorUsuarioId(@Param("id") Long id);
    
        @Modifying
        @Query(value = "DELETE FROM tokens_recuperacao_senha WHERE usuario_id = :id", nativeQuery = true)
        void deletarTokensRecuperacaoPorUsuarioId(@Param("id") Long id);
    
        @Modifying
        @Query(value = "DELETE FROM usuarios WHERE id = :id", nativeQuery = true)
        void deletarUsuarioPorIdNativo(@Param("id") Long id);
}
