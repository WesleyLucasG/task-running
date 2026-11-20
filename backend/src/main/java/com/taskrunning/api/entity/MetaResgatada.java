package com.taskrunning.api.entity;

import com.taskrunning.api.util.Relogio;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Resgate de uma meta diária/semanal. A chave única (usuário, meta, início do período) impede
 * receber a mesma recompensa duas vezes, mesmo com cliques repetidos ou reenvio da requisição.
 */
@Entity
@Table(name = "metas_resgatadas",
       uniqueConstraints = @UniqueConstraint(name = "uk_meta_periodo",
               columnNames = {"usuario_id", "codigo", "periodo_inicio"}))
@Getter
@Setter
@NoArgsConstructor
public class MetaResgatada {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false, length = 40)
    private String codigo;

    /** Primeiro dia do período (o próprio dia, ou a segunda-feira da semana). */
    @Column(name = "periodo_inicio", nullable = false)
    private LocalDate periodoInicio;

    @Column(nullable = false)
    private Integer moedas;

    @Column(name = "resgatada_em", nullable = false)
    private LocalDateTime resgatadaEm = Relogio.agora();
}
