package com.taskrunning.api.entity;

import jakarta.persistence.*;
import lombok.*;

@Table(name = "configuracoes_hidratacao")
@Entity(name = "ConfiguracaoHidratacao")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class ConfiguracaoHidratacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    @Column(name = "meta_diaria_ml", nullable = false)
    private Integer metaDiariaMl;

    @Column(name = "lembrete_ativo", nullable = false)
    private Boolean lembreteAtivo = true;
}