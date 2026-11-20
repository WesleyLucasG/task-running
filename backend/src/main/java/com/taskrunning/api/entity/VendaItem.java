package com.taskrunning.api.entity;

import com.taskrunning.api.enums.Raridade;
import com.taskrunning.api.util.Relogio;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Registro de cada item vendido (auditoria e idempotência). O registro do inventário é apagado na
 * venda; este registro guarda o que foi vendido e por quanto. A chave única no id do registro de
 * inventário impede vender (e pagar) o mesmo item duas vezes.
 */
@Entity
@Table(name = "vendas_item",
       uniqueConstraints = @UniqueConstraint(name = "uk_venda_registro", columnNames = {"inventario_item_id"}))
@Getter
@Setter
@NoArgsConstructor
public class VendaItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    /** id do registro em inventario_itens que foi vendido (não é FK: o registro deixa de existir). */
    @Column(name = "inventario_item_id", nullable = false)
    private Long inventarioItemId;

    @Column(name = "item_id", nullable = false)
    private Integer itemId;

    @Column(nullable = false, length = 100)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Raridade raridade;

    @Column(nullable = false)
    private Integer moedas;

    @Column(name = "vendido_em", nullable = false)
    private LocalDateTime vendidoEm = Relogio.agora();
}
