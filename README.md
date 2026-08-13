# task-running
ESCOPO DO PROJETO — TASK RUNNING




1.1 Contexto e Problema

O sedentarismo é uma das maiores ameaças à saúde pública global do século XXI. De acordo com dados recentes da Organização Mundial da Saúde (OMS) divulgados em parceria com o Hospital Sírio-Libanês, cerca de 47% da população adulta no Brasil é sedentária. O cenário é ainda mais alarmante entre as novas gerações: 84% dos jovens brasileiros não praticam a quantidade mínima recomendada de atividades físicas. Atualmente, o Brasil ocupa o quinto lugar no ranking mundial de sedentarismo e lidera de forma preocupante na América Latina.

A inatividade física está diretamente associada ao aumento de doenças cardiovasculares, obesidade, diabetes tipo 2 e problemas de saúde mental, como ansiedade e depressão. Paradoxalmente, a própria tecnologia — através do uso excessivo de smartphones, computadores e jogos eletrônicos — é apontada como um dos principais fatores que mantêm a população, especialmente os jovens, no comportamento sedentário.

Embora existam diversos aplicativos de saúde e monitoramento físico no mercado (como Strava e Nike Run Club), eles falham em engajar o público que mais precisa de estímulo: os sedentários e os entusiastas de jogos. A maioria dessas ferramentas atua de forma puramente estatística, focando em gráficos de desempenho, calorias e competição direta entre atletas. A gamificação existente nesses apps costuma ser rasa, limitando-se a medalhas virtuais ou sequências de dias de uso (streaks).

O problema central: Não existem soluções acessíveis que unam a prática de exercícios físicos a um sistema de RPG de progressão profunda, onde o esforço físico real se traduza diretamente em evolução de personagem, conquistas de equipamentos e exploração de narrativas interativas. O público jovem prefere passar horas evoluindo personagens virtuais em jogos de RPG a passar 30 minutos caminhando, pois os jogos oferecem recompensas imediatas e sensação de progresso constante que a atividade física tradicional demora a manifestar no corpo.

1.2 Objetivo do Projeto

Objetivo Geral

Desenvolver o Task Running, um sistema gamificado multiplataforma (Web e Mobile) que combate o sedentarismo ao transformar a atividade física real (corrida e caminhada) em combustível para a progressão de um jogo de RPG de turno e exploração (Idle RPG), incentivando hábitos saudáveis através de recompensas virtuais e mecânicas de engajamento contínuo.

1.3 Objetivos específicos


- Permitir cadastro e login de usuários.
- Calcular a meta diária de consumo de água a partir do peso informado, com notificação opcional de lembrete.
- Permitir personalização básica de avatar (gênero, cabelo, cor de pele, cor de roupa). - Registrar sessões de corrida/caminhada via GPS, calculando a distância percorrida pelo usuário.
- Conceder XP e moedas ao usuário proporcionalmente à distância percorrida.
- Apresentar a progressão em um mapa temático (uma fase no MVP), liberando o "confronto com o chefe da fase" quando a meta de distância é atingida.
- Implementar sistema de baús com recompensas de itens de raridade simples (comum / raro).
- Implementar inventário com funcionalidade de equipar e desequipar itens.

1.4 Escopo incluído no MVP (semestre atual)

- Cadastro/login de usuário - Cálculo de meta de água + notificação
- Personalização simples de avatar - Rastreamento de corrida/caminhada via GPS (distância percorrida)
- Sistema de XP e 1 moeda, proporcional à distância
- 1 fase/mapa com liberação de "sala do chefe" ao atingir a meta
- Baús com 2 níveis de raridade (comum/raro)
- Inventário básico (equipar/desequipar)

1.5 Fora do escopo do MVP (roadmap futuro)

- Sistema completo de 5 raridades de moeda e baú com conversão em cascata
- 3 classes de personagem (guerreiro/mago/arqueiro) com 6 slots de equipamento cada
- Árvore de pontos de habilidade (skill points) - Combate em tempo real contra inimigos durante o percurso - Masmorras paralelas exploráveis - Limite diário de tentativas contra o chefe da fase

1.6 Tecnologias propostas (a confirmar formalmente no Checkpoint 3)

- Backend: Java + Spring Boot + banco de dados relacional
- Frontend Web: React - Mobile: React Native (permite reaproveitar lógica e componentes com a web)
- Hospedagem: nuvem gratuita/estudante (a definir no Checkpoint 3)

1.7 Público-alvo

Pessoas que desejam iniciar ou manter uma rotina de corrida/caminhada, mas têm dificuldade em manter a motivação e a constância.
