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

    /** Venda: apaga o registro só se for do usuário e NÃO estiver equipado (condição atômica no banco). */
    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM InventarioItem i WHERE i.id = :id AND i.usuario.id = :uid AND i.equipado = false")
    int apagarSeDesequipado(@Param("id") Long id, @Param("uid") Long usuarioId);

    @Query("SELECT COALESCE(SUM(i.item.bonusForca), 0) FROM InventarioItem i WHERE i.usuario.id = :uid AND i.equipado = true")
    int somaBonusForcaEquipado(@Param("uid") Long usuarioId);

    @Query("SELECT COALESCE(SUM(i.item.bonusVida), 0) FROM InventarioItem i WHERE i.usuario.id = :uid AND i.equipado = true")
    int somaBonusVidaEquipado(@Param("uid") Long usuarioId);

    @Query("SELECT COALESCE(SUM(i.item.bonusArmadura), 0) FROM InventarioItem i WHERE i.usuario.id = :uid AND i.equipado = true")
    int somaBonusArmaduraEquipado(@Param("uid") Long usuarioId);

    @Query("SELECT COALESCE(SUM(i.item.bonusAgilidade), 0) FROM InventarioItem i WHERE i.usuario.id = :uid AND i.equipado = true")
    int somaBonusAgilidadeEquipado(@Param("uid") Long usuarioId);
}
