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
3. Poses do Hermes com fundo transparente → `assets/hermes/*.png`
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
| D10 | Fases | Usar os nomes do Mapa do Figma (Bosque de Hermes…) e manter as metas de distância do código; trava por nível do Figma não entra | RF20/RF21 |

## Correções feitas

- `(tabs)/inventario.tsx` estava sobrescrito por uma cópia da tela de Mapa (commit `ea55e9b`). Restaurado da versão `84107ed`.
- Lint: `useRef(...).current` lido durante a renderização em `mapa.tsx`.

## Andamento (ordem aprovada)

- [x] **0. Base visual**: tokens do Figma (`theme`), fontes, `Botao` (sombra pixel, 5 variantes), `Campo` (ícone, olho de senha, ajuda/erro), `CabecalhoJogo`, `MenuLateral`, `BarraAbas`, `LogoTR`, `useJogador`, branding do `app.json`, Home provisória, placeholder da Loja
- [ ] 1. Abertura
- [ ] 2. Login
- [ ] 3. Cadastro
- [ ] 4. Onboarding com Hermes
- [ ] 5. Permissões
- [ ] 6. Criação de Personagem
- [ ] 7. Tutorial *(depende do Figma)*
- [ ] 8. Home *(depende do Figma)*
- [ ] 9. Menu lateral (estrutura feita no passo 0)
- [ ] 10. Perfil *(depende do Figma)*
- [ ] 11. Corrida e Resumo *(depende do Figma)*
- [ ] 12. Mapa Mundi
- [ ] 13. Inventário e Baús *(depende do Figma)*
- [ ] 14. Loja
- [ ] 15. Combate
- [ ] 16. Integração com o backend (JWT, sincronização) + testes

## Verificações

| Data | Verificação | Resultado |
|---|---|---|
| 16/11/2026 | `tsc --noEmit`, `expo lint`, `expo export --platform android` | OK (1 aviso antigo em `cadastro.tsx`) |
