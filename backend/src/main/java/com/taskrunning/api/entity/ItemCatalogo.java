package com.taskrunning.api.entity;

import com.taskrunning.api.enums.Raridade;
import com.taskrunning.api.enums.TipoItem;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "itens_catalogo")
@Getter
@Setter
@NoArgsConstructor
public class ItemCatalogo {

    @Id
    @Column(name = "item_id", nullable = false)
    private Integer itemId;

    @Column(nullable = false)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoItem tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Raridade raridade;

    @Column(name = "bonus_forca", nullable = false)
    private Integer bonusForca;

    @Column(name = "bonus_vida", nullable = false)
    private Integer bonusVida;
}
