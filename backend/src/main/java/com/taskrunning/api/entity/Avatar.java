package com.taskrunning.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "avatares")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Avatar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome", nullable = false, length = 100)
    private String nome;

    @Column(name = "descricao", length = 255)
    private String descricao;

    @Column(name = "preco_moedas", nullable = false)
    private Integer precoMoedas;

    @Column(name = "imagem_url", nullable = false)
    private String imagemUrl;

    @Column(name = "raridade", nullable = false, length = 50)
    private String raridade;
}