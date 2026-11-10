# Task Running — App Mobile (MVP)

Aplicativo mobile do Task Running, que transforma corrida e caminhada em
progressão de um RPG idle. Desenvolvido em React Native com Expo.

## Como executar

Pré-requisitos: Node.js e o app Expo Go instalado no celular.

    cd mobile
    npm install
    npx expo start

Escaneie o QR code com o Expo Go (celular e computador na mesma rede).

## Funcionalidades

- Cadastro com validação de CPF, login e bloqueio após 5 tentativas (RNF13)
- Recuperação de senha com código de uso único e validade de 15 minutos
- Editar perfil, com recálculo automático da meta de água (RN09)
- Corrida e caminhada com GPS, mapa OpenStreetMap, modo offline e
  tolerância a perda de sinal (RF12 a RF17, RN01 a RN08)
- Histórico e detalhes da atividade com a rota no mapa (RF31, RF32)
- XP, moedas, níveis e avatar personalizável (RN10, RF11, RF19)
- Hidratação com meta diária, histórico e lembretes (RF09, RF10, RF28 a RF30)
- Baús, inventário e equipamentos (RF22 a RF26)
- Mapa de fases e combate contra o chefe (RN11 a RN15)
- Sincronização de atividades offline sem duplicidade (RN04, RN05)
- Log de auditoria (RNF18, RNF19)

## Decisões de arquitetura

- Localização com `expo-location`, compatível com o Expo Go, no lugar de
  `react-native-geolocation-service`.
- Dados salvos no aparelho (SQLite e AsyncStorage), pois o backend Spring Boot
  ainda não está integrado.
- Mapa OpenStreetMap exibido por uma WebView com Leaflet.
- Regras de negócio isoladas em `src/domain`, sem dependência de tela.

## Limitações desta versão

- Sem backend: autenticação, recuperação de senha e sincronização são
  simuladas localmente. O envio de e-mail não existe.
- O rastreamento GPS funciona com o app aberto e a tela ligada (limite do Expo Go).
- Os tiles do mapa exigem internet. Sem conexão, a atividade continua
  sendo gravada, mas o fundo do mapa fica vazio.
- Lembretes de água por notificação local (não push remoto).
- Sem comparação por hash nem envio apenas das diferenças (RN16).
- O bloco "Modo demonstração" da aba Mapa simula atividades e só aparece em
  desenvolvimento.

## Estrutura

    src/app          telas e rotas (Expo Router)
    src/components   componentes reutilizáveis
    src/domain       regras de negócio puras
    src/db           acesso ao SQLite
    src/services     sincronização e lembretes
    src/state        contexto de autenticação
    src/theme        cores e espaçamentos