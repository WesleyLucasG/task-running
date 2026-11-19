package com.taskrunning.api;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
@OpenAPIDefinition(
        info = @Info(title = "Task Running API", version = "v1"),
        security = @SecurityRequirement(name = "bearerAuth"),
        servers = { @Server(url = "/", description = "Servidor Padrão") }
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT"
)
public class BackendApplication {
    /** Fuso oficial do sistema: o app envia datas locais de Brasília (sem fuso) e o Render roda em UTC. */
    public static final String FUSO_HORARIO = "America/Sao_Paulo";

    public static void main(String[] args) {
        // Sem isto, LocalDateTime.now() no servidor fica 3 h à frente das datas enviadas pelo app e
        // as janelas de 24 h do chefe (RN11/RN12) e "nova atividade após o ataque" falham.
        TimeZone.setDefault(TimeZone.getTimeZone(FUSO_HORARIO));
        SpringApplication.run(BackendApplication.class, args);
    }

}
