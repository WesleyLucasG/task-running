package com.taskrunning.api.integracao;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import com.taskrunning.api.repository.PasswordResetTokenRepository;
import com.taskrunning.api.repository.UsuarioRepository;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Transporte "brevo" com e-mail HABILITADO e token NÃO exposto (como em produção),
 * contra um servidor HTTP local que imita a API do Brevo.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("teste")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class EnvioEmailBrevoIntegracaoTest {

    private static final String CHAVE = "xkeysib-chave-falsa-de-teste";
    private static final AtomicInteger statusResposta = new AtomicInteger(201);
    private static final AtomicReference<String> corpoRecebido = new AtomicReference<>();
    private static final AtomicReference<String> chaveRecebida = new AtomicReference<>();
    private static final HttpServer brevoFalso;

    static {
        try {
            brevoFalso = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
        brevoFalso.createContext("/v3/smtp/email", troca -> {
            chaveRecebida.set(troca.getRequestHeaders().getFirst("api-key"));
            corpoRecebido.set(new String(troca.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            byte[] resposta = (statusResposta.get() == 201 ? "{\"messageId\":\"<1@brevo>\"}"
                    : "{\"code\":\"unauthorized\",\"message\":\"Sender not valid\"}").getBytes(StandardCharsets.UTF_8);
            troca.getResponseHeaders().add("Content-Type", "application/json");
            troca.sendResponseHeaders(statusResposta.get(), resposta.length);
            troca.getResponseBody().write(resposta);
            troca.close();
        });
        brevoFalso.start();
    }

    @DynamicPropertySource
    static void propriedades(DynamicPropertyRegistry r) {
        // Banco H2 próprio: este contexto não pode recriar/apagar as tabelas dos outros testes
        r.add("spring.datasource.url", () -> "jdbc:h2:mem:brevo;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1");
        r.add("app.email.habilitado", () -> "true");
        r.add("app.email.provedor", () -> "brevo");
        r.add("app.email.brevo-api-key", () -> CHAVE);
        r.add("app.email.brevo-url", () -> "http://127.0.0.1:" + brevoFalso.getAddress().getPort() + "/v3/smtp/email");
        r.add("app.email.remetente", () -> "remetente.verificado@exemplo.com");
        r.add("app.recuperacao.expor-token", () -> "false");
        r.add("FRONTEND_URL", () -> "https://web.exemplo.com");
    }

    @AfterAll
    static void parar() {
        brevoFalso.stop(0);
    }

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;
    @Autowired private UsuarioRepository usuarios;
    @Autowired private PasswordResetTokenRepository tokens;

    @BeforeEach
    void limpar() {
        statusResposta.set(201);
        corpoRecebido.set(null);
    }

    private JsonNode enviar(String url, String corpo, int esperado) throws Exception {
        MvcResult r = mvc.perform(post(url).contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().is(esperado)).andReturn();
        String body = r.getResponse().getContentAsString(StandardCharsets.UTF_8);
        return body.isEmpty() ? null : json.readTree(body);
    }

    @Test
    @DisplayName("Envio OK: JSON correto, chave no header, link + código no e-mail, token não exposto na resposta")
    void envioComSucesso() throws Exception {
        enviar("/auth/register", """
                {"nome":"Ulisses <b>","email":"ulisses@itaca.com","senha":"Ulisses@1","cpf":"111.444.777-35","peso":80}
                """, 201);

        JsonNode r = enviar("/auth/forgot-password", "{\"email\":\"ulisses@itaca.com\"}", 200);
        assertNull(r.get("tokenTeste"), "em produção o token só sai por e-mail");

        String token = tokens.findAll().stream()
                .filter(t -> "ulisses@itaca.com".equals(t.getUsuario().getEmail()))
                .findFirst().orElseThrow().getToken();
        assertEquals(CHAVE, chaveRecebida.get());
        JsonNode corpo = json.readTree(corpoRecebido.get());
        assertEquals("remetente.verificado@exemplo.com", corpo.at("/sender/email").asText());
        assertEquals("ulisses@itaca.com", corpo.at("/to/0/email").asText());
        String html = corpo.get("htmlContent").asText();
        assertTrue(html.contains("https://web.exemplo.com/reset-password?token=" + token));
        assertTrue(html.contains(token), "código para colar no app");
        assertTrue(html.contains("15 minutos"));
        assertTrue(html.contains("Ulisses &lt;b&gt;"), "nome escapado no HTML");
        assertFalse(corpoRecebido.get().contains(CHAVE), "a chave nunca vai no corpo");
    }

    @Test
    @DisplayName("Brevo recusa (ex.: remetente não verificado): 503 e nenhum token válido fica gravado")
    void falhaDoProvedorViraErro503() throws Exception {
        enviar("/auth/register", """
                {"nome":"Telêmaco","email":"telemaco@itaca.com","senha":"Telemaco@1","cpf":"390.533.447-05","peso":70}
                """, 201);
        long antes = tokens.count();
        statusResposta.set(401);

        JsonNode erro = enviar("/auth/forgot-password", "{\"email\":\"telemaco@itaca.com\"}", 503);
        assertTrue(erro.get("message").asText().contains("Não foi possível enviar"));
        assertEquals(antes, tokens.count(), "rollback: token não persiste quando o e-mail não sai");

        // Provedor volta: a solicitação seguinte funciona normalmente (sem cooldown herdado da falha)
        statusResposta.set(201);
        enviar("/auth/forgot-password", "{\"email\":\"telemaco@itaca.com\"}", 200);
        assertEquals(antes + 1, tokens.count());
        assertTrue(usuarios.findFirstByEmailAndAtivoTrue("telemaco@itaca.com").isPresent());
    }
}
