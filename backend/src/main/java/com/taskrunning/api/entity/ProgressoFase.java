package com.taskrunning.api.entity;

import com.taskrunning.api.enums.SituacaoFase;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "progresso_fase",
       uniqueConstraints = @UniqueConstraint(columnNames = {"usuario_id", "fase_numero"}))
@Getter
@Setter
@NoArgsConstructor
public class ProgressoFase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "fase_numero", nullable = false)
    private Integer faseNumero;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SituacaoFase situacao = SituacaoFase.BLOQUEADA;

    @Column(name = "distancia_acumulada_metros", nullable = false)
    private Double distanciaAcumuladaMetros = 0.0;

    @Column(name = "chefe_liberado", nullable = false)
    private boolean chefeLiberado = false;

    @Column(name = "vida_atual_chefe", nullable = false)
    private Integer vidaAtualChefe = 0;

    @Column(name = "bau_meta_concedido", nullable = false)
    private boolean bauMetaConcedido = false;

    @Column(name = "ultimo_ataque_em")
    private LocalDateTime ultimoAtaqueEm;
}
