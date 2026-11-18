package com.taskrunning.api;

import org.springframework.boot.SpringApplication;

/**
 * Sobe a API localmente com o banco H2 em memória (perfil "teste"), sem precisar de MySQL.
 * Uso (pasta backend):  ./mvnw spring-boot:test-run
 * Serve para testar o app mobile contra a API real na rede local. Não vai para produção.
 */
public class TestBackendApplication {
    public static void main(String[] args) {
        System.setProperty("spring.profiles.active", "teste"); // Spring Boot 3.2: perfil via propriedade
        SpringApplication.from(BackendApplication::main).run(args);
    }
}
