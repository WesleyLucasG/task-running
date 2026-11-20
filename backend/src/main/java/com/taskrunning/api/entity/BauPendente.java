package com.taskrunning.api.entity;

import com.taskrunning.api.enums.TipoBau;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "baus_pendentes")
@Getter
@Setter
@NoArgsConstructor
public class BauPendente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoBau tipo;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm = com.taskrunning.api.util.Relogio.agora(); // dia de Brasília (RN14)

    @Column(nullable = false)
    private boolean aberto = false;

    /** Quando foi aberto (horário de Brasília); nulo nos baús abertos antes desta coluna existir. */
    @Column(name = "aberto_em")
    private LocalDateTime abertoEm;
}
