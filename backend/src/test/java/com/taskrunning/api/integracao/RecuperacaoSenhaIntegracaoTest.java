package com.taskrunning.api.integracao;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskrunning.api.entity.PasswordResetToken;
import com.taskrunning.api.repository.PasswordResetTokenRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * RF05–RF08 de ponta a ponta (API real + H2). No perfil de teste o e-mail fica desligado e o token
 * volta em "tokenTeste" — o mesmo token que, em produção, só sai por e-mail.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("teste")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class RecuperacaoSenhaIntegracaoTest {

    private static final String CPF = "390.533.447-05";
    private static final String EMAIL = "penelope@itaca.com";

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;
    @Autowired private PasswordResetTokenRepository tokens;
    @Autowired private PasswordEncoder encoder;

    private JsonNode enviar(String url, String corpo, int esperado) throws Exception {
        MvcResult r = mvc.perform(post(url).contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().is(esperado)).andReturn();
        String body = r.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        return body.isEmpty() ? null : json.readTree(body);
    }

    private String reset(String codigo, String senha) {
        return "{\"email\":\"" + EMAIL + "\",\"codigo\":\"" + codigo + "\",\"novaSenha\":\"" + senha + "\"}";
    }

    private String validar(String codigo) {
        return "{\"email\":\"" + EMAIL + "\",\"codigo\":\"" + codigo + "\"}";
    }

    private PasswordResetToken registro() {
        return tokens.findAll().stream().filter(t -> EMAIL.equals(t.getUsuario().getEmail())).findFirst().orElseThrow();
    }

    private String login(String senha) {
        return "{\"cpf\":\"39053344705\",\"senha\":\"" + senha + "\"}";
    }

    @Test
    @DisplayName("RF08 no cadastro: senha sem caractere especial é recusada pelo Backend")
    void cadastroExigeCaractereEspecial() throws Exception {
        JsonNode erro = enviar("/auth/register", """
                {"nome":"Fraca","email":"fraca@x.com","senha":"Abcdefg1","cpf":"111.444.777-35","peso":60}
                """, 400);
        assertTrue(erro.toString().contains("caractere especial"));
    }

    @Test
    @DisplayName("Fluxo completo: solicitar → código (hash, 15 min) → validar → senha inválida → redefinir → reuso → expirado → login")
    void fluxoCompleto() throws Exception {
        enviar("/auth/register", """
                {"nome":"Penélope","email":"%s","senha":"Antiga@2026","cpf":"%s","peso":60}
                """.formatted(EMAIL, CPF), 201);

        // 1) Solicitação com e-mail existente: código de 6 dígitos; no banco só o hash, validade 15 min
        JsonNode r = enviar("/auth/forgot-password", "{\"email\":\"" + EMAIL + "\"}", 200);
        String codigo = r.get("tokenTeste").asText();
        assertTrue(codigo.matches("\\d{6}"));
        PasswordResetToken salvo = registro();
        assertNotEquals(codigo, salvo.getToken(), "o código não é guardado em texto puro");
        assertFalse(salvo.isUsado());
        LocalDateTime agora = LocalDateTime.now();
        assertTrue(salvo.getDataExpiracao().isAfter(agora.plusMinutes(14)));
        assertTrue(salvo.getDataExpiracao().isBefore(agora.plusMinutes(16)));

        // E-mail inexistente: mesma mensagem, sem código
        JsonNode generica = enviar("/auth/forgot-password", "{\"email\":\"ninguem@itaca.com\"}", 200);
        assertEquals(r.get("mensagem").asText(), generica.get("mensagem").asText());
        assertNull(generica.get("tokenTeste"));

        // Solicitação repetida em seguida: resposta genérica, o código anterior continua valendo
        assertNull(enviar("/auth/forgot-password", "{\"email\":\"" + EMAIL + "\"}", 200).get("tokenTeste"));

        // 2) Validação do código (etapa do site/app antes de pedir a nova senha)
        String errado = codigo.equals("000000") ? "000001" : "000000";
        JsonNode invalido = enviar("/auth/validar-codigo", validar(errado), 400);
        assertTrue(invalido.get("message").asText().contains("Código inválido"));
        enviar("/auth/validar-codigo", validar(codigo), 204);
        enviar("/auth/validar-codigo", validar(codigo), 204); // validar não consome
        assertFalse(registro().isUsado());

        // E-mail inexistente na validação: mesma mensagem genérica
        JsonNode semConta = enviar("/auth/validar-codigo",
                "{\"email\":\"ninguem@itaca.com\",\"codigo\":\"" + codigo + "\"}", 400);
        assertEquals(invalido.get("message").asText(), semConta.get("message").asText());

        // 3) Senha inválida não consome o código
        enviar("/auth/reset-password", reset(codigo, "Abcdefg1"), 400);
        assertFalse(registro().isUsado());

        // Redefinição válida: senha em BCrypt e código marcado como usado
        enviar("/auth/reset-password", reset(codigo, "Nova@2026"), 204);
        PasswordResetToken usado = registro();
        assertTrue(usado.isUsado());
        String hash = usado.getUsuario().getSenha();
        assertTrue(hash.startsWith("$2"), "senha deve estar em BCrypt");
        assertTrue(encoder.matches("Nova@2026", hash));

        // Reutilização do mesmo código
        JsonNode reuso = enviar("/auth/reset-password", reset(codigo, "Outra@2026"), 400);
        assertTrue(reuso.get("message").asText().contains("utilizado"));
        enviar("/auth/validar-codigo", validar(codigo), 400);

        // Login: senha antiga falha, senha nova funciona
        enviar("/auth/login", login("Antiga@2026"), 401);
        assertNotNull(enviar("/auth/login", login("Nova@2026"), 200).get("token"));

        // Código expirado: nova solicitação (o anterior já foi usado → sem cooldown), depois forçamos o vencimento
        String novo = enviar("/auth/forgot-password", "{\"email\":\"" + EMAIL + "\"}", 200).get("tokenTeste").asText();
        PasswordResetToken t = registro();
        t.setDataExpiracao(LocalDateTime.now().minusSeconds(1));
        tokens.save(t);
        JsonNode expirado = enviar("/auth/validar-codigo", validar(novo), 400);
        assertTrue(expirado.get("message").asText().contains("expirou"));
        enviar("/auth/reset-password", reset(novo, "Mais@2026"), 400);
        assertNotNull(enviar("/auth/login", login("Nova@2026"), 200).get("token"));
    }

    @Test
    @DisplayName("Força bruta: 5 códigos errados invalidam o código; uma nova solicitação libera outro na hora")
    void forcaBruta() throws Exception {
        String email = "argos@itaca.com";
        enviar("/auth/register", """
                {"nome":"Argos","email":"%s","senha":"Argos@2026","cpf":"123.456.789-09","peso":30}
                """.formatted(email), 201);
        String codigo = enviar("/auth/forgot-password", "{\"email\":\"" + email + "\"}", 200).get("tokenTeste").asText();
        String errado = codigo.equals("000000") ? "000001" : "000000";
        String corpoErrado = "{\"email\":\"" + email + "\",\"codigo\":\"" + errado + "\"}";
        for (int i = 0; i < 5; i++) enviar("/auth/validar-codigo", corpoErrado, 400);

        enviar("/auth/validar-codigo", "{\"email\":\"" + email + "\",\"codigo\":\"" + codigo + "\"}", 400);
        String novo = enviar("/auth/forgot-password", "{\"email\":\"" + email + "\"}", 200).get("tokenTeste").asText();
        enviar("/auth/validar-codigo", "{\"email\":\"" + email + "\",\"codigo\":\"" + novo + "\"}", 204);
    }
}
