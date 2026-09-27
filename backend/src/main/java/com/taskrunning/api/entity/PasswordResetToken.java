package com.taskrunning.api.entity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Table(name = "tokens_recuperacao_senha")
@Entity(name = "PasswordResetToken")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")

public class PasswordResetToken {

   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   private Long id;

   @Column(nullable = false, unique = true)
   private String token;

   @OneToOne(targetEntity = Usuario.class, fetch = FetchType.EAGER)
   @JoinColumn(nullable = false, name = "usuario_id")
    private Usuario usuario;

   @Column(nullable = false, name = "data_expiracao")
   private LocalDateTime dataExpiracao;

   private boolean usado = false;

   public boolean isExpirado(){
       return LocalDateTime.now().isAfter(this.dataExpiracao);
   }


}
