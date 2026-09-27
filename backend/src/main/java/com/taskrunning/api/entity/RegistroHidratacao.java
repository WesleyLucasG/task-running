package com.taskrunning.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Table(name = "registros_hidratacao")
@Entity(name = "RegistroHidratacao")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class RegistroHidratacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "quantidade_ml", nullable = false)
    private Integer quantidadeMl;

    @Column(name = "data_registro", nullable = false)
    private LocalDate dataRegistro;
}