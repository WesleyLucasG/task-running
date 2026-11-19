package com.taskrunning.api.integracao;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.repository.CarteiraRepository;
import com.taskrunning.api.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Teste de integração (RNF16): API real + banco H2, simulando o fluxo do app mobile de ponta a ponta.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("teste")
class FluxoMobileIntegracaoTest {

    private static final String CPF = "529.982.247-25";

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private CarteiraRepository carteiraRepository;

    private JsonNode enviar(String url, String corpo, String token, int esperado) throws Exception {
        var req = post(url).contentType(MediaType.APPLICATION_JSON).content(corpo);
        if (token != null) req.header("Authorization", "Bearer " + token);
        MvcResult r = mvc.perform(req).andExpect(status().is(esperado)).andReturn();
        String body = r.getResponse().getContentAsString();
        return body.isEmpty() ? null : json.readTree(body);
    }

    private JsonNode buscar(String url, String token, int esperado) throws Exception {
        var req = get(url);
        if (token != null) req.header("Authorization", "Bearer " + token);
        MvcResult r = mvc.perform(req).andExpect(status().is(esperado)).andReturn();
        String body = r.getResponse().getContentAsString();
        return body.isEmpty() ? null : json.readTree(body);
    }

    @Test
    @DisplayName("Cadastro → login CPF → delta GPS → finalizar (RN04/RN10) → histórico → hidratação → refresh")
    void fluxoCompletoDoApp() throws Exception {
        // Saúde pública
        assertEquals("UP", buscar("/api/saude", null, 200).get("status").asText());

        // Cadastro (CPF criptografado no banco)
        enviar("/auth/register", """
                {"nome":"Aquiles","email":"aquiles@olimpo.com","senha":"Senha@123","cpf":"%s","peso":70}
                """.formatted(CPF), null, 201);
        Usuario gravado = usuarioRepository.findAll().get(0);
        assertTrue(gravado.getCpf().startsWith("enc:v1:"));
        assertFalse(gravado.getCpf().contains("52998224725"));

        // Cadastro repetido → 409
        enviar("/auth/register", """
                {"nome":"Outro","email":"x@olimpo.com","senha":"Senha@123","cpf":"52998224725","peso":70}
                """, null, 409);

        // Login por CPF (com ou sem máscara)
        JsonNode tokens = enviar("/auth/login", """
                {"cpf":"52998224725","senha":"Senha@123"}""", null, 200);
        String acesso = tokens.get("token").asText();
        String refresh = tokens.get("refreshToken").asText();
        assertEquals(86400, tokens.get("expiraEmSegundos").asLong());

        // Sem token → 403/401
        mvc.perform(get("/api/atividades")).andExpect(status().is4xxClientError());

        // Perfil com CPF mascarado
        assertEquals("***.***.***-25", buscar("/api/perfil", acesso, 200).get("cpf").asText());

        // RN16: delta de pontos durante a corrida (≈111 m a cada 60 s)
        String uuid = UUID.randomUUID().toString();
        JsonNode e1 = enviar("/api/atividades/sincronizacao/pontos", """
                {"identificadorLocal":"%s","tipoAtividade":"CORRIDA","dataInicio":"2026-11-17T07:00:00",
                 "pontos":[{"latitude":-18.9000,"longitude":-48.27,"timestamp":"2026-11-17T07:00:00"},
                           {"latitude":-18.9010,"longitude":-48.27,"timestamp":"2026-11-17T07:01:00"}]}
                """.formatted(uuid), acesso, 200);
        assertEquals(2, e1.get("quantidadePontos").asInt());
        JsonNode estado = buscar("/api/atividades/sincronizacao/" + uuid, acesso, 200);
        assertEquals(e1.get("hashPontos").asText(), estado.get("hashPontos").asText());

        // Finaliza enviando 1 ponto novo + 1 repetido
        String finalizar = """
                {"identificadorLocal":"%s","tipoAtividade":"CORRIDA","dataInicio":"2026-11-17T07:00:00",
                 "dataFim":"2026-11-17T07:02:00","duracaoSegundos":120,
                 "pontosGps":[{"latitude":-18.9010,"longitude":-48.27,"timestamp":"2026-11-17T07:01:00"},
                              {"latitude":-18.9020,"longitude":-48.27,"timestamp":"2026-11-17T07:02:00"}]}
                """.formatted(uuid);
        JsonNode concluida = enviar("/api/atividades/sincronizar", finalizar, acesso, 201);
        assertEquals("CONCLUIDA", concluida.get("status").asText());
        assertEquals(3, concluida.get("pontosGps").size());
        double km = concluida.get("distanciaMetros").asDouble() / 1000.0;

        // RN04: reenvio não duplica atividade nem recompensa
        enviar("/api/atividades/sincronizar", finalizar, acesso, 201);
        var carteira = carteiraRepository.findByUsuarioId(gravado.getId()).orElseThrow();
        assertEquals((int) Math.floor(km * 50), carteira.getMoedas());
        assertEquals((long) Math.floor(km * 100), carteira.getExperienciaXp());

        // RF31: histórico
        JsonNode pagina = buscar("/api/atividades?pagina=0&tamanho=10", acesso, 200);
        assertEquals(1, pagina.get("totalElements").asInt());

        // Hidratação: registro, intervalo de 30 min e histórico por data
        enviar("/api/hidratacao/registrar", "{\"quantidadeMl\":500}", acesso, 201);
        mvc.perform(patch("/api/hidratacao/lembrete").header("Authorization", "Bearer " + acesso)
                .contentType(MediaType.APPLICATION_JSON).content("{\"lembreteAtivo\":true,\"intervaloMinutos\":30}"))
                .andExpect(status().isNoContent());
        assertEquals(30, buscar("/api/hidratacao", acesso, 200).get("intervaloMinutos").asInt());
        assertEquals(500, buscar("/api/hidratacao/historico?dias=7", acesso, 200).get(0).get("totalMl").asInt());

        // RNF07: refresh com rotação; o antigo deixa de valer
        JsonNode novos = enviar("/auth/refresh", "{\"refreshToken\":\"" + refresh + "\"}", null, 200);
        assertNotEquals(refresh, novos.get("refreshToken").asText());
        enviar("/auth/refresh", "{\"refreshToken\":\"" + refresh + "\"}", null, 401);
        buscar("/api/perfil", novos.get("token").asText(), 200);
    }

    @Test
    @DisplayName("RNF13: 5 falhas bloqueiam o login por 15 minutos")
    void bloqueioPorTentativas() throws Exception {
        enviar("/auth/register", """
                {"nome":"Heitor","email":"heitor@troia.com","senha":"Senha@123","cpf":"111.444.777-35","peso":80}
                """, null, 201);
        for (int i = 0; i < 4; i++) {
            enviar("/auth/login", "{\"cpf\":\"11144477735\",\"senha\":\"errada\"}", null, 401);
        }
        JsonNode bloqueio = enviar("/auth/login", "{\"cpf\":\"11144477735\",\"senha\":\"errada\"}", null, 401);
        assertTrue(bloqueio.get("message").asText().contains("bloqueado"));
        enviar("/auth/login", "{\"cpf\":\"11144477735\",\"senha\":\"Senha@123\"}", null, 401);
    }
}
