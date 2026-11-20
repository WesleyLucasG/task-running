package com.taskrunning.api.service;

import com.taskrunning.api.util.Relogio;
import com.taskrunning.api.dto.request.AparenciaRequestDTO;
import com.taskrunning.api.dto.request.AtacarChefeRequestDTO;
import com.taskrunning.api.exception.ConflictException;
import com.taskrunning.api.util.Auditoria;
import com.taskrunning.api.util.RegrasMonstro;
import com.taskrunning.api.dto.response.*;
import com.taskrunning.api.entity.*;
import com.taskrunning.api.enums.Raridade;
import com.taskrunning.api.enums.SituacaoFase;
import com.taskrunning.api.enums.TipoBau;
import com.taskrunning.api.exception.BusinessRuleException;
import com.taskrunning.api.repository.*;
import com.taskrunning.api.util.RegrasAvatar;
import jakarta.annotation.PostConstruct;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
public class JogoService {

    @Autowired private AparenciaAvatarRepository aparenciaRepo;
    @Autowired private FaseCatalogoRepository faseRepo;
    @Autowired private ProgressoFaseRepository progressoRepo;
    @Autowired private ItemCatalogoRepository itemRepo;
    @Autowired private BauPendenteRepository bauRepo;
    @Autowired private InventarioItemRepository inventarioRepo;
    @Autowired private CarteiraRepository carteiraRepo;
    @Autowired private AtividadeRepository atividadeRepo;
    @Autowired private AbateMonstroRepository abateRepo;
    @Autowired private GamificacaoService gamificacaoService;
    @Autowired private VendaItemRepository vendaRepo;

    private final Random rng = new Random();

    // ─── INICIALIZAÇÃO DO CATÁLOGO ────────────────────────────────────────────

    @PostConstruct
    @Transactional
    public void inicializarCatalogos() {
        inicializarFases();
        inicializarItens();
    }

    private void inicializarFases() {
        if (faseRepo.count() > 0) return;
        faseRepo.saveAll(List.of(
            fase(1, "Bosque de Hermes",      "Um local tranquilo onde novos heróis começam sua jornada.", 2000,  "Ciclope",      30),
            fase(2, "Montanhas de Prata",    "Picos nevados guardados por harpias famintas.",             4000,  "Harpia Rainha",70),
            fase(3, "Deserto de Hélio",      "Areias escaldantes que testam a resistência de qualquer corredor.", 6000, "Minotauro", 120),
            fase(4, "Ruínas de Atenas",      "Templos antigos repletos de sabedoria e fantasmas do passado.", 8000, "Medusa",     180),
            fase(5, "Abismo de Poseidon",    "Profundezas oceânicas onde a pressão é o menor dos seus problemas.", 10000, "Hidra", 250)
        ));
    }

    private FaseCatalogo fase(int num, String nome, String desc, int meta, String chefeNome, int chefeVida) {
        FaseCatalogo f = new FaseCatalogo();
        f.setNumero(num); f.setNome(nome); f.setDescricao(desc);
        f.setMetaDistanciaMetros(meta); f.setChefeNome(chefeNome); f.setChefeVidaMaxima(chefeVida);
        return f;
    }

    private void inicializarItens() {
        // Catálogo idêntico ao mobile (domain/loja.ts). IDs 1–16 fixos + 17-20 Incomum.
        // D45 (balanceamento final): atributos do item Comum × multiplicador da raridade.
        // Arma = força; capacete/armadura = vida e armadura; botas = agilidade. Igual a mobile/src/domain/loja.ts.
        var bases = List.of(
            new BaseItem(com.taskrunning.api.enums.TipoItem.ARMA,     3, 0, 0, 2),
            new BaseItem(com.taskrunning.api.enums.TipoItem.CAPACETE, 1, 4, 2, 0),
            new BaseItem(com.taskrunning.api.enums.TipoItem.ARMADURA, 1, 6, 4, 0),
            new BaseItem(com.taskrunning.api.enums.TipoItem.BOTAS,    1, 2, 1, 3)
        );
        String[][] nomes = {
            {"Cajado de Madeira","Caduceu de Bronze","Caduceu de Prata","Caduceu Dourado"},
            {"Boné de Corredor","Elmo de Bronze","Elmo Alado","Elmo Dourado de Hermes"},
            {"Túnica Simples","Túnica de Atleta","Túnica Olímpica","Manto Dourado de Hermes"},
            {"Tênis Gasto","Tênis de Maratona","Tênis Alado","Sandálias Aladas de Hermes"}
        };
        String[] nomesIncomum = {"Lança de Ferro","Elmo de Ferro","Túnica Reforçada","Tênis de Trilha"};
        Raridade[] raridadesOriginais = {Raridade.COMUM, Raridade.RARO, Raridade.EPICO, Raridade.LENDARIO};
        double[] mult = {1.0, 2.0, 3.0, 4.5}; // Comum, Raro, Épico, Lendário (Incomum = 1,5)

        List<ItemCatalogo> catalogo = new java.util.ArrayList<>();
        for (int t = 0; t < 4; t++) {
            for (int r = 0; r < 4; r++) {
                catalogo.add(item(t * 4 + r + 1, nomes[t][r], raridadesOriginais[r], bases.get(t), mult[r]));
            }
        }
        // Incomum (multiplicador 1.5)
        for (int t = 0; t < 4; t++) {
            catalogo.add(item(17 + t, nomesIncomum[t], Raridade.INCOMUM, bases.get(t), 1.5));
        }
        // Insere o que falta e atualiza SÓ os 4 atributos dos itens já existentes (mesmo id, nome, tipo e
        // raridade): o inventário referencia o item pelo id, então os itens dos jogadores passam a ter os
        // atributos do balanceamento sem apagar nem duplicar nada
        List<ItemCatalogo> paraSalvar = new java.util.ArrayList<>();
        for (ItemCatalogo novo : catalogo) {
            ItemCatalogo atual = itemRepo.findById(novo.getItemId()).orElse(null);
            if (atual == null) {
                paraSalvar.add(novo);
            } else if (!java.util.Objects.equals(atual.getBonusForca(), novo.getBonusForca())
                    || !java.util.Objects.equals(atual.getBonusVida(), novo.getBonusVida())
                    || !java.util.Objects.equals(atual.getBonusArmadura(), novo.getBonusArmadura())
                    || !java.util.Objects.equals(atual.getBonusAgilidade(), novo.getBonusAgilidade())) {
                atual.setBonusForca(novo.getBonusForca());
                atual.setBonusVida(novo.getBonusVida());
                atual.setBonusArmadura(novo.getBonusArmadura());
                atual.setBonusAgilidade(novo.getBonusAgilidade());
                paraSalvar.add(atual);
            }
        }
        if (!paraSalvar.isEmpty()) itemRepo.saveAll(paraSalvar);
    }

    private record BaseItem(com.taskrunning.api.enums.TipoItem tipo, int forca, int vida, int armadura, int agilidade) {}

    private ItemCatalogo item(int id, String nome, Raridade raridade, BaseItem b, double mult) {
        ItemCatalogo i = new ItemCatalogo();
        i.setItemId(id); i.setNome(nome); i.setTipo(b.tipo()); i.setRaridade(raridade);
        i.setBonusForca((int) Math.round(b.forca() * mult));
        i.setBonusVida((int) Math.round(b.vida() * mult));
        i.setBonusArmadura((int) Math.round(b.armadura() * mult));
        i.setBonusAgilidade((int) Math.round(b.agilidade() * mult));
        return i;
    }

    // ─── INICIALIZAÇÃO DO PROGRESSO DO USUÁRIO ────────────────────────────────

    @Transactional
    public void garantirProgressoInicial(Usuario usuario) {
        if (progressoRepo.countByUsuarioId(usuario.getId()) == 0) {
            ProgressoFase p = new ProgressoFase();
            p.setUsuario(usuario);
            p.setFaseNumero(1);
            p.setSituacao(SituacaoFase.ATUAL);
            FaseCatalogo fase1 = faseRepo.findById(1).orElseThrow();
            p.setVidaAtualChefe(fase1.getChefeVidaMaxima());
            progressoRepo.save(p);
        }
    }

    // ─── ESTADO COMPLETO (/api/jogo/estado) ──────────────────────────────────

    @Transactional
    public EstadoJogoResponseDTO obterEstado(Usuario usuario) {
        garantirProgressoInicial(usuario);

        // Conta nova ainda sem corrida: carteira zerada (mesma regra do GamificacaoService), não erro 400
        Carteira carteira = carteiraRepo.findByUsuarioId(usuario.getId()).orElseGet(() -> {
            Carteira nova = new Carteira();
            nova.setUsuario(usuario);
            nova.setMoedas(0);
            nova.setExperienciaXp(0L);
            nova.setNivel(1);
            return carteiraRepo.save(nova);
        });

        int nivel = nivelAtual(carteira);
        AparenciaAvatar ap = aparenciaRepo.findByUsuarioId(usuario.getId())
                .orElseGet(() -> criarAparenciaPadrao(usuario));

        int bonusForca = inventarioRepo.somaBonusForcaEquipado(usuario.getId());
        int bonusVida  = inventarioRepo.somaBonusVidaEquipado(usuario.getId());
        int bonusArmadura  = inventarioRepo.somaBonusArmaduraEquipado(usuario.getId());
        int bonusAgilidade = inventarioRepo.somaBonusAgilidadeEquipado(usuario.getId());
        int agilidadeTotal = RegrasAvatar.agilidade(nivel) + bonusAgilidade;

        List<ProgressoFase> progressos = progressoRepo.findByUsuarioIdOrderByFaseNumeroAsc(usuario.getId());
        // RF20: o mapa mostra todas as fases; as ainda não alcançadas vêm BLOQUEADAS (chefe visível)
        java.util.Map<Integer, ProgressoFase> porNumero = new java.util.HashMap<>();
        progressos.forEach(p -> porNumero.put(p.getFaseNumero(), p));
        List<EstadoJogoResponseDTO.FaseDTO> faseDTOs = faseRepo.findAll().stream()
                .sorted(java.util.Comparator.comparing(FaseCatalogo::getNumero))
                .map(f -> {
                    ProgressoFase p = porNumero.get(f.getNumero());
                    return p == null
                            ? new EstadoJogoResponseDTO.FaseDTO(f.getNumero(), SituacaoFase.BLOQUEADA, 0.0, false, f.getChefeVidaMaxima())
                            : new EstadoJogoResponseDTO.FaseDTO(p.getFaseNumero(), p.getSituacao(),
                                    p.getDistanciaAcumuladaMetros(), p.isChefeLiberado(), p.getVidaAtualChefe());
                })
                .toList();

        ProgressoFase atual = progressos.stream()
                .filter(p -> p.getSituacao() == SituacaoFase.ATUAL)
                .findFirst().orElse(null);

        EstadoJogoResponseDTO.ChefeAtualDTO chefeDTO = null;
        if (atual != null) {
            String motivo = motivoBloqueio(usuario, atual, bonusForca);
            FaseCatalogo fase = faseRepo.findById(atual.getFaseNumero()).orElseThrow();
            int danoEst = motivo == null
                    ? RegrasAvatar.calcularDano(RegrasAvatar.forcaBase(nivel), bonusForca, maiorKmUltimas24h(usuario))
                    : 0;
            chefeDTO = new EstadoJogoResponseDTO.ChefeAtualDTO(
                    atual.getFaseNumero(), motivo == null, motivo, danoEst);
        }

        long bausPendentes = bauRepo.countByUsuarioIdAndAbertoFalse(usuario.getId());

        long xpNoNivel = RegrasAvatar.xpNoNivel(carteira.getExperienciaXp());

        return new EstadoJogoResponseDTO(
                new EstadoJogoResponseDTO.CarteiraDTO(carteira.getMoedas(), carteira.getExperienciaXp(), nivel),
                new EstadoJogoResponseDTO.AtributosDTO(
                        nivel,
                        carteira.getExperienciaXp(),
                        xpNoNivel,
                        RegrasAvatar.xpParaProximoNivel(nivel),
                        RegrasAvatar.forcaBase(nivel),
                        RegrasAvatar.agilidade(nivel),
                        RegrasAvatar.vidaMaxima(nivel) + bonusVida,
                        bonusForca, bonusVida,
                        RegrasAvatar.multiplicadorRecompensa(nivel),
                        bonusArmadura, bonusAgilidade, agilidadeTotal,
                        RegrasAvatar.forcaBase(nivel) + bonusForca,
                        RegrasAvatar.intervaloAtaqueMs(agilidadeTotal),
                        RegrasAvatar.reducaoDano(bonusArmadura)
                ),
                new EstadoJogoResponseDTO.AparenciaDTO(
                        ap.getGenero(), ap.getCabelo(), ap.getCorCabelo(),
                        ap.getCorPele(), ap.getCorRoupa(), ap.getDetalheRoupa()),
                faseDTOs,
                chefeDTO,
                bausPendentes
        );
    }

    // ─── DISTÂNCIA DA CORRIDA → FASE ATUAL ───────────────────────────────────

    /**
     * Chamado uma única vez quando a atividade passa a CONCLUIDA (RN04).
     * RN13: soma a distância na fase atual, limitada à meta. RF21: ao atingir a meta libera o chefe
     * com a vida cheia (RN15). RF22: concede um baú Prata pela meta, uma única vez por fase.
     * Mesma regra do modo local do app (mobile/src/db/fases.ts → registrarDistanciaNaFase).
     */
    @Transactional
    public void registrarDistancia(Usuario usuario, double distanciaMetros) {
        if (!(distanciaMetros > 0)) return;
        garantirProgressoInicial(usuario);
        ProgressoFase atual = progressoRepo
                .findFirstByUsuarioIdAndSituacaoOrderByFaseNumeroAsc(usuario.getId(), SituacaoFase.ATUAL)
                .orElse(null);
        if (atual == null) return; // todas as fases concluídas
        FaseCatalogo fase = faseRepo.findById(atual.getFaseNumero()).orElseThrow();

        double meta = fase.getMetaDistanciaMetros();
        atual.setDistanciaAcumuladaMetros(Math.min(atual.getDistanciaAcumuladaMetros() + distanciaMetros, meta));
        if (!atual.isChefeLiberado() && atual.getDistanciaAcumuladaMetros() >= meta) {
            atual.setChefeLiberado(true);
            atual.setVidaAtualChefe(fase.getChefeVidaMaxima());
            if (!atual.isBauMetaConcedido()) {
                atual.setBauMetaConcedido(true);
                concederBau(usuario, TipoBau.PRATA);
            }
        }
        progressoRepo.save(atual);
    }

    // ─── APARÊNCIA (/api/jogo/aparencia) ─────────────────────────────────────

    @Transactional
    public void salvarAparencia(Usuario usuario, AparenciaRequestDTO dto) {
        AparenciaAvatar ap = aparenciaRepo.findByUsuarioId(usuario.getId())
                .orElseGet(() -> criarAparenciaPadrao(usuario));
        ap.setGenero(dto.genero());
        ap.setCabelo(dto.cabelo());
        ap.setCorCabelo(dto.corCabelo());
        ap.setCorPele(dto.corPele());
        ap.setCorRoupa(dto.corRoupa());
        ap.setDetalheRoupa(dto.detalheRoupa());
        aparenciaRepo.save(ap);
    }

    // ─── BAÚS (/api/jogo/baus) ────────────────────────────────────────────────

    public List<BauResponseDTO> listarBaus(Usuario usuario) {
        return bauRepo.findByUsuarioIdAndAbertoFalseOrderByCriadoEmAsc(usuario.getId())
                .stream()
                .map(b -> new BauResponseDTO(b.getId(), b.getTipo(), b.getCriadoEm()))
                .toList();
    }

    @Transactional
    public InventarioItemResponseDTO abrirBau(Usuario usuario, Long bauId) {
        // RN07: só baús da própria conta; o usuário vem do token, nunca do corpo da requisição
        BauPendente bau = bauRepo.findByIdAndUsuarioId(bauId, usuario.getId())
                .orElseThrow(() -> new BusinessRuleException("Baú não encontrado ou já aberto."));
        // UC12: trava atômica no banco; o segundo toque (ou reenvio) recebe 409 e nenhum item
        if (bauRepo.marcarAberto(bau.getId(), usuario.getId(), Relogio.agora()) == 0) {
            throw new ConflictException("Este baú já foi aberto.");
        }

        Raridade raridade = sortearRaridade(bau.getTipo());
        List<ItemCatalogo> todos = itemRepo.findAll();
        List<ItemCatalogo> opcoes = todos.stream().filter(i -> i.getRaridade() == raridade).toList();
        if (opcoes.isEmpty()) { // proteção: catálogo sem a raridade sorteada → item Comum
            opcoes = todos.stream().filter(i -> i.getRaridade() == Raridade.COMUM).toList();
        }
        ItemCatalogo item = opcoes.get(rng.nextInt(opcoes.size()));

        InventarioItem registro = new InventarioItem();
        registro.setUsuario(usuario);
        registro.setItem(item);
        registro.setEquipado(false);
        inventarioRepo.save(registro);

        return toDTO(registro);
    }

    // ─── INVENTÁRIO (/api/jogo/inventario) ───────────────────────────────────

    public List<InventarioItemResponseDTO> listarInventario(Usuario usuario) {
        return inventarioRepo.findByUsuarioIdOrderByIdAsc(usuario.getId())
                .stream().map(this::toDTO).toList();
    }

    @Transactional
    public void alternarEquipado(Usuario usuario, Long registroId) {
        InventarioItem item = inventarioRepo.findByIdAndUsuarioId(registroId, usuario.getId())
                .orElseThrow(() -> new BusinessRuleException("Item não encontrado no inventário."));
        if (!item.isEquipado()) {
            // RF26 / UC10: cada slot (arma, capacete, armadura, botas) aceita um item; o anterior sai
            inventarioRepo.findByUsuarioIdOrderByIdAsc(usuario.getId()).stream()
                    .filter(o -> o.isEquipado() && o.getItem().getTipo() == item.getItem().getTipo())
                    .forEach(o -> { o.setEquipado(false); inventarioRepo.save(o); });
        }
        item.setEquipado(!item.isEquipado());
        inventarioRepo.save(item);
    }

    // ─── VENDA (/api/jogo/inventario/{id}/vender) ────────────────────────────

    /**
     * Vende um item da mochila pela raridade real (RegrasVenda). Na MESMA transação: apaga o registro
     * do inventário, grava a venda e credita a carteira oficial (travada). Item equipado não é vendido;
     * item de outra conta ou inexistente → 400; reenvio de uma venda já feita devolve o resultado original.
     */
    @Transactional
    public VendaItemResponseDTO venderItem(Usuario usuario, Long registroId) {
        Carteira carteira = gamificacaoService.carteiraTravada(usuario);
        var jaVendido = vendaRepo.findByUsuarioIdAndInventarioItemId(usuario.getId(), registroId);
        if (jaVendido.isPresent()) {
            VendaItem v = jaVendido.get();
            return new VendaItemResponseDTO(registroId, v.getNome(), v.getRaridade(), v.getMoedas(), carteira.getMoedas(), true);
        }
        InventarioItem reg = inventarioRepo.findByIdAndUsuarioId(registroId, usuario.getId())
                .orElseThrow(() -> new BusinessRuleException("Item não encontrado no inventário."));
        if (reg.isEquipado()) {
            throw new BusinessRuleException("Desequipe o item antes de vendê-lo.");
        }
        ItemCatalogo item = reg.getItem();
        int moedas = com.taskrunning.api.util.RegrasVenda.valor(item.getRaridade());
        if (inventarioRepo.apagarSeDesequipado(registroId, usuario.getId()) != 1) {
            throw new ConflictException("O item foi alterado. Atualize o inventário e tente de novo.");
        }
        VendaItem v = new VendaItem();
        v.setUsuario(usuario);
        v.setInventarioItemId(registroId);
        v.setItemId(item.getItemId());
        v.setNome(item.getNome());
        v.setRaridade(item.getRaridade());
        v.setMoedas(moedas);
        vendaRepo.save(v);
        carteira = gamificacaoService.creditar(usuario, 0, moedas);
        Auditoria.registrar("VENDA_ITEM", usuario.getEmail(), item.getRaridade() + " +" + moedas);
        return new VendaItemResponseDTO(registroId, item.getNome(), item.getRaridade(), moedas, carteira.getMoedas(), false);
    }

    // ─── CHEFE (/api/jogo/chefe/atacar) ──────────────────────────────────────

    @Transactional
    public ResultadoAtaqueResponseDTO atacarChefe(Usuario usuario, AtacarChefeRequestDTO dto) {
        garantirProgressoInicial(usuario);

        ProgressoFase prog = progressoRepo
                .findFirstByUsuarioIdAndSituacaoOrderByFaseNumeroAsc(usuario.getId(), SituacaoFase.ATUAL)
                .orElseThrow(() -> new BusinessRuleException("Você já concluiu todas as fases."));

        int bonusForca = inventarioRepo.somaBonusForcaEquipado(usuario.getId());
        String motivo  = motivoBloqueio(usuario, prog, bonusForca);
        if (motivo != null) throw new BusinessRuleException(motivo);

        FaseCatalogo fase = faseRepo.findById(prog.getFaseNumero()).orElseThrow();
        int nivel   = carteiraRepo.findByUsuarioId(usuario.getId())
                .map(this::nivelAtual).orElse(1);
        int forcaBase = RegrasAvatar.forcaBase(nivel);
        double maiorKm = maiorKmUltimas24h(usuario);
        int limite = RegrasAvatar.calcularDano(forcaBase, bonusForca, maiorKm);

        int dano = Math.max(0, Math.min(
                dto.danoCausado() != null ? dto.danoCausado() : limite,
                Math.min(limite, prog.getVidaAtualChefe())));
        int vida = Math.max(0, prog.getVidaAtualChefe() - dano);
        boolean derrotado = vida <= 0;

        prog.setVidaAtualChefe(vida);
        prog.setUltimoAtaqueEm(Relogio.agora()); // mesmo relógio das datas do app

        String proximaFase = null;
        if (derrotado) {
            prog.setSituacao(SituacaoFase.CONCLUIDA);
            progressoRepo.save(prog);
            concederBau(usuario, TipoBau.OURO);
            FaseCatalogo proxima = faseRepo.findById(fase.getNumero() + 1).orElse(null);
            if (proxima != null) {
                ProgressoFase nova = new ProgressoFase();
                nova.setUsuario(usuario);
                nova.setFaseNumero(proxima.getNumero());
                nova.setSituacao(SituacaoFase.ATUAL);
                nova.setVidaAtualChefe(proxima.getChefeVidaMaxima());
                progressoRepo.save(nova);
                proximaFase = proxima.getNome();
            }
        } else {
            progressoRepo.save(prog);
        }

        return new ResultadoAtaqueResponseDTO(dano, vida, fase.getChefeVidaMaxima(), derrotado, proximaFase);
    }

    // ─── MONSTROS DA ESTEIRA (/api/jogo/monstros/abate) ──────────────────────

    /**
     * Extensão de gameplay aprovada (não é a RN10): o app informa só o UUID do abate; o servidor decide
     * fase, XP, moedas e baú pela fase ATUAL do jogador, aplica os limites diários e de ritmo e grava
     * tudo na mesma transação. O mesmo UUID devolve o resultado original sem pagar de novo.
     */
    @Transactional
    public AbateMonstroResponseDTO registrarAbate(Usuario usuario, String idAbate) {
        garantirProgressoInicial(usuario);
        // Trava a carteira primeiro: abates simultâneos da mesma conta são processados um de cada vez
        Carteira carteira = gamificacaoService.carteiraTravada(usuario);
        String id = idAbate.toLowerCase(java.util.Locale.ROOT);

        var existente = abateRepo.findByUsuarioIdAndIdAbate(usuario.getId(), id);
        if (existente.isPresent()) return respostaAbate(existente.get(), true, carteira);

        int fase = progressoRepo
                .findFirstByUsuarioIdAndSituacaoOrderByFaseNumeroAsc(usuario.getId(), SituacaoFase.ATUAL)
                .map(ProgressoFase::getFaseNumero)
                .orElse(5); // todas concluídas: a esteira continua na última terra
        LocalDateTime agora = Relogio.agora();
        java.time.LocalDate hoje = Relogio.hoje();

        AbateMonstro abate = new AbateMonstro();
        abate.setUsuario(usuario);
        abate.setIdAbate(id);
        abate.setFaseNumero(fase);
        abate.setDia(hoje);
        abate.setCriadoEm(agora);

        long uid = usuario.getId();
        if (abateRepo.countByUsuarioIdAndDiaAndRecompensadoTrue(uid, hoje) >= RegrasMonstro.LIMITE_DIARIO_ABATES) {
            abate.setMotivo("LIMITE_DIARIO");
        } else if (abateRepo.countByUsuarioIdAndRecompensadoTrueAndCriadoEmAfter(uid, agora.minusSeconds(10)) >= RegrasMonstro.MAX_ABATES_10S
                || abateRepo.countByUsuarioIdAndRecompensadoTrueAndCriadoEmAfter(uid, agora.minusSeconds(60)) >= RegrasMonstro.MAX_ABATES_60S) {
            abate.setMotivo("RITMO"); // mais rápido do que o combate real permite
            Auditoria.registrar("ABATE_MONSTRO", usuario.getEmail(), "RECUSADO_RITMO");
        } else {
            abate.setRecompensado(true);
            abate.setXp(RegrasMonstro.xpPorAbate(fase));
            abate.setMoedas(RegrasMonstro.moedasPorAbate(fase));
            if (abateRepo.countByUsuarioIdAndDiaAndBauIdIsNotNull(uid, hoje) < RegrasMonstro.LIMITE_DIARIO_BAUS) {
                TipoBau tipo = RegrasMonstro.sortearBau(fase, rng::nextDouble);
                if (tipo != null) {
                    abate.setTipoBau(tipo);
                    abate.setBauId(concederBau(usuario, tipo).getId());
                }
            }
            carteira = gamificacaoService.creditar(usuario, abate.getXp(), abate.getMoedas());
        }
        abateRepo.save(abate);
        return respostaAbate(abate, false, carteira);
    }

    private AbateMonstroResponseDTO respostaAbate(AbateMonstro a, boolean repetido, Carteira carteira) {
        long hoje = abateRepo.countByUsuarioIdAndDiaAndRecompensadoTrue(a.getUsuario().getId(), Relogio.hoje());
        return new AbateMonstroResponseDTO(
                a.isRecompensado(), a.getMotivo(), repetido, a.getFaseNumero(),
                a.getXp(), a.getMoedas(), a.getBauId(), a.getTipoBau(),
                hoje, RegrasMonstro.LIMITE_DIARIO_ABATES,
                RegrasAvatar.nivelPorXp(carteira.getExperienciaXp()),
                carteira.getExperienciaXp(), carteira.getMoedas());
    }

    // ─── HIDRATAÇÃO → BAÚ BRONZE (RN14) ──────────────────────────────────────

    /**
     * RN14: ao atingir 100% da meta diária, 1 baú BRONZE, no máximo 1 por dia (checado por criadoEm,
     * no dia de Brasília). Roda na transação do registro de água, com a carteira travada.
     * @return true se o baú foi concedido agora
     */
    @Transactional
    public boolean concederBauHidratacaoSeDevido(Usuario usuario, int consumidoHojeMl, int metaDiariaMl) {
        if (metaDiariaMl <= 0 || consumidoHojeMl < metaDiariaMl) return false;
        gamificacaoService.carteiraTravada(usuario);
        LocalDateTime inicio = Relogio.hoje().atStartOfDay();
        if (bauRepo.existsByUsuarioIdAndTipoAndCriadoEmGreaterThanEqualAndCriadoEmLessThan(
                usuario.getId(), TipoBau.BRONZE, inicio, inicio.plusDays(1))) {
            return false;
        }
        concederBau(usuario, TipoBau.BRONZE);
        return true;
    }

    // ─── HELPERS ─────────────────────────────────────────────────────────────

    private AparenciaAvatar criarAparenciaPadrao(Usuario usuario) {
        AparenciaAvatar ap = new AparenciaAvatar();
        ap.setUsuario(usuario);
        return aparenciaRepo.save(ap);
    }

    private BauPendente concederBau(Usuario usuario, TipoBau tipo) {
        BauPendente bau = new BauPendente();
        bau.setUsuario(usuario);
        bau.setTipo(tipo);
        return bauRepo.save(bau);
    }

    /** RF19: o nível vem sempre do XP total (curva única); corrige o valor gravado se estiver defasado. */
    private int nivelAtual(Carteira carteira) {
        int nivel = RegrasAvatar.nivelPorXp(carteira.getExperienciaXp());
        if (carteira.getNivel() == null || carteira.getNivel() != nivel) {
            carteira.setNivel(nivel);
            carteiraRepo.save(carteira);
        }
        return nivel;
    }

    /** Maior distância (km) em atividades CONCLUIDAS nas últimas 24h (RN11/RN12). */
    private double maiorKmUltimas24h(Usuario usuario) {
        LocalDateTime corte = Relogio.agora().minusHours(24); // dataFim vem em horário de Brasília
        return atividadeRepo
                .findByUsuarioAndStatusAndDataFimAfter(
                        usuario, com.taskrunning.api.enums.StatusAtividade.CONCLUIDA, corte)
                .stream()
                .mapToDouble(a -> a.getDistanciaMetros() / 1000.0)
                .max().orElse(0.0);
    }

    private String motivoBloqueio(Usuario usuario, ProgressoFase prog, int bonusForca) {
        if (!prog.isChefeLiberado()) {
            return "Complete a meta de distância da fase para liberar o chefe.";
        }
        double maiorKm = maiorKmUltimas24h(usuario);
        if (maiorKm == 0.0) {
            return "Meta atingida! Faça uma corrida nas últimas 24 horas para enfrentar o chefe.";
        }
        if (prog.getUltimoAtaqueEm() != null) {
            boolean temAtividadeDepoisDoAtaque = atividadeRepo
                    .findByUsuarioAndStatusAndDataFimAfter(
                            usuario,
                            com.taskrunning.api.enums.StatusAtividade.CONCLUIDA,
                            prog.getUltimoAtaqueEm())
                    .stream().findAny().isPresent();
            if (!temAtividadeDepoisDoAtaque) {
                return "Faça uma nova atividade para atacar novamente.";
            }
        }
        return null;
    }

    private Raridade sortearRaridade(TipoBau tipo) {
        double r = rng.nextDouble() * 100;
        return switch (tipo) {
            case BRONZE -> r < 80 ? Raridade.COMUM : Raridade.RARO;
            case PRATA  -> r < 50 ? Raridade.COMUM : r < 90 ? Raridade.RARO : Raridade.EPICO;
            case OURO   -> r < 20 ? Raridade.COMUM : r < 60 ? Raridade.RARO : r < 90 ? Raridade.EPICO : Raridade.LENDARIO;
            case COMUM  -> Raridade.COMUM;
            case INCOMUM -> Raridade.INCOMUM;
            case RARO   -> Raridade.RARO;
            case LENDARIO -> Raridade.LENDARIO;
        };
    }

    private InventarioItemResponseDTO toDTO(InventarioItem reg) {
        return new InventarioItemResponseDTO(
                reg.getId(), reg.getItem().getItemId(), reg.getItem().getNome(),
                reg.getItem().getTipo(), reg.getItem().getRaridade(),
                reg.getItem().getBonusForca(), reg.getItem().getBonusVida(),
                reg.isEquipado(), com.taskrunning.api.util.RegrasVenda.valor(reg.getItem().getRaridade()),
                valorOuZero(reg.getItem().getBonusArmadura()), valorOuZero(reg.getItem().getBonusAgilidade()));
    }

    private static int valorOuZero(Integer v) {
        return v == null ? 0 : v;
    }
}
