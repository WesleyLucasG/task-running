package com.taskrunning.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Table(name = "usuarios")
@Entity(name = "Usuario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Usuario implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String senha;

    // RNF06: valor criptografado (AES-GCM). Registros antigos em texto puro são migrados no login.
    @Column(nullable = false, unique = true)
    private String cpf;

    // Índice cego (HMAC-SHA256) usado para buscar o usuário pelo CPF sem decifrar a tabela
    @Column(name = "cpf_hash", unique = true, length = 64)
    private String cpfHash;

    // RNF13: bloqueio de 15 minutos após 5 tentativas consecutivas malsucedidas
    @Column(name = "tentativas_falhas")
    private Integer tentativasFalhas = 0;

    @Column(name = "bloqueado_ate")
    private java.time.LocalDateTime bloqueadoAte;

    @Column(nullable = false)
    private Boolean ativo = true;

    @Column(nullable = false)
    private Double peso;

    private Double metaAguaMl;

    @Enumerated(EnumType.STRING)
    private PerfilAcesso perfil = PerfilAcesso.USER;

    public void calcularMetaAgua(){
        if(this.peso != null){
            this.metaAguaMl = this.peso * 35.0;
        }
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if(this.perfil == PerfilAcesso.ADMIN){
            return List.of(
                    new SimpleGrantedAuthority("ROLE_ADM"),
                    new SimpleGrantedAuthority("ROLE_USER")
            );
        }
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public String getPassword() { return this.senha; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }
    @Override
    public String getUsername() {
        return this.email;
    }
}
