package com.taskrunning.api.entity;

import com.taskrunning.api.enums.TipoBau;
import com.taskrunning.api.util.Relogio;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Registro de cada monstro comum derrotado informado pelo app (extensão de gameplay).
 * A chave única (usuário, idAbate) garante que o mesmo abate nunca pague duas vezes; abates
 * recusados (limite diário ou ritmo) também ficam gravados, para não poderem ser pagos depois.
 */
@Entity
@Table(name = "abates_monstro",
       uniqueConstraints = @UniqueConstraint(name = "uk_abate_usuario", columnNames = {"usuario_id", "id_abate"}),
       indexes = @Index(name = "idx_abate_usuario_dia", columnList = "usuario_id, dia"))
@Getter
@Setter
@NoArgsConstructor
public class AbateMonstro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    /** UUID gerado pelo app para este abate (idempotência). */
    @Column(name = "id_abate", nullable = false, length = 36)
    private String idAbate;

    @Column(name = "fase_numero", nullable = false)
    private Integer faseNumero;

    @Column(nullable = false)
    private boolean recompensado;

    /** null quando recompensado; LIMITE_DIARIO ou RITMO quando recusado. */
    @Column(length = 20)
    private String motivo;

    @Column(nullable = false)
    private Integer xp = 0;

    @Column(nullable = false)
    private Integer moedas = 0;

    @Column(name = "bau_id")
    private Long bauId;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_bau", length = 20)
    private TipoBau tipoBau;

    /** Dia de Brasília (renovação dos limites). */
    @Column(nullable = false)
    private LocalDate dia;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm = Relogio.agora();
}
