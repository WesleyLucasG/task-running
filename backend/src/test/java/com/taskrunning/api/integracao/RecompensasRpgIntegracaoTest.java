package com.taskrunning.api.integracao;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskrunning.api.entity.AbateMonstro;
import com.taskrunning.api.entity.BauPendente;
import com.taskrunning.api.entity.Carteira;
import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.enums.Raridade;
import com.taskrunning.api.enums.TipoBau;
import com.taskrunning.api.repository.*;
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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

/**
 * RNF16 — recompensas do RPG no servidor: abates de monstros (extensão aprovada; idempotência, limites
 * diário e de ritmo, isolamento), curva de nível (RF19), baú aberto uma única vez (UC12) e baú Bronze
 * da hidratação (RN14).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("teste")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class RecompensasRpgIntegracaoTest {

    @DynamicPropertySource
    static void bancoProprio(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", () -> "jdbc:h2:mem:rpg;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1");
    }

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private CarteiraRepository carteiraRepository;
    @Autowired private AbateMonstroRepository abateRepository;
    @Autowired private BauPendenteRepository bauRepository;
    @Autowired private InventarioItemRepository inventarioRepository;
    @Autowired private ItemCatalogoRepository itemCatalogoRepository;
    @Autowired private com.taskrunning.api.service.JogoService jogoService;

    // ─── auxiliares ──────────────────────────────────────────────────────────

    private JsonNode chamar(MockHttpServletRequestBuilder req, String token, int esperado) throws Exception {
        if (token != null) req.header("Authorization", "Bearer " + token);
        MvcResult r = mvc.perform(req).andReturn();
        String body = r.getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertEquals(esperado, r.getResponse().getStatus(), body);
        return body.isEmpty() ? null : json.readTree(body);
    }

    private JsonNode enviar(String url, String corpo, String token, int esperado) throws Exception {
        return chamar(post(url).contentType(MediaType.APPLICATION_JSON).content(corpo), token, esperado);
    }

    private JsonNode estado(String token) throws Exception {
        return chamar(get("/api/jogo/estado"), token, 200);
    }

    private JsonNode abater(String token, String id) throws Exception {
        return enviar("/api/jogo/monstros/abate", "{\"idAbate\":\"" + id + "\"}", token, 200);
    }

    private String conta(String nome, String email, String cpf) throws Exception {
        enviar("/auth/register", """
                {"nome":"%s","email":"%s","senha":"Senha@123","cpf":"%s","peso":70}
                """.formatted(nome, email, cpf), null, 201);
        return enviar("/auth/login", "{\"cpf\":\"%s\",\"senha\":\"Senha@123\"}".formatted(cpf), null, 200)
                .get("token").asText();
    }

    private Usuario usuario(String email) {
        return usuarioRepository.findAll().stream().filter(u -> email.equals(u.getEmail())).findFirst().orElseThrow();
    }

    /** Abates antigos (fora das janelas de ritmo) gravados direto no banco para testar os limites diários. */
    private void abatesAntigos(Usuario u, int quantidade, boolean comBau) {
        for (int i = 0; i < quantidade; i++) {
            AbateMonstro a = new AbateMonstro();
            a.setUsuario(u);
            a.setIdAbate(UUID.randomUUID().toString());
            a.setFaseNumero(1);
            a.setRecompensado(true);
            a.setXp(1);
            a.setMoedas(1);
            a.setDia(Relogio.hoje());
            a.setCriadoEm(Relogio.agora().minusMinutes(5));
            if (comBau) { a.setBauId(-1L); a.setTipoBau(TipoBau.COMUM); }
            abateRepository.save(a);
        }
    }

    // ─── testes ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Javali derrotado paga 1 XP e 1 moeda uma única vez; reenvio e campos forjados não pagam")
    void abatePagaUmaVez() throws Exception {
        String a = conta("Héracles", "heracles@olimpo.com", "390.533.447-05");
        JsonNode antes = estado(a).get("carteira");
        assertEquals(0, antes.get("moedas").asInt());

        String id = UUID.randomUUID().toString();
        // O app tenta mandar valores próprios: o servidor ignora tudo além do idAbate
        JsonNode r = enviar("/api/jogo/monstros/abate",
                "{\"idAbate\":\"" + id + "\",\"xp\":9999,\"moedas\":9999,\"faseNumero\":5,\"usuarioId\":1}", a, 200);
        assertTrue(r.get("recompensado").asBoolean());
        assertFalse(r.get("repetido").asBoolean());
        assertEquals(1, r.get("faseNumero").asInt(), "a fase vem do progresso no servidor");
        assertEquals(1, r.get("xp").asInt());
        assertEquals(1, r.get("moedas").asInt());

        JsonNode depois = estado(a).get("carteira");
        assertEquals(1, depois.get("moedas").asInt());
        assertEquals(1, depois.get("experienciaXp").asInt());

        // Mesma requisição de novo (falha de rede, reentrada na tela): devolve o original e não paga
        JsonNode repetida = abater(a, id);
        assertTrue(repetida.get("repetido").asBoolean());
        assertEquals(1, repetida.get("saldoMoedas").asInt());
        assertEquals(1, estado(a).get("carteira").get("moedas").asInt(), "saldo permanece correto");
        assertEquals(1, abateRepository.countByUsuarioIdAndDiaAndRecompensadoTrue(usuario("heracles@olimpo.com").getId(), Relogio.hoje()));

        // Entradas inválidas e sem token
        enviar("/api/jogo/monstros/abate", "{\"idAbate\":\"nao-e-uuid\"}", a, 400);
        enviar("/api/jogo/monstros/abate", "{}", a, 400);
        assertTrue(mvc.perform(post("/api/jogo/monstros/abate").contentType(MediaType.APPLICATION_JSON)
                .content("{\"idAbate\":\"" + UUID.randomUUID() + "\"}")).andReturn().getResponse().getStatus() >= 400);
    }

    @Test
    @DisplayName("Ritmo incompatível com o combate (mais de 8 em 10 s) não paga; o abate recusado nunca paga depois")
    void protecaoDeRitmo() throws Exception {
        String a = conta("Ícaro", "icaro@olimpo.com", "123.456.789-09");
        int pagos = 0;
        String recusado = null;
        for (int i = 0; i < 12; i++) {
            String id = UUID.randomUUID().toString();
            JsonNode r = abater(a, id);
            if (r.get("recompensado").asBoolean()) pagos++;
            else if (recusado == null) { recusado = id; assertEquals("RITMO", r.get("motivo").asText()); }
        }
        assertEquals(8, pagos, "o motor real nunca passa de 6 abates em 10 s; o servidor aceita até 8");
        assertNotNull(recusado);
        assertEquals(8, estado(a).get("carteira").get("moedas").asInt());
        JsonNode reenvio = abater(a, recusado);
        assertTrue(reenvio.get("repetido").asBoolean());
        assertFalse(reenvio.get("recompensado").asBoolean());
        assertEquals(8, estado(a).get("carteira").get("moedas").asInt());
    }

    @Test
    @DisplayName("Limites diários: 50 abates recompensados e no máximo 3 baús de monstro por dia")
    void limitesDiarios() throws Exception {
        String a = conta("Perseu", "perseu@olimpo.com", "529.982.247-25");
        Usuario u = usuario("perseu@olimpo.com");

        abatesAntigos(u, 48, true); // 48 abates hoje já com baú → limite de 3 baús atingido
        for (int i = 0; i < 2; i++) {
            JsonNode r = abater(a, UUID.randomUUID().toString());
            assertTrue(r.get("recompensado").asBoolean());
            assertTrue(r.get("bauId").isNull(), "limite de 3 baús de monstro por dia já atingido");
        }
        JsonNode r51 = abater(a, UUID.randomUUID().toString());
        assertFalse(r51.get("recompensado").asBoolean());
        assertEquals("LIMITE_DIARIO", r51.get("motivo").asText());
        assertEquals(50, r51.get("abatesRecompensadosHoje").asInt());
        assertEquals(2, estado(a).get("carteira").get("moedas").asInt(), "só os 2 abates via API pagaram");
        assertEquals(0, estado(a).get("bausPendentes").asInt());
    }

    @Test
    @DisplayName("Abates simultâneos com o mesmo UUID pagam uma única vez (carteira travada)")
    void concorrenciaMesmoAbate() throws Exception {
        String a = conta("Orfeu", "orfeu@olimpo.com", "111.444.777-35");
        estado(a); // cria carteira e progresso
        String id = UUID.randomUUID().toString();
        ExecutorService pool = Executors.newFixedThreadPool(4);
        List<Future<JsonNode>> fut = new ArrayList<>();
        CountDownLatch largada = new CountDownLatch(1);
        for (int i = 0; i < 4; i++) {
            fut.add(pool.submit(() -> { largada.await(); return abater(a, id); }));
        }
        largada.countDown();
        int novos = 0;
        for (Future<JsonNode> f : fut) if (!f.get(30, TimeUnit.SECONDS).get("repetido").asBoolean()) novos++;
        pool.shutdown();
        assertEquals(1, novos);
        assertEquals(1, estado(a).get("carteira").get("moedas").asInt());
    }

    @Test
    @DisplayName("Contas isoladas: o abate de B não muda a carteira de A")
    void isolamento() throws Exception {
        String a = conta("Jasão", "jasao@olimpo.com", "935.411.347-80");
        String b = conta("Medeia", "medeia@olimpo.com", "862.738.170-49");
        String id = UUID.randomUUID().toString();
        abater(b, id);
        // A usando o mesmo UUID: é outro abate (da conta A), não o de B
        JsonNode ra = abater(a, id);
        assertFalse(ra.get("repetido").asBoolean());
        assertEquals(1, estado(a).get("carteira").get("moedas").asInt());
        assertEquals(1, estado(b).get("carteira").get("moedas").asInt());
    }

    @Test
    @DisplayName("RF19: estado mostra nível e barra pela curva; vários níveis de uma vez; teto 10")
    void nivelPeloXpTotal() throws Exception {
        String a = conta("Aquiles", "aquiles@olimpo.com", "248.438.034-80");
        estado(a);
        Carteira c = carteiraRepository.findByUsuarioId(usuario("aquiles@olimpo.com").getId()).orElseThrow();
        c.setExperienciaXp(369L); // nível gravado (1) defasado de propósito
        carteiraRepository.save(c);

        JsonNode at = estado(a).get("atributos");
        assertEquals(3, at.get("nivel").asInt());
        assertEquals(119, at.get("xpNoNivel").asInt()); // 369 − 250
        assertEquals(200, at.get("xpParaProximoNivel").asInt());
        assertEquals(14, at.get("forcaBase").asInt());
        assertEquals(4, at.get("agilidade").asInt());

        // +1 XP do javali cruza nada; agora uma recompensa grande: vai direto do 3 ao 10
        c = carteiraRepository.findByUsuarioId(c.getUsuario().getId()).orElseThrow();
        c.setExperienciaXp(2699L);
        carteiraRepository.save(c);
        JsonNode r = abater(a, UUID.randomUUID().toString());
        assertEquals(10, r.get("nivel").asInt());
        at = estado(a).get("atributos");
        assertEquals(10, at.get("nivel").asInt());
        assertEquals(2700, at.get("experiencia").asInt(), "XP total preservado");
        assertEquals(0, at.get("xpParaProximoNivel").asInt());
        assertEquals(28, at.get("forcaBase").asInt());
        assertEquals(115, at.get("vidaMaxima").asInt()); // D45: sem itens, só a vida do nível 10
        assertEquals(18, at.get("agilidadeTotal").asInt());
        assertEquals(847, at.get("intervaloAtaqueMs").asInt());
        assertEquals(28, at.get("danoPorGolpe").asInt());
        assertEquals(10, estado(a).get("carteira").get("nivel").asInt());
    }

    @Test
    @DisplayName("UC12: baú de monstro abre uma vez (409 no segundo toque), item da raridade certa; outra conta não abre")
    void bauDeMonstroUmaVez() throws Exception {
        String a = conta("Teseu", "teseu@olimpo.com", "714.602.380-01");
        String b = conta("Fedra", "fedra@olimpo.com", "406.583.250-00");
        Usuario ua = usuario("teseu@olimpo.com");
        BauPendente bau = new BauPendente();
        bau.setUsuario(ua);
        bau.setTipo(TipoBau.INCOMUM);
        long bauId = bauRepository.save(bau).getId();

        assertEquals("INCOMUM", chamar(get("/api/jogo/baus"), a, 200).get(0).get("tipo").asText());
        enviar("/api/jogo/baus/" + bauId + "/abrir", "", b, 400); // RN07
        JsonNode item = enviar("/api/jogo/baus/" + bauId + "/abrir", "", a, 200);
        assertEquals(Raridade.INCOMUM.name(), item.get("raridade").asText());
        enviar("/api/jogo/baus/" + bauId + "/abrir", "", a, 409);
        assertEquals(1, inventarioRepository.findByUsuarioIdOrderByIdAsc(ua.getId()).size());
        assertEquals(0, inventarioRepository.findByUsuarioIdOrderByIdAsc(usuario("fedra@olimpo.com").getId()).size());
    }

    @Test
    @DisplayName("UC12: dois toques simultâneos no mesmo baú geram um único item")
    void bauConcorrente() throws Exception {
        String a = conta("Ariadne", "ariadne@olimpo.com", "157.856.910-94");
        Usuario ua = usuario("ariadne@olimpo.com");
        BauPendente bau = new BauPendente();
        bau.setUsuario(ua);
        bau.setTipo(TipoBau.COMUM);
        long bauId = bauRepository.save(bau).getId();

        ExecutorService pool = Executors.newFixedThreadPool(4);
        CountDownLatch largada = new CountDownLatch(1);
        List<Future<Integer>> fut = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            fut.add(pool.submit(() -> {
                largada.await();
                var req = post("/api/jogo/baus/" + bauId + "/abrir").header("Authorization", "Bearer " + a);
                return mvc.perform(req).andReturn().getResponse().getStatus();
            }));
        }
        largada.countDown();
        int ok = 0, conflito = 0;
        for (Future<Integer> f : fut) {
            int s = f.get(30, TimeUnit.SECONDS);
            if (s == 200) ok++; else if (s == 409) conflito++;
        }
        pool.shutdown();
        assertEquals(1, ok);
        assertEquals(3, conflito);
        assertEquals(1, inventarioRepository.findByUsuarioIdOrderByIdAsc(ua.getId()).size());
    }

    @Test
    @DisplayName("RN14: meta de hidratação atingida concede 1 baú Bronze, no máximo 1 por dia; XP de 10 por 100 ml")
    void bauBronzeDaHidratacao() throws Exception {
        String a = conta("Hebe", "hebe@olimpo.com", "305.723.170-50"); // 70 kg → meta 2.450 ml
        enviar("/api/hidratacao/registrar", "{\"quantidadeMl\":2000}", a, 201);
        assertEquals(0, estado(a).get("bausPendentes").asInt(), "meta ainda não atingida");
        assertEquals(200, estado(a).get("carteira").get("experienciaXp").asInt()); // RN10
        enviar("/api/hidratacao/registrar", "{\"quantidadeMl\":500}", a, 201);
        JsonNode baus = chamar(get("/api/jogo/baus"), a, 200);
        assertEquals(1, baus.size());
        assertEquals("BRONZE", baus.get(0).get("tipo").asText());
        enviar("/api/hidratacao/registrar", "{\"quantidadeMl\":300}", a, 201);
        assertEquals(1, chamar(get("/api/jogo/baus"), a, 200).size(), "1 Bronze por dia");
    }

    // ─── D45: balanceamento final ────────────────────────────────────────────

    @Test
    @DisplayName("D45: nível 1 começa com 25 de vida, sem itens: dano 10, armadura 0, intervalo 1000 ms")
    void atributosIniciais() throws Exception {
        String a = conta("Talos", "talos.d45@olimpo.com", "467.414.501-57");
        JsonNode at = estado(a).get("atributos");
        assertEquals(1, at.get("nivel").asInt());
        assertEquals(25, at.get("vidaMaxima").asInt());
        assertEquals(10, at.get("danoPorGolpe").asInt());
        assertEquals(0, at.get("bonusArmadura").asInt());
        assertEquals(0, at.get("bonusAgilidade").asInt());
        assertEquals(1000, at.get("intervaloAtaqueMs").asInt());
        assertEquals(0.0, at.get("reducaoDano").asDouble(), 1e-9);
    }

    @Test
    @DisplayName("D45: os 4 atributos do item equipado entram no estado; desequipar recalcula tudo")
    void quatroAtributosNoCombate() throws Exception {
        String a = conta("Dédalo", "dedalo.d45@olimpo.com", "701.414.091-42");
        Usuario u = usuario("dedalo.d45@olimpo.com");
        // Um baú Lendário (sempre 1 dos 4 lendários) e um Raro: abre os dois e equipa (slots diferentes ou não)
        List<JsonNode> itens = new ArrayList<>();
        for (TipoBau t : new TipoBau[]{TipoBau.LENDARIO, TipoBau.RARO}) {
            BauPendente bau = new BauPendente();
            bau.setUsuario(u);
            bau.setTipo(t);
            itens.add(enviar("/api/jogo/baus/" + bauRepository.save(bau).getId() + "/abrir", "", a, 200));
        }
        for (JsonNode i : itens) {
            for (String campo : new String[]{"bonusForca", "bonusVida", "bonusArmadura", "bonusAgilidade"}) {
                assertTrue(i.has(campo) && i.get(campo).asInt() >= 0, campo);
            }
            assertTrue(i.get("bonusArmadura").asInt() + i.get("bonusAgilidade").asInt() > 0,
                    "todo item tem armadura ou agilidade no balanceamento: " + i.get("nome").asText());
        }
        JsonNode lend = itens.get(0);
        chamar(put("/api/jogo/inventario/" + lend.get("id").asLong() + "/equipar"), a, 204);

        JsonNode at = estado(a).get("atributos");
        int arm = lend.get("bonusArmadura").asInt();
        int agi = lend.get("bonusAgilidade").asInt();
        assertEquals(lend.get("bonusForca").asInt(), at.get("bonusForca").asInt());
        assertEquals(arm, at.get("bonusArmadura").asInt());
        assertEquals(agi, at.get("bonusAgilidade").asInt());
        assertEquals(25 + lend.get("bonusVida").asInt(), at.get("vidaMaxima").asInt(), "vida = nível + itens, uma vez só");
        assertEquals(10 + lend.get("bonusForca").asInt(), at.get("danoPorGolpe").asInt(), "força base + força do item, uma vez só");
        assertEquals(agi, at.get("agilidadeTotal").asInt()); // nível 1: agilidade do nível = 0
        assertEquals(com.taskrunning.api.util.RegrasAvatar.intervaloAtaqueMs(agi), at.get("intervaloAtaqueMs").asInt());
        assertEquals(com.taskrunning.api.util.RegrasAvatar.reducaoDano(arm), at.get("reducaoDano").asDouble(), 1e-9);

        // Desequipar: tudo volta ao valor do nível
        chamar(put("/api/jogo/inventario/" + lend.get("id").asLong() + "/equipar"), a, 204);
        at = estado(a).get("atributos");
        assertEquals(25, at.get("vidaMaxima").asInt());
        assertEquals(0, at.get("bonusArmadura").asInt());
        assertEquals(1000, at.get("intervaloAtaqueMs").asInt());
        // RN10 intacta: o bônus de corrida usa só a agilidade do nível
        assertEquals(1.0, at.get("multiplicadorRecompensa").asDouble(), 1e-9);
    }

    @Test
    @DisplayName("D45: catálogo com os 4 atributos; itens antigos são atualizados no lugar (mesmo id, sem duplicar)")
    void catalogoSincronizado() {
        long total = itemCatalogoRepository.count();
        assertEquals(20, total);
        var cajado = itemCatalogoRepository.findById(1).orElseThrow(); // Arma Comum
        assertEquals(3, cajado.getBonusForca());
        assertEquals(0, cajado.getBonusVida());
        assertEquals(0, cajado.getBonusArmadura());
        assertEquals(2, cajado.getBonusAgilidade());
        var manto = itemCatalogoRepository.findById(12).orElseThrow(); // Armadura Lendária
        assertEquals(5, manto.getBonusForca());
        assertEquals(27, manto.getBonusVida());
        assertEquals(18, manto.getBonusArmadura());
        assertEquals(0, manto.getBonusAgilidade());

        // Banco antigo: item com os valores de antes (força/vida antigos, sem armadura/agilidade)
        var tunica = itemCatalogoRepository.findById(9).orElseThrow();
        tunica.setBonusForca(1);
        tunica.setBonusVida(20);
        tunica.setBonusArmadura(0);
        tunica.setBonusAgilidade(0);
        itemCatalogoRepository.save(tunica);
        jogoService.inicializarCatalogos(); // o que roda na inicialização do servidor após o deploy
        tunica = itemCatalogoRepository.findById(9).orElseThrow();
        assertEquals(1, tunica.getBonusForca());
        assertEquals(6, tunica.getBonusVida());
        assertEquals(4, tunica.getBonusArmadura());
        assertEquals("Túnica Simples", tunica.getNome());
        assertEquals(total, itemCatalogoRepository.count(), "nenhum item novo/duplicado");
    }
}
