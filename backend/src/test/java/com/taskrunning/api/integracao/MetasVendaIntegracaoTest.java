package com.taskrunning.api.integracao;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskrunning.api.entity.*;
import com.taskrunning.api.enums.Raridade;
import com.taskrunning.api.enums.TipoBau;
import com.taskrunning.api.repository.*;
import com.taskrunning.api.service.GamificacaoService;
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
import java.util.*;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

/**
 * RNF16 — metas diárias/semanais (progresso calculado no servidor, resgate único), venda de itens
 * (preço do servidor, transação única, sem duplicidade) e bônus de agilidade da RN10 na corrida.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("teste")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class MetasVendaIntegracaoTest {

    @DynamicPropertySource
    static void bancoProprio(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", () -> "jdbc:h2:mem:metas;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1");
    }

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private CarteiraRepository carteiraRepository;
    @Autowired private AbateMonstroRepository abateRepository;
    @Autowired private BauPendenteRepository bauRepository;
    @Autowired private InventarioItemRepository inventarioRepository;
    @Autowired private ItemCatalogoRepository itemRepository;

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

    private JsonNode metas(String token) throws Exception {
        return chamar(get("/api/jogo/metas"), token, 200);
    }

    private long moedas(String token) throws Exception {
        return chamar(get("/api/jogo/estado"), token, 200).get("carteira").get("moedas").asLong();
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

    private static JsonNode meta(JsonNode lista, String prefixo) {
        for (JsonNode m : lista) if (m.get("codigo").asText().startsWith(prefixo)) return m;
        throw new AssertionError("meta " + prefixo + " não encontrada em " + lista);
    }

    /** Corrida plausível (~111 m/min) terminando em {@code fim}, horário de Brasília como o app envia. */
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

    private void abatesDeHoje(Usuario u, int quantidade, boolean recompensado) {
        for (int i = 0; i < quantidade; i++) {
            AbateMonstro a = new AbateMonstro();
            a.setUsuario(u);
            a.setIdAbate(UUID.randomUUID().toString());
            a.setFaseNumero(1);
            a.setRecompensado(recompensado);
            a.setMotivo(recompensado ? null : "RITMO");
            a.setXp(recompensado ? 1 : 0);
            a.setMoedas(recompensado ? 1 : 0);
            a.setDia(Relogio.hoje());
            a.setCriadoEm(Relogio.agora().minusMinutes(5));
            abateRepository.save(a);
        }
    }

    private long darItem(Usuario u, Raridade raridade) {
        ItemCatalogo item = itemRepository.findAll().stream().filter(i -> i.getRaridade() == raridade).findFirst().orElseThrow();
        InventarioItem reg = new InventarioItem();
        reg.setUsuario(u);
        reg.setItem(item);
        return inventarioRepository.save(reg).getId();
    }

    // ─── metas ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Metas diárias: 3 + bônus, progresso pelo servidor, resgate único, saúde limitada a 100%")
    void metasDiarias() throws Exception {
        String a = conta("Atalanta", "atalanta@olimpo.com", "390.533.447-05");
        Usuario u = usuario("atalanta@olimpo.com");

        JsonNode m = metas(a);
        assertEquals(4, m.get("diarias").size());
        assertEquals(6, m.get("semanais").size());
        assertTrue(m.get("segundosParaRenovarDiarias").asLong() > 0);
        assertTrue(m.get("segundosParaRenovarSemanais").asLong() >= m.get("segundosParaRenovarDiarias").asLong());
        for (JsonNode x : m.get("diarias")) {
            assertEquals(0, x.get("progresso").asLong());
            assertFalse(x.get("concluida").asBoolean());
        }

        // Não concluída → 400; código inexistente → 400
        enviar("/api/jogo/metas/" + meta(m.get("diarias"), "COMBATE").get("codigo").asText() + "/resgatar", "", a, 400);
        enviar("/api/jogo/metas/INVENTADA/resgatar", "", a, 400);

        // Combate: só abates RECOMPENSADOS contam (os recusados por ritmo não)
        int alvoCombate = meta(m.get("diarias"), "COMBATE").get("alvo").asInt();
        abatesDeHoje(u, 30, false);
        assertEquals(0, meta(metas(a).get("diarias"), "COMBATE").get("progresso").asInt());
        abatesDeHoje(u, alvoCombate, true);

        // Corrida de ~2,6 km sincronizada: cumpre "1 atividade" e "2 km"
        correr(a, 24, Relogio.agora().minusMinutes(5));

        // Hidratação: registrar MUITO além da meta não passa de 100% (sem incentivo a excesso)
        enviar("/api/hidratacao/registrar", "{\"quantidadeMl\":5000}", a, 201);

        m = metas(a);
        for (JsonNode x : m.get("diarias")) {
            assertTrue(x.get("concluida").asBoolean(), x.toString());
            assertTrue(x.get("progresso").asLong() <= x.get("alvo").asLong(), "progresso nunca passa do alvo");
        }
        JsonNode agua = meta(m.get("diarias"), "AGUA");
        assertTrue(agua.get("alvo").asInt() <= 2450, "alvo de água é % da meta pessoal (70 kg → 2.450 ml)");

        // Resgata as 3 metas e o bônus; cada resgate credita exatamente o valor da meta
        int total = 0;
        for (JsonNode x : m.get("diarias")) {
            long antes = moedas(a);
            JsonNode r = enviar("/api/jogo/metas/" + x.get("codigo").asText() + "/resgatar", "", a, 200);
            assertEquals(x.get("moedas").asInt(), r.get("moedas").asInt());
            assertEquals(antes + x.get("moedas").asInt(), moedas(a));
            total += x.get("moedas").asInt();
            // Clique repetido / reenvio: 409 e nada é pago
            enviar("/api/jogo/metas/" + x.get("codigo").asText() + "/resgatar", "", a, 409);
        }
        assertTrue(total >= 23 && total <= 33, "diárias rendem de 23 a 33 moedas: " + total);
        for (JsonNode x : metas(a).get("diarias")) assertTrue(x.get("resgatada").asBoolean());
    }

    @Test
    @DisplayName("Metas semanais: progresso parcial, bônus exige as 5; baús abertos contam")
    void metasSemanais() throws Exception {
        String a = conta("Quíron", "quiron@olimpo.com", "123.456.789-09");
        Usuario u = usuario("quiron@olimpo.com");
        correr(a, 24, Relogio.agora().minusMinutes(5));
        for (int i = 0; i < 2; i++) {
            BauPendente b = new BauPendente();
            b.setUsuario(u);
            b.setTipo(TipoBau.COMUM);
            enviar("/api/jogo/baus/" + bauRepository.save(b).getId() + "/abrir", "", a, 200);
        }
        JsonNode s = metas(a).get("semanais");
        long km = meta(s, "SEMANA_5KM").get("progresso").asLong();
        assertTrue(km > 2000 && km < 5000, "distância da semana: " + km);
        assertEquals(1, meta(s, "SEMANA_3DIAS").get("progresso").asInt());
        // 2 abertos agora + 1 baú Prata da meta da fase ainda fechado → 2
        assertEquals(2, meta(s, "SEMANA_3BAUS").get("progresso").asInt());
        assertEquals(0, meta(s, "BONUS_SEMANAL").get("progresso").asInt());
        enviar("/api/jogo/metas/BONUS_SEMANAL/resgatar", "", a, 400);
        enviar("/api/jogo/metas/SEMANA_5KM/resgatar", "", a, 400);
    }

    @Test
    @DisplayName("Resgates simultâneos da mesma meta pagam uma única vez; contas isoladas")
    void resgateConcorrenteEIsolamento() throws Exception {
        String a = conta("Ícaro", "icaro@olimpo.com", "529.982.247-25");
        String b = conta("Dédalo", "dedalo@olimpo.com", "111.444.777-35");
        abatesDeHoje(usuario("icaro@olimpo.com"), 25, true);
        String codigo = meta(metas(a).get("diarias"), "COMBATE").get("codigo").asText();
        long antes = moedas(a);

        ExecutorService pool = Executors.newFixedThreadPool(4);
        CountDownLatch largada = new CountDownLatch(1);
        List<Future<Integer>> fut = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            fut.add(pool.submit(() -> {
                largada.await();
                var req = post("/api/jogo/metas/" + codigo + "/resgatar").header("Authorization", "Bearer " + a);
                return mvc.perform(req).andReturn().getResponse().getStatus();
            }));
        }
        largada.countDown();
        int ok = 0;
        for (Future<Integer> f : fut) if (f.get(30, TimeUnit.SECONDS) == 200) ok++;
        pool.shutdown();
        assertEquals(1, ok);
        assertEquals(antes + meta(metas(a).get("diarias"), "COMBATE").get("moedas").asInt(), moedas(a));

        // B não tem os abates de A: a meta dele está em 0 e o resgate é recusado
        assertEquals(0, meta(metas(b).get("diarias"), "COMBATE").get("progresso").asInt());
        enviar("/api/jogo/metas/" + codigo + "/resgatar", "", b, 400);
    }

    // ─── venda ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Venda: preço do servidor por raridade, item sai e moedas entram juntos, sem duplicidade")
    void vendaDeItens() throws Exception {
        String a = conta("Midas", "midas@olimpo.com", "935.411.347-80");
        String b = conta("Creso", "creso@olimpo.com", "248.438.034-80");
        Usuario u = usuario("midas@olimpo.com");
        long comum = darItem(u, Raridade.COMUM);
        long lendario = darItem(u, Raridade.LENDARIO);
        long equipado = darItem(u, Raridade.RARO);
        chamar(put("/api/jogo/inventario/" + equipado + "/equipar"), a, 204);

        Map<Long, Integer> valores = new HashMap<>();
        for (JsonNode i : chamar(get("/api/jogo/inventario"), a, 200)) valores.put(i.get("id").asLong(), i.get("valorVenda").asInt());
        assertEquals(10, valores.get(comum));
        assertEquals(250, valores.get(lendario));
        assertEquals(60, valores.get(equipado));

        long antes = moedas(a);
        JsonNode v = enviar("/api/jogo/inventario/" + comum + "/vender", "", a, 200);
        assertEquals(10, v.get("moedas").asInt());
        assertFalse(v.get("repetido").asBoolean());
        assertEquals(antes + 10, moedas(a));
        assertTrue(inventarioRepository.findById(comum).isEmpty(), "item removido do inventário");

        // Reenvio da mesma venda: devolve o resultado, não paga de novo
        JsonNode rep = enviar("/api/jogo/inventario/" + comum + "/vender", "", a, 200);
        assertTrue(rep.get("repetido").asBoolean());
        assertEquals(antes + 10, moedas(a));

        // Equipado não vende; outra conta não vende; inexistente não vende
        enviar("/api/jogo/inventario/" + equipado + "/vender", "", a, 400);
        assertTrue(inventarioRepository.findById(equipado).isPresent());
        enviar("/api/jogo/inventario/" + lendario + "/vender", "", b, 400);
        enviar("/api/jogo/inventario/999999/vender", "", a, 400);
        assertEquals(antes + 10, moedas(a));
        assertEquals(0, moedas(b));

        // Desequipar e então vender funciona
        chamar(put("/api/jogo/inventario/" + equipado + "/equipar"), a, 204);
        enviar("/api/jogo/inventario/" + equipado + "/vender", "", a, 200);
        assertEquals(antes + 70, moedas(a));
    }

    @Test
    @DisplayName("Venda: quatro toques simultâneos no mesmo item pagam uma única vez")
    void vendaConcorrente() throws Exception {
        String a = conta("Pandora", "pandora@olimpo.com", "714.602.380-01");
        long reg = darItem(usuario("pandora@olimpo.com"), Raridade.EPICO);
        ExecutorService pool = Executors.newFixedThreadPool(4);
        CountDownLatch largada = new CountDownLatch(1);
        List<Future<String>> fut = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            fut.add(pool.submit(() -> {
                largada.await();
                var req = post("/api/jogo/inventario/" + reg + "/vender").header("Authorization", "Bearer " + a);
                var resp = mvc.perform(req).andReturn().getResponse();
                return resp.getStatus() + " " + resp.getContentAsString(StandardCharsets.UTF_8);
            }));
        }
        largada.countDown();
        int novas = 0;
        for (Future<String> f : fut) {
            String r = f.get(30, TimeUnit.SECONDS);
            assertTrue(r.startsWith("200"), r);
            if (r.contains("\"repetido\":false")) novas++;
        }
        pool.shutdown();
        assertEquals(1, novas);
        assertEquals(120, moedas(a));
    }

    // ─── RN10 ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("RN10: corrida recebe o bônus de agilidade (nível 10 = +9%), sem aplicar duas vezes")
    void bonusDeAgilidadeNaCorrida() throws Exception {
        assertEquals(1.0, GamificacaoService.multiplicadorRn10(1), 1e-9);
        assertEquals(1.09, GamificacaoService.multiplicadorRn10(10), 1e-9);
        assertEquals(1.5, GamificacaoService.multiplicadorRn10(51), 1e-9); // agilidade 100: teto de 50%

        // Nível 1: sem bônus
        String n1 = conta("Hermes", "hermes@olimpo.com", "862.738.170-49");
        double km1 = correr(n1, 24, Relogio.agora().minusMinutes(5)).get("distanciaMetros").asDouble() / 1000.0;
        assertEquals((long) Math.floor(km1 * 50), moedas(n1));

        // Nível 10: +9% em XP e moedas
        String n10 = conta("Apolo", "apolo@olimpo.com", "406.583.250-00");
        chamar(get("/api/jogo/estado"), n10, 200);
        Carteira c = carteiraRepository.findByUsuarioId(usuario("apolo@olimpo.com").getId()).orElseThrow();
        c.setExperienciaXp(2700L);
        carteiraRepository.save(c);
        double km = correr(n10, 24, Relogio.agora().minusMinutes(5)).get("distanciaMetros").asDouble() / 1000.0;
        JsonNode cart = chamar(get("/api/jogo/estado"), n10, 200).get("carteira");
        assertEquals((long) Math.floor(km * 50 * 1.09 + 1e-9), cart.get("moedas").asLong());
        assertEquals(2700 + (long) Math.floor(km * 100 * 1.09 + 1e-9), cart.get("experienciaXp").asLong());
    }
}
