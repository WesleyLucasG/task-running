package com.taskrunning.api.entity;

import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;

@MappedSuperclass
@Getter
public abstract class LogAuditoriaBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tabela_nome")
    private String tabelaNome;

    private String operacao;

    @Column(name = "id_registro_afetado")
    private Long idRegistroAfetado;

    @Column(name = "usuario_executor_id")
    private Long usuarioExecutorId;

    @Column(name = "usuario_proprietario_id")
    private Long usuarioProprietarioId;

    @Column(name = "dados_anteriores", columnDefinition = "json")
    private String dadosAnteriores;

    @Column(name = "dados_novos", columnDefinition = "json")
    private String dadosNovos;

    @Column(name = "data_hora")
    private LocalDateTime dataHora;
}
