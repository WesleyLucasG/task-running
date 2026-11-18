package com.taskrunning.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "fases")
@Getter
@Setter
@NoArgsConstructor
public class FaseCatalogo {

    @Id
    @Column(nullable = false)
    private Integer numero;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private String descricao;

    @Column(name = "meta_distancia_metros", nullable = false)
    private Integer metaDistanciaMetros;

    @Column(name = "chefe_nome", nullable = false)
    private String chefeNome;

    @Column(name = "chefe_vida_maxima", nullable = false)
    private Integer chefeVidaMaxima;
}
