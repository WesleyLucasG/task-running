package com.taskrunning.api.entity;

import com.taskrunning.api.enums.Cabelo;
import com.taskrunning.api.enums.DetalheRoupa;
import com.taskrunning.api.enums.Genero;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "aparencias_avatar")
@Getter
@Setter
@NoArgsConstructor
public class AparenciaAvatar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Genero genero = Genero.MASCULINO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Cabelo cabelo = Cabelo.CURTO;

    @Column(name = "cor_cabelo", nullable = false, length = 10)
    private String corCabelo = "#3B2314";

    @Column(name = "cor_pele", nullable = false, length = 10)
    private String corPele = "#F1C27D";

    @Column(name = "cor_roupa", nullable = false, length = 10)
    private String corRoupa = "#F97316";

    @Enumerated(EnumType.STRING)
    @Column(name = "detalhe_roupa", nullable = false)
    private DetalheRoupa detalheRoupa = DetalheRoupa.SIMPLES;
}
