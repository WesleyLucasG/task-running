package com.taskrunning.api.repository;

import com.taskrunning.api.entity.VendaItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VendaItemRepository extends JpaRepository<VendaItem, Long> {
    Optional<VendaItem> findByUsuarioIdAndInventarioItemId(Long usuarioId, Long inventarioItemId);
}
