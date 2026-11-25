package com.taskrunning.api.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.taskrunning.api.entity.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class TokenService {

    public static final long HORAS_VALIDADE = 24; // RNF07

    @Value("${api.security.token.secret}")
    private String secret;

    public String gerarToken(Usuario usuario) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secret);
            return JWT.create()
                    .withIssuer("task-running-api")
                    .withSubject(String.valueOf(usuario.getId())) // id: o CPF não vai no token
                    .withClaim("perfil", usuario.getPerfil().name())
                    .withExpiresAt(gerarDataExpiracao())
                    .sign(algorithm);
        } catch (JWTCreationException exception) {
            throw new RuntimeException("Erro ao gerar token JWT", exception);
        }
    }

    public String getSubject(String token) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secret);
            return JWT.require(algorithm)
                    .withIssuer("task-running-api")
                    .build()
                    .verify(token)
                    .getSubject(); // id do usuário
        } catch (JWTVerificationException exception) {
            return null;
        }
    }

    private Instant gerarDataExpiracao() {
        // RNF07: 24 h exatas, independente do fuso do servidor (antes dava 27 h com a JVM em UTC)
        return Instant.now().plus(java.time.Duration.ofHours(HORAS_VALIDADE));
    }
}