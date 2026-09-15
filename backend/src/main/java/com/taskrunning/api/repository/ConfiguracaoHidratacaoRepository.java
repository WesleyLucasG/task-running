package com.taskrunning.api.repository;

import com.taskrunning.api.entity.ConfiguracaoHidratacao;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ConfiguracaoHidratacaoRepository extends JpaRepository<ConfiguracaoHidratacao, Long> {
    Optional<ConfiguracaoHidratacao> findByUsuarioId(Long usuarioId);
}