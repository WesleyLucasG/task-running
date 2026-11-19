package com.taskrunning.api.integracao;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskrunning.api.entity.InventarioItem;
import com.taskrunning.api.entity.ItemCatalogo;
import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.repository.InventarioItemRepository;
import com.taskrunning.api.repository.ItemCatalogoRepository;
import com.taskrunning.api.repository.UsuarioRepository;
import com.taskrunning.api.util.Relogio;
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
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * RNF16 — RPG no servidor de ponta a ponta (RF18–RF26), como o app em modo API usa:
 * corrida sincronizada → distância na fase → chefe liberado + baú → ataques com a RN12 → baú Ouro e
 * próxima fase → abrir baú → equipar (um item por slot) → isolamento entre contas.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("teste")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class JogoIntegracaoTest {

    @DynamicPropertySource
    static void bancoProprio(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", () -> "jdbc:h2:mem:jogo;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1");
    }

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private InventarioItemRepository inventarioRepository;
    @Autowired private ItemCatalogoRepository itemRepository;

    private JsonNode chamar(MockHttpServletRequestBuilder req, String token, int esperado) throws Exception {
        if (token != null) req.header("Authorization", "Bearer " + token);
        MvcResult r = mvc.perform(req).andExpect(status().is(esperado)).andReturn();
        String body = r.getResponse().getContentAsString(StandardCharsets.UTF_8);
        return body.isEmpty() ? null : json.readTree(body);
    }

    private JsonNode enviar(String url, String corpo, String token, int esperado) throws Exception {
        return chamar(post(url).contentType(MediaType.APPLICATION_JSON).content(corpo), token, esperado);
    }

    private JsonNode buscar(String url, String token, int esperado) throws Exception {
        return chamar(get(url), token, esperado);
    }

    private String contaComToken(String nome, String email, String cpf) throws Exception {
        enviar("/auth/register", """
                {"nome":"%s","email":"%s","senha":"Senha@123","cpf":"%s","peso":70}
                """.formatted(nome, email, cpf), null, 201);
        return enviar("/auth/login", "{\"cpf\":\"%s\",\"senha\":\"Senha@123\"}".formatted(cpf), null, 200)
                .get("token").asText();
    }

    /** Horários em Brasília, como o app envia (dataHoraLocal). Corrida a ~6,7 km/h (111 m por minuto), plausível para a RNF12; termina em {@code fim}. */
    private JsonNode correr(String token, int minutos, LocalDateTime fim) throws Exception {
        LocalDateTime inicio = fim.minusMinutes(minutos).truncatedTo(ChronoUnit.SECONDS);
        StringBuilder pontos = new StringBuilder();
        for (int i = 0; i <= minutos; i++) {
            if (i > 0) pontos.append(',');
            pontos.append(String.format(Locale.ROOT, "{\"latitude\":%.4f,\"longitude\":-48.27,\"timestamp\":\"%s\"}",
                    -18.9 - 0.001 * i, inicio.plusMinutes(i)));
        }
        String corpo = """
                {"identificadorLocal":"%s","tipoAtividade":"CORRIDA","dataInicio":"%s","dataFim":"%s",
                 "duracaoSegundos":%d,"pontosGps":[%s]}
                """.formatted(UUID.randomUUID(), inicio, inicio.plusMinutes(minutos), minutos * 60, pontos);
        return enviar("/api/atividades/sincronizar", corpo, token, 201);
    }

    @Test
    @DisplayName("Corrida libera o chefe, baús, ataques persistem a vida (RN15), vitória avança a fase")
    void progressaoCompletaNoServidor() throws Exception {
        String a = contaComToken("Atalanta", "atalanta@olimpo.com", "390.533.447-05");

        // RF20: mapa completo desde o início, chefes futuros visíveis e bloqueados
        JsonNode estado = buscar("/api/jogo/estado", a, 200);
        assertEquals(5, estado.get("fases").size());
        assertEquals("ATUAL", estado.get("fases").get(0).get("situacao").asText());
        assertEquals("BLOQUEADA", estado.get("fases").get(4).get("situacao").asText());
        assertFalse(estado.get("chefeAtual").get("podeAtacar").asBoolean());
        assertEquals(0, estado.get("bausPendentes").asInt());

        // Corrida de ~2,6 km (meta da fase 1 = 2 km)
        JsonNode corrida = correr(a, 24, Relogio.agora().minusMinutes(5));
        assertTrue(corrida.get("distanciaMetros").asDouble() > 2000, "corrida deve passar da meta");

        // RN13 (limitada à meta) + RF21 (chefe liberado com vida cheia) + RF22 (baú pela meta)
        estado = buscar("/api/jogo/estado", a, 200);
        JsonNode fase1 = estado.get("fases").get(0);
        assertEquals(2000.0, fase1.get("distanciaAcumuladaMetros").asDouble(), 0.001);
        assertTrue(fase1.get("chefeLiberado").asBoolean());
        assertEquals(30, fase1.get("vidaAtualChefe").asInt());
        assertTrue(estado.get("chefeAtual").get("podeAtacar").asBoolean());
        assertEquals(1, estado.get("bausPendentes").asInt());
        assertEquals("PRATA", buscar("/api/jogo/baus", a, 200).get(0).get("tipo").asText());

        // RN12: o servidor limita o dano ao valor da regra, mesmo que o app peça 9999
        int limite = estado.get("chefeAtual").get("danoEstimado").asInt();
        assertTrue(limite > 0 && limite < 30, "dano da RN12 no nível inicial: " + limite);
        JsonNode ataque = enviar("/api/jogo/chefe/atacar", "{\"danoCausado\":9999}", a, 200);
        assertEquals(limite, ataque.get("dano").asInt());
        int vida = ataque.get("vidaRestante").asInt();
        assertEquals(30 - limite, vida);
        assertFalse(ataque.get("derrotado").asBoolean());

        // Sem nova atividade não ataca de novo; a vida do chefe ficou salva (RN15)
        JsonNode recusa = enviar("/api/jogo/chefe/atacar", "{}", a, 400);
        assertTrue(recusa.get("message").asText().contains("nova atividade"));
        assertEquals(vida, buscar("/api/jogo/estado", a, 200).get("fases").get(0).get("vidaAtualChefe").asInt());

        // Cada nova corrida curta (horário de Brasília, depois do ataque) libera um novo golpe até vencer
        JsonNode vitoria = null;
        for (int rodada = 1; rodada <= 10 && vitoria == null; rodada++) {
            correr(a, 3, Relogio.agora().plusMinutes(3L * rodada));
            JsonNode golpe = enviar("/api/jogo/chefe/atacar", "{}", a, 200);
            assertTrue(golpe.get("vidaRestante").asInt() < vida, "a vida do chefe deve cair a cada golpe");
            vida = golpe.get("vidaRestante").asInt();
            if (golpe.get("derrotado").asBoolean()) vitoria = golpe;
        }
        assertNotNull(vitoria, "o chefe deve ser derrotado");
        assertEquals(0, vitoria.get("vidaRestante").asInt());
        assertEquals("Montanhas de Prata", vitoria.get("proximaFase").asText());

        // RF22: baú Ouro pela vitória; fase 2 vira a atual e começa do zero
        estado = buscar("/api/jogo/estado", a, 200);
        assertEquals("CONCLUIDA", estado.get("fases").get(0).get("situacao").asText());
        assertEquals("ATUAL", estado.get("fases").get(1).get("situacao").asText());
        assertEquals(0.0, estado.get("fases").get(1).get("distanciaAcumuladaMetros").asDouble(), 0.001);
        assertEquals(2, estado.get("bausPendentes").asInt());
        JsonNode baus = buscar("/api/jogo/baus", a, 200);
        assertTrue(baus.toString().contains("OURO"));

        // RF24: abrir baú → item no inventário; reabrir o mesmo baú é recusado
        long bauId = baus.get(0).get("id").asLong();
        JsonNode item = enviar("/api/jogo/baus/" + bauId + "/abrir", "", a, 200);
        assertFalse(item.get("equipado").asBoolean());
        enviar("/api/jogo/baus/" + bauId + "/abrir", "", a, 400);
        assertEquals(1, buscar("/api/jogo/inventario", a, 200).size()); // RF25

        // RF26: equipar soma o bônus no estado; desequipar remove
        long registro = item.get("id").asLong();
        chamar(put("/api/jogo/inventario/" + registro + "/equipar"), a, 204);
        assertEquals(item.get("bonusForca").asInt(), buscar("/api/jogo/estado", a, 200).get("atributos").get("bonusForca").asInt());
        chamar(put("/api/jogo/inventario/" + registro + "/equipar"), a, 204);
        assertEquals(0, buscar("/api/jogo/estado", a, 200).get("atributos").get("bonusForca").asInt());
    }

    @Test
    @DisplayName("RF26/UC10: um item por slot; contas não mexem nos itens umas das outras")
    void slotUnicoEIsolamento() throws Exception {
        String a = contaComToken("Teseu", "teseu@olimpo.com", "123.456.789-09");
        String b = contaComToken("Ariadne", "ariadne@olimpo.com", "529.982.247-25");
        Usuario usuarioA = usuarioRepository.findAll().stream()
                .filter(u -> "teseu@olimpo.com".equals(u.getEmail())).findFirst().orElseThrow();

        // Duas armas no inventário de A
        var armas = itemRepository.findAll().stream()
                .filter(i -> i.getTipo() == com.taskrunning.api.enums.TipoItem.ARMA).limit(2).toList();
        long arma1 = darItem(usuarioA, armas.get(0));
        long arma2 = darItem(usuarioA, armas.get(1));

        chamar(put("/api/jogo/inventario/" + arma1 + "/equipar"), a, 204);
        chamar(put("/api/jogo/inventario/" + arma2 + "/equipar"), a, 204);
        JsonNode inv = buscar("/api/jogo/inventario", a, 200);
        int equipadas = 0;
        for (JsonNode i : inv) if (i.get("equipado").asBoolean()) equipadas++;
        assertEquals(1, equipadas, "só uma arma pode ficar equipada");
        assertEquals(armas.get(1).getBonusForca(), buscar("/api/jogo/estado", a, 200).get("atributos").get("bonusForca").asInt());

        // B não enxerga nem altera o inventário de A (usuário sempre vem do token)
        assertEquals(0, buscar("/api/jogo/inventario", b, 200).size());
        enviar("/api/jogo/baus/1/abrir", "", b, 400);
        chamar(put("/api/jogo/inventario/" + arma2 + "/equipar"), b, 400);
        assertTrue(inventarioRepository.findById(arma2).orElseThrow().isEquipado(), "item de A continua equipado");

        // Sem token, nada do jogo responde
        mvc.perform(get("/api/jogo/estado"))
                .andExpect(status().is4xxClientError());
    }

    private long darItem(Usuario u, ItemCatalogo item) {
        InventarioItem reg = new InventarioItem();
        reg.setUsuario(u);
        reg.setItem(item);
        reg.setEquipado(false);
        return inventarioRepository.save(reg).getId();
    }
}
