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

    // D45: colunas novas com padrão 0 no banco (o ddl-auto acrescenta sem apagar nada; itens antigos
    // ficam com 0 até a sincronização do catálogo na inicialização)
    @Column(name = "bonus_armadura", nullable = false, columnDefinition = "INT DEFAULT 0 NOT NULL")
    private Integer bonusArmadura = 0;

    @Column(name = "bonus_agilidade", nullable = false, columnDefinition = "INT DEFAULT 0 NOT NULL")
    private Integer bonusAgilidade = 0;
}
