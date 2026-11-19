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
        String body = r.getResponse().getContentAsString();
        return body.isEmpty() ? null : json.readTree(body);
    }

    private String reset(String token, String senha) {
        return "{\"token\":\"" + token + "\",\"novaSenha\":\"" + senha + "\"}";
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
    @DisplayName("Fluxo completo: solicitar → token salvo (15 min) → senha inválida → redefinir → reuso → expirado → login")
    void fluxoCompleto() throws Exception {
        enviar("/auth/register", """
                {"nome":"Penélope","email":"%s","senha":"Antiga@2026","cpf":"%s","peso":60}
                """.formatted(EMAIL, CPF), 201);

        // 1–5) Solicitação com e-mail existente: token gerado e persistido com validade de 15 min
        JsonNode r = enviar("/auth/forgot-password", "{\"email\":\"" + EMAIL + "\"}", 200);
        String token = r.get("tokenTeste").asText();
        PasswordResetToken salvo = tokens.findByToken(token).orElseThrow();
        assertFalse(salvo.isUsado());
        LocalDateTime agora = LocalDateTime.now();
        assertTrue(salvo.getDataExpiracao().isAfter(agora.plusMinutes(14)));
        assertTrue(salvo.getDataExpiracao().isBefore(agora.plusMinutes(16)));

        // E-mail inexistente: mesma mensagem, sem token
        JsonNode generica = enviar("/auth/forgot-password", "{\"email\":\"ninguem@itaca.com\"}", 200);
        assertEquals(r.get("mensagem").asText(), generica.get("mensagem").asText());
        assertNull(generica.get("tokenTeste"));

        // Solicitação repetida em seguida: resposta genérica, token anterior continua o válido
        JsonNode repetida = enviar("/auth/forgot-password", "{\"email\":\"" + EMAIL + "\"}", 200);
        assertNull(repetida.get("tokenTeste"));
        assertTrue(tokens.findByToken(token).isPresent());

        // 9) Senha inválida não consome o token
        enviar("/auth/reset-password", reset(token, "Abcdefg1"), 400);
        assertFalse(tokens.findByToken(token).orElseThrow().isUsado());

        // Token inválido
        enviar("/auth/reset-password", reset("nao-existe", "Nova@2026"), 400);

        // 6) Redefinição válida: senha gravada com BCrypt e token marcado como usado
        enviar("/auth/reset-password", reset(token, "Nova@2026"), 204);
        PasswordResetToken usado = tokens.findByToken(token).orElseThrow();
        assertTrue(usado.isUsado());
        String hash = usado.getUsuario().getSenha();
        assertTrue(hash.startsWith("$2"), "senha deve estar em BCrypt");
        assertTrue(encoder.matches("Nova@2026", hash));

        // 7) Reutilização do mesmo token
        JsonNode reuso = enviar("/auth/reset-password", reset(token, "Outra@2026"), 400);
        assertTrue(reuso.get("message").asText().contains("utilizado"));

        // 10–11) Login: senha antiga falha, senha nova funciona
        enviar("/auth/login", login("Antiga@2026"), 401);
        assertNotNull(enviar("/auth/login", login("Nova@2026"), 200).get("token"));

        // 8) Token expirado: nova solicitação (já usado → sem cooldown), depois forçamos o vencimento
        String novo = enviar("/auth/forgot-password", "{\"email\":\"" + EMAIL + "\"}", 200).get("tokenTeste").asText();
        assertNotEquals(token, novo);
        assertTrue(tokens.findByToken(token).isEmpty(), "token anterior deixa de existir");
        PasswordResetToken t = tokens.findByToken(novo).orElseThrow();
        t.setDataExpiracao(LocalDateTime.now().minusSeconds(1));
        tokens.save(t);
        JsonNode expirado = enviar("/auth/reset-password", reset(novo, "Mais@2026"), 400);
        assertTrue(expirado.get("message").asText().contains("expirou"));
        assertNotNull(enviar("/auth/login", login("Nova@2026"), 200).get("token"));
    }
}
