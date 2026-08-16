2. LEVANTAMENTO DE REQUISITOS

2.1 Requisitos Funcionais (RF)

RF01 - O sistema deve permitir que o usuário se cadastre informando nome,
e-mail, senha e peso.
RF02 - O sistema deve permitir que o usuário cadastrado faça login com
e-mail e senha.
RF03 - O sistema deve calcular a meta diária de consumo de água com base
no peso informado pelo usuário.
RF04 - O sistema deve permitir que o usuário ative ou desative notificações
de lembrete para beber água.
RF05 - O sistema deve permitir que o usuário personalize seu avatar
(gênero, cabelo, cor de pele, cor de roupa).
RF06 - O sistema deve permitir que o usuário inicie uma sessão de
corrida/caminhada com rastreamento por GPS.
RF07 - O sistema deve calcular a distância percorrida pelo usuário durante
a sessão de corrida/caminhada.
RF08 - O sistema deve conceder XP e moedas ao usuário proporcionalmente à
distância percorrida na sessão.
RF09 - O sistema deve elevar o nível do avatar quando o XP acumulado
atingir o limite necessário.
RF10 - O sistema deve exibir a progressão do usuário em um mapa/fase
temática.
RF11 - O sistema deve liberar o confronto com o chefe da fase quando o
usuário atingir a meta de distância definida.
RF12 - O sistema deve conceder baús ao usuário como recompensa por
distância percorrida e/ou ao vencer o chefe.
RF13 - O sistema deve sortear a raridade do baú (comum ou raro) conforme
regras definidas.
RF14 - O sistema deve permitir que o usuário abra baús e receba itens.
RF15 - O sistema deve exibir o inventário do usuário com os itens
recebidos.
RF16 - O sistema deve permitir que o usuário equipe e desequipe itens do
inventário no avatar.

2.2 Requisitos Não Funcionais (RNF)

RNF01 - O sistema deve ser acessível via aplicação web e aplicativo mobile.
RNF02 - O backend deve ser implementado em Java utilizando o framework
Spring Boot.
RNF03 - O sistema deve estar hospedado em ambiente de nuvem, acessível
remotamente.
RNF04 - O tempo de resposta das requisições da API não deve ultrapassar
2 segundos em condições normais de uso.
RNF05 - As senhas dos usuários devem ser armazenadas de forma criptografada
(hash).
RNF06 - O sistema deve funcionar nos principais navegadores (Chrome,
Firefox, Edge) na versão web.
RNF07 - O sistema deve solicitar permissão explícita do usuário para
acessar a localização (GPS) do dispositivo.
RNF08 - O backend deve possuir testes automatizados (TDD) cobrindo as
principais regras de negócio.
RNF09 - O código-fonte deve seguir as convenções de nomenclatura e
organização em pacotes da comunidade Java.