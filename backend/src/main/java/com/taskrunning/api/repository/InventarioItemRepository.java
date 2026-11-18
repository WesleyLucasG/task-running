package com.taskrunning.api.repository;

import com.taskrunning.api.entity.InventarioItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InventarioItemRepository extends JpaRepository<InventarioItem, Long> {
    List<InventarioItem> findByUsuarioIdOrderByIdAsc(Long usuarioId);
    Optional<InventarioItem> findByIdAndUsuarioId(Long id, Long usuarioId);

    @Query("SELECT COALESCE(SUM(i.item.bonusForca), 0) FROM InventarioItem i WHERE i.usuario.id = :uid AND i.equipado = true")
    int somaBonusForcaEquipado(@Param("uid") Long usuarioId);

    @Query("SELECT COALESCE(SUM(i.item.bonusVida), 0) FROM InventarioItem i WHERE i.usuario.id = :uid AND i.equipado = true")
    int somaBonusVidaEquipado(@Param("uid") Long usuarioId);
}
