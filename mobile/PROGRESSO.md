# PROGRESSO — Task Running Mobile × Figma

Registro de decisões e andamento da integração do protótipo Figma ao app mobile.
Branch de trabalho: `feature/mobile-figma` (criada a partir da `main`).

## Fontes de referência

| Papel | Fonte |
|---|---|
| Requisitos oficiais | `docs/DOCUMENTO_DE_REQUISITOS_-_TASK_RUNNING_1_3_1.pdf` (v1.3.1, 10/09/2026, última revisão) |
| Referência visual | Figma `yZH5cfJI0hL0jvTQpu371t` (página "Page 1", 27 telas) |
| Regras RN01–RN16 citadas no código | Vieram de material de sessões anteriores; **não constam no PDF 1.3.1**. Mantidas como estão. |

Prioridade em conflito: **requisitos oficiais > Figma > código existente**.

## Telas do Figma

Lidas (12): Abertura `3:2`, Login `3:442`, Cadastro `3:559`, Onboarding 2 `3:131`, Onboarding 3 `3:285`,
Permissões `3:678`, Criação de Personagem `3:806`, Menu Lateral `3:1412`, Loja `3:2900`, Mapa `3:3238`,
Combate `3:3886`.

Pendentes (limite do MCP no plano Starter): Login v2 `24:430`, Onboarding 1 `3:59`, Tutorial `3:982`,
Home `3:1133` / `3:4623` / `5:6201`, Perfil `3:1583`, Inventário `3:1890`, Baús `3:2248`,
Tela de Corrida `3:4147` / `3:4905` / `22:24`, Resumo `3:4369` / `3:5119`, Pop-up de notificação `95:2`,
Tela Bloqueio `108:324`, `6:6392`.
**Plano:** quando a cota do Figma renovar, chamar `get_screenshot` só nesses IDs (1 chamada por tela, sem repetir).

### Imagens indispensáveis (exportar do Figma como PNG)

1. Brasão "TR" (logo) → `assets/images/logo-tr.png` (hoje há um substituto em `LogoTR.tsx`)
2. Fundo pixel art da Abertura/Login → `assets/images/fundo-olimpo.png`
3. ~~Poses do Hermes~~ **feito**: recortadas automaticamente da folha de sprites enviada (11 PNGs em `assets/hermes/`)
4. Ilustração "Terras de Gaia" do Mapa → `assets/images/mapa-gaia.png`
5. Cenário e monstros do Combate → `assets/combate/*.png`

## Decisões e divergências registradas

| # | Tema | Decisão | Base |
|---|---|---|---|
| D1 | Login | **E-mail + senha**. O backend aceita só CPF; ele precisará ser ajustado na integração. | RF04, diagrama de atividades |
| D2 | Combate | Layout do Figma + regra documentada (dano RN12, liberação por meta RF21). Defesa/Fugir/Golpe Divino em tempo real ficam fora | §2.4 "Combate Complexo" é roadmap |
| D3 | Loja | Mantida como **melhoria** (Figma + backend `/api/gamificacao/loja`), não requisito | §2.4 "loja integrada" é roadmap |
| D4 | Baús | O doc prevê comum/raro (RF23); o código usa Bronze/Prata/Ouro + 4 raridades de item. Revisar no passo 13 | RF23 |
| D5 | Menu lateral | "Árvore de Atributos" e "Conquistas" aparecem bloqueadas (em breve) | §2.4 Skill Tree é roadmap |
| D6 | Abas | HOME, MAP, INVENTORY, SHOP (rótulos em inglês como no Figma). Corrida, Hidratação e Perfil viraram telas da pilha | Figma |
| D7 | Pílulas do cabeçalho | 1ª = nível do avatar, 2ª = moedas. A "Energia Divina" do Figma não existe no doc | RF18/RF19 |
| D8 | Classe "Guerreiro" (Criação de Personagem) | Não exibir classes | §2.4 Classes é roadmap |
| D9 | Fontes | Press Start 2P (títulos), Space Mono (rótulos), DM Sans (texto). As duas últimas foram identificadas visualmente; confirmar com `get_variable_defs` quando houver cota | Figma |
| D11 | Dica de senha | Figma diz "mínimo de 6 caracteres"; usado o texto do RF08 (8, letra, número e especial) | RF08 |
| D12 | Textos do Onboarding 2/3 | Layout fiel; descrições ajustadas para não prometer mecânicas fora do escopo (combate em tempo real, armadura) | §2.4 |
| D13 | Fluxo de entrada | Abertura → Onboarding I–III (1ª vez no aparelho) → Cadastro/Login → Permissões → Criação de Personagem (1ª vez da conta) → Home | ordem do canvas do Figma |
| D14 | Cadastro | Campos do Figma (confirmar e-mail, altura opcional, aceite do Código de Honra); peso continua obrigatório | RF01 |
| D15 | **Jogo idle (pedido do Wesley, 17/11)** | Esteira na Home (layout do Figma "Combate"): herói anda sozinho, luta por golpes, vida sobre as cabeças, números de dano, barra "Progresso da fase". Morreu → volta ao início com vida cheia. Fim da fase → chefe na mesma esteira, **respeitando o documento**: só destravado pela meta de distância (RF21) e com atividade recente/nova (UC11); dano total por confronto limitado pela RN12 (= barra "Energia Divina"); vida do chefe persistida (RN15); vitória dá baú e libera a próxima fase (RF22). Monstros comuns não dão moedas/XP (RF18 = só distância real) | pedido + RF18–RF22 |
| D16 | Pontos de habilidade | 2 pontos por km concluído → Força (+2 dano), Vitalidade (+10 vida), Velocidade (+5% ataques). Pontos de Força entram na força base da RN12. Tela `/atributos` (item "Árvore de Atributos" do menu, agora liberado) | pedido (melhoria) |
| D17 | Loja | Catálogo de 16 itens com preços do Figma (150/450/1200/2500), oferta do dia −30% com contagem até meia-noite, compra atômica (saldo + inventário) | D3 |
| D18 | Motor 2D | Não foi usado o `expo-2d-game-engine`: a cena é feita com Views do React Native (motor puro em `domain/idle.ts`), sem dependência nova e compatível com Expo Go | simplicidade/prazo |
| D19 | **Loot e baú de armazenamento (pedido de 17/11)** | Monstro comum: moedas sempre (1/2/2/3/3 por fase) + 20% de baú (70% comum / 25% incomum / 5% raro / 0% lendário), **sem XP** (RF18). Chefe derrotado: baú Ouro (já existia) + 10% de item lendário extra, **uma vez por fase** (tabela `recompensas_chefe`). Baú de armazenamento = coluna `local` no inventário (só muda de lugar, nunca recria a linha); item equipado não pode ser guardado. Configuração central em `domain/recompensas.ts`. Sorteios com gerador criptográfico (`expo-crypto`) | pedido; diverge de RF18 (moedas só por distância) e RF23 (só comum/raro) — divergências aceitas pelo Wesley |
| D20 | Raridade Incomum | Criada para o baú incomum entregar item incomum. 4 itens novos com ids 17–20; ids 1–16 preservados (inventário existente intacto) | D19 |
| D21 | Slots e descarte (pedido de 17/11) | Inventário com silhueta do herói e 4 slots de equipamento (Capacete, Arma, Armadura, Botas), mochila em grade de slots (4 colunas, mínimo 16) e painel do item. Descartar = apaga o item e credita moedas: Comum 2, Incomum 4, Raro 6, **Épico 8 (não definido no pedido)**, Lendário 10. Equipado ou guardado no baú não pode ser descartado | pedido (melhoria) |
| D10 | Fases | Usar os nomes do Mapa do Figma (Bosque de Hermes…) e manter as metas de distância do código; trava por nível do Figma não entra | RF20/RF21 |

## Correções feitas

- `(tabs)/inventario.tsx` estava sobrescrito por uma cópia da tela de Mapa (commit `ea55e9b`). Restaurado da versão `84107ed`.
- Lint: `useRef(...).current` lido durante a renderização em `mapa.tsx`.

## Andamento (ordem aprovada)

- [x] **0. Base visual**: tokens do Figma (`theme`), fontes, `Botao` (sombra pixel, 5 variantes), `Campo` (ícone, olho de senha, ajuda/erro), `CabecalhoJogo`, `MenuLateral`, `BarraAbas`, `LogoTR`, `useJogador`, branding do `app.json`, Home provisória, placeholder da Loja
- [x] 1. Abertura (`components/Abertura.tsx`, exibida no `_layout`)
- [x] 2. Login ("Lembrar-me" real: sem marcar, a sessão não é salva)
- [x] 3. Cadastro
- [x] 4. Onboarding com Hermes (capítulos II e III fiéis; **capítulo I provisório**, tela não consultada)
- [x] 5. Permissões (GPS e notificações reais)
- [x] 6. Criação de Personagem (`SeletorAparencia` reutilizável no Perfil)
- [ ] 7. Tutorial *(depende do Figma)*
- [ ] 8. Home *(depende do Figma)*
- [ ] 9. Menu lateral (estrutura feita no passo 0)
- [ ] 10. Perfil *(depende do Figma)*
- [ ] 11. Corrida e Resumo *(depende do Figma)*
- [x] **Jogo idle** (D15–D16): `domain/idle.ts` (motor puro + 6 testes), `components/jogo/Esteira.tsx`, `state/useEsteira.ts`, Home = Combate, `/atributos`
- [x] **Loot** (D19–D20): moedas e baús por monstro, lendário do chefe, abertura animada, baú de armazenamento no Inventário
- [ ] 12. Mapa Mundi (fases já renomeadas conforme o Figma)
- [x] 13. Inventário e Baús (abas INVENTÁRIO/BAÚ; layout próprio até a tela do Figma ser consultada)
- [x] 14. Loja
- [x] 15. Combate (virou a Home com a esteira)
- [ ] 16. Integração com o backend (JWT, sincronização) + testes

## Verificações

| Data | Verificação | Resultado |
|---|---|---|
| 16/11/2026 | `tsc --noEmit`, `expo lint`, `expo export --platform android` (passo 0) | OK |
| 16/11/2026 | idem (passos 1–6) | OK, 0 erros e 0 avisos |
| 17/11/2026 | `npm test` (motor idle), `tsc`, `lint`, `expo export` | 6/6 testes OK, 0 erros |
| 17/11/2026 | `npm test` (13: motor idle + loot com SQLite em memória), `tsc`, `lint`, `expo export` | 13/13 OK, 0 erros |
| 17/11/2026 | correção do erro do React Compiler + slots/descarte: `npm test`, `tsc`, `lint`, `expo export` | 14/14 OK, 0 erros |

---

## Fase de integração com o backend (18/11/2026) — referência: Documento de Requisitos 2.0

### Decisões
| # | Tema | Decisão | Base |
|---|---|---|---|
| D22 | Login | Mobile entra com **CPF + senha** (autorizado; RF04 cita e-mail). Backend já autenticava por CPF | prompt |
| D23 | CPF (RNF06) | AES-256-GCM no campo `cpf` + índice cego HMAC-SHA256 em `cpf_hash`. Registros antigos em texto puro migram no próximo login (não destrutivo) | RNF06 |
| D24 | JWT | Subject = id do usuário (CPF fora do token); 24 h + refresh token de 30 dias com rotação | RNF07 |
| D25 | Sincronização (RN16) | `sincronizacao_local` no SQLite; delta de pontos a cada 30 s em corrida; hash SHA-256 canônico igual no app e no backend; 1 ponto por segundo; espera progressiva 5 s→10 min | RN04, RN05, RN16 |
| D26 | Modalidade | Mobile oferece só CORRIDA; tipos antigos continuam válidos | prompt |
| D27 | Mapa offline | Sem download de blocos do tile.openstreetmap.org (política OSMF). Sem internet: aviso no mapa e GPS continua gravando | política OSMF |
| D28 | RN11(b) | Chefe exige atividade **sincronizada** nas últimas 24 h; a mensagem diz qual condição falta | RN11 |

### Matriz de integração
| Funcionalidade | Backend | Mobile | Situação |
|---|---|---|---|
| Cadastro | `/auth/register` (CPF validado, 409 em duplicidade) | integrado | Concluído |
| Login CPF + bloqueio | `/auth/login` (RNF13 corrigido) | integrado | Concluído |
| Refresh / logout | `/auth/refresh`, `/auth/logout` | renovação automática no 401 | Concluído |
| Recuperação de senha | `/auth/forgot-password`, `/reset-password` | integrado | **Envio de e-mail pendente (SMTP)** |
| Perfil | `/api/perfil` (CPF mascarado) | integrado | Concluído |
| Atividades + delta + hash | `/api/atividades/...` | integrado | Concluído (E2E) |
| Histórico | `GET /api/atividades` | tela usa o SQLite local | Parcial |
| Hidratação + 30 min | `/api/hidratacao` (+ histórico) | integrado (registro e lembrete) | Concluído |
| XP e moedas (RN10) | carteira corrigida (100 XP / 50 moedas por km) | jogo usa a economia local | Parcial |
| Fases, chefes, baús, itens, aparência | **não existem no backend** | só no aparelho (SQLite) | Pendente no backend |

### Verificações
| Data | O quê | Resultado |
|---|---|---|
| 18/11/2026 | Backend `mvnw test` (JDK 17): unitários + 2 integração H2 | 34/34 |
| 18/11/2026 | Mobile `npm test` | 18/18 |
| 18/11/2026 | E2E `testes/e2e-api.mjs` contra a API real local | 15/15 |
| 18/11/2026 | `tsc`, `expo lint`, `expo export android` | OK |

---

## Rodada de homologação (18/11/2026)

**Auditoria:** branch `feature/mobile-figma` limpa (commit `e302fe7`). `origin/main` traz o frontend Web (Vite, Vercel) e só altera `SecurityConfigurations.java` no backend → conflito com esta branch no merge. API em produção: `https://task-running-api.onrender.com` (versão antiga do `main`, sem refresh/delta/histórico).

| # | Decisão | Base |
|---|---|---|
| D29 | Sincronização compatível com API antiga: sem endpoint de delta, a corrida vai inteira na finalização | segurança dos dados |
| D30 | RNF11: pontos GPS cifrados com AES-256-GCM (`@noble/ciphers`), chave no SecureStore, ID da atividade como dado associado; pontos antigos migram na leitura | RNF11 |
| D31 | Itens do roadmap (Loja, Árvore de Atributos, moedas/baús de monstros) fora do fluxo pela chave `src/config/escopo.ts` | §2.4 |
| D32 | Avatar em camadas: 3 cabelos masculinos + 3 femininos, 6 cores de cabelo, 3 detalhes de roupa. **Persistência só local** até o backend ter os campos | RF11/RF29 |
| D33 | Hermes contextual por eventos reais (saudação, corrida, GPS, sync confirmada, chefe liberado, meta de água, personalização) | prompt |
| D34 | Mapa: chefe visível mesmo bloqueado; tags Bloqueado / Explorando / Meta atingida / Chefe liberado / Chefe derrotado | RN11 |
| D35 | `mobile/.env.production` aponta para o Render (HTTPS) | RNF03/RNF22 |

| Verificação | Resultado |
|---|---|
| Backend `mvnw test` | 34/34 |
| Mobile `npm test` (inclui cifra GPS) | 21/21 |
| `tsc`, `expo lint` | sem erros |
| `expo export` produção (URL do Render embutida) | OK |

---

## RPG no servidor (18/11/2026) — autorizado no complemento

| # | Decisão | Base |
|---|---|---|
| D36 | Backend é a autoridade do jogo: `/api/jogo` (estado, aparência, chefe, baús, inventário). Usuário sempre do token (`@AuthenticationPrincipal`) | RN07 |
| D37 | Sem 2ª economia: reaproveita a **Carteira**. Atributos (força, agilidade, vida) derivados do nível da Carteira, regra já usada pelo app (+2/+2/+10 por nível); RN10 com multiplicador de agilidade | RN10, RF19 |
| D38 | Tabelas novas (sem alterar as existentes): `aparencias_avatar`, `fases`, `progresso_fase`, `itens`, `baus`, `inventario_itens`. `avatares`/`inventario` (loja de skins do Web) intocadas | RF11, RF20–RF26 |
| D39 | Raridades: baús Bronze/Prata/Ouro e itens Comum/Raro/Épico/Lendário, como em UC12 e RN14 (Incomum fica só no modo local) | UC12, RN14 |
| D40 | App em modo API não calcula recompensas: XP/moedas/baú vêm do servidor; cache do último estado só para abrir offline, limpo ao trocar de conta | complemento §3 |
| D41 | Pixel art original de 5 monstros, 5 chefes e 5 cenários (`domain/sprites.ts`); chefes bloqueados em cinza | complemento §2 |

| Verificação | Resultado |
|---|---|
| Backend `mvnw test` (inclui teste A–E de jogo com 2 contas) | 35/35 |
| Mobile `npm test` | 24/24 |
| E2E contra a API real local (`testes/e2e-api.mjs`) | 19/19 |
| `tsc`, `expo lint`, `expo export` produção | OK |

---

## Revisão técnica pré-produção (18/11/2026)

### Regra aprovada pela equipe (NÃO é exigência original do documento)
**D42 — Crescimento de atributos por nível:** +2 Força, +2 Agilidade, +10 Vida a cada nível (base nível 1: Força 10, Agilidade 0, Vida 100). O RF19/RF24 não definem esses valores; é decisão da equipe.
- Implementação: `backend/.../util/RegrasAvatar.java` (servidor, fonte oficial) e `mobile/src/domain/jogo.ts` → `aplicarXp` (modo local).
- RN10: agilidade = 2 × (nível − 1) ⇒ multiplicador = 1 + 0,01 × (nível − 1), teto de 1,5 a partir do nível 51.
- RN12: força base = 10 + 2 × (nível − 1), somada aos bônus dos itens equipados; a vida não entra na RN12 (só na esteira visual).

### Problemas encontrados e corrigidos
| # | Problema | Correção |
|---|---|---|
| R1 | CPFs de produção estão em texto puro **com máscara** (o Web grava assim); a busca legada só tentava dígitos → usuários do Web não entrariam após o deploy | Busca legada tenta: como digitado, só dígitos e com máscara (`CpfCriptografia.variantesLegado`) |
| R2 | Servidor em UTC (Render) × datas do app em horário de Brasília → janela de 24 h (RN11/RN12) com 3 h de erro e ataque bloqueado indevidamente | JVM fixada em `America/Sao_Paulo` (`BackendApplication`) |
| R3 | Rollback do deploy quebraria logins de quem já tivesse o CPF migrado | Migração do CPF legado controlada por `CPF_MIGRAR_LEGADO` (padrão `false` em produção) |
| R4 | Troca de conta no aparelho mantinha lembretes de água e falas do Hermes do usuário anterior | `sair()` cancela lembretes e reinicia o Hermes |
| R5 | Produção atual assina JWT com a chave padrão do código (bloco `api:` aninhado em `spring:` no `main`) e o subject é o CPF | Corrigido nesta branch (chave por `JWT_SECRET`, subject = id); **só vale após o deploy** |

| Verificação | Resultado |
|---|---|
| Backend `mvnw test` (inclui `RevisaoProducaoIntegracaoTest`) | 38/38 |
| Mobile `npm test`, `tsc`, `lint` | 24/24, OK |

---

## Balanceamento final do RPG (20/11/2026) — D45, aprovado pela equipe

**Altera o D42** (vida) e a extensão aprovada dos monstros. RN10, RN12, RN15, curva de XP (RF19), XP/moedas por km e regras de chefe/hidratação **não mudaram**.

| Regra | Antes | Agora (D45) |
|---|---|---|
| Vida do herói | 100 + 10 × (nível − 1) | **25 + 10 × (nível − 1)**: 25, 35, 45, 55, 65, 75, 85, 95, 105, 115 |
| Força / agilidade por nível | +2 / +2 | sem alteração (Força 10 + 2(n−1), Agilidade 2(n−1)) |
| Dano por golpe nos monstros | força base + força dos itens | sem alteração (cada fonte uma vez). Contra o chefe vale a RN12 sem alteração |
| Armadura (itens) | não existia (o painel mostrava a vida dos itens) | redução = armadura ÷ (armadura + 40), teto 60%; golpe recebido = max(1, golpe × (1 − redução)) |
| Agilidade (nível + itens) no combate | não usada | intervalo entre ataques = 1000 ms ÷ (1 + agilidade × 0,01), mínimo 700 ms (até 30% mais rápido). A RN10 continua só com a agilidade do nível |
| Monstros por fase | 7 | **10 / 15 / 20 / 25 / 30** (sempre o monstro da fase, mesmo espaçamento; o chefe não conta) |
| Vida dos monstros (fase 1–5) | 25 / 40 / 58 / 80 / 105 | 18 / 30 / 45 / 62 / 78 |
| Dano dos monstros | 4 / 6 / 8 / 11 / 14 | 2 / 3 / 4 / 5 / 5 (antes da armadura) |
| Dano do chefe na esteira | 7 × 1,5^(f−1) | 3 / 5 / 7 / 9 / 12 (antes da armadura) |
| Chance de baú por abate | 2 / 3 / 4 / 5 / 6% | **4 / 5 / 6 / 7 / 8%**, raridades da Tabela B sem alteração |
| Limite de baús de monstro por dia | 2 | 3 (50 abates/dia e ritmo 8/10 s, 32/60 s sem alteração; o motor novo faz no máximo 6/10 s e 30/60 s) |
| XP / moedas por monstro | 1–5 / 1–3 | sem alteração |

**Itens (4 atributos):** atributos do item Comum × raridade (Comum 1, Incomum 1,5, Raro 2, Épico 3, Lendário 4,5).
Arma ⚔3 ⚡2 · Capacete ⚔1 ❤4 🛡2 · Armadura ⚔1 ❤6 🛡4 · Botas ⚔1 ❤2 🛡1 ⚡3. Ids e nomes não mudaram. Na inicialização o servidor
atualiza os atributos dos itens já existentes no lugar (o inventário aponta para o id), sem apagar nem duplicar. Colunas novas
`bonus_armadura` e `bonus_agilidade` com padrão 0.

**Fonte única:** o servidor calcula vida, dano por golpe, armadura, agilidade total, intervalo e redução (`/api/jogo/estado`);
a esteira usa esses números. As fórmulas em `domain/idle.ts` servem só de reserva (servidor antigo ou modo local) e para os testes.

**Morte:** a luta para, a volta recomeça do início da mesma fase com vida cheia, barra em 0% e monstros novos (ids novos). XP, nível,
moedas e itens são mantidos. Cada abate gera um id próprio no servidor (idempotente), então nada da tentativa anterior é pago de novo.
**Barra da fase:** monstros derrotados ÷ monstros da fase nesta tentativa (não depende do tempo); cheia na etapa do chefe.
**Subir de nível / equipar no meio da fase:** o ganho de vida máxima entra na vida atual; perder vida máxima nunca deixa a vida acima dela.

**Simulação** (`testes/simular-balanceamento.mjs`, 200 tentativas por perfil/fase, motor real): nível 1 sem itens vence a fase 1
sempre (sobram 5 de vida) e perde a 2; nível 2 com itens comuns vence a 2; nível 4 com comum/incomum vence a 3; nível 6 com raros
vence a 4 em 97%; a fase 5 é vencida por nível 10 com incomuns, raros ou épicos e por nível 8–9 com raros, e não é vencida por nível 10 sem itens.
Baús esperados por fase completa: 0,4 / 0,75 / 1,2 / 1,75 / 2,4 (limitados a 3 por dia).
