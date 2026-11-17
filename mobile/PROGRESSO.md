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
