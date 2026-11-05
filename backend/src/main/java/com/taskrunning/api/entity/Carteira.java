package com.taskrunning.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "carteiras")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Carteira {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    @Column(name = "moedas", nullable = false)
    private Integer moedas = 0;

    @Column(name = "experiencia_xp", nullable = false)
    private Long experienciaXp = 0L;

    @Column(name = "nivel", nullable = false)
    private Integer nivel = 1;
}