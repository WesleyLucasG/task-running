// Teste ponta a ponta contra a API REAL (não roda no "npm test": precisa do backend no ar).
// Uso (pasta mobile):
//   node --experimental-strip-types --no-warnings --import ./testes/resolver.mjs testes/e2e-api.mjs http://localhost:8080
// Reproduz as chamadas do app usando as MESMAS funções do app para montar os dados e o hash.
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { dataHoraLocal, pontoParaApi, textoCanonico, umPontoPorSegundo } from '../src/domain/sincronizacao.ts';

const URL = (process.argv[2] ?? 'http://localhost:8080').replace(/\/+$/, '');
const sha = (t) => createHash('sha256').update(t, 'utf8').digest('hex');
let passos = 0;

async function chamar(caminho, { metodo = 'GET', corpo, token } = {}) {
  const r = await fetch(URL + caminho, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const texto = await r.text();
  return { status: r.status, corpo: texto ? JSON.parse(texto) : null };
}
function ok(condicao, msg) {
  assert.ok(condicao, msg);
  passos++;
  console.log(`  ✔ ${msg}`);
}

// CPF válido gerado na hora (para poder rodar o teste várias vezes)
function cpfAleatorio() {
  const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  const dv = (base) => {
    const s = base.reduce((a, d, i) => a + d * (base.length + 1 - i), 0);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  n.push(dv(n));
  n.push(dv(n));
  return n.join('');
}

console.log(`API: ${URL}`);
const saude = await chamar('/api/saude');
ok(saude.status === 200 && saude.corpo.status === 'UP', 'saúde da API');

const cpf = cpfAleatorio();
const cad = await chamar('/auth/register', {
  metodo: 'POST',
  corpo: { nome: 'Teste E2E', email: `e2e-${cpf}@olimpo.com`, senha: 'Senha@123', cpf, peso: 72 },
});
ok(cad.status === 201, 'cadastro (UC01)');

const login = await chamar('/auth/login', { metodo: 'POST', corpo: { cpf, senha: 'Senha@123' } });
ok(login.status === 200 && login.corpo.refreshToken, 'login por CPF devolve access + refresh token');
const token = login.corpo.token;

const perfil = await chamar('/api/perfil', { token });
ok(perfil.corpo.cpf.startsWith('***.***.***-') && Math.round(perfil.corpo.metaAguaMl) === 2520, 'perfil com CPF mascarado e meta de água 35 ml/kg');

// Corrida simulada: 1 ponto/s andando ~3 m/s (10,8 km/h), com 2 pontos no mesmo segundo
const uuid = randomUUID();
const inicio = Date.now() - 600_000;
const pontos = [];
for (let i = 0; i < 300; i++) {
  pontos.push({ latitude: -18.9 - i * 0.000027, longitude: -48.27, altitude: 800, timestamp: inicio + i * 1000 });
}
pontos.splice(10, 0, { ...pontos[10], timestamp: pontos[10].timestamp + 300 }); // duplicado no mesmo segundo
const unicos = umPontoPorSegundo(pontos);

// Delta 1 (em andamento)
let r = await chamar('/api/atividades/sincronizacao/pontos', {
  metodo: 'POST',
  token,
  corpo: { identificadorLocal: uuid, tipoAtividade: 'CORRIDA', dataInicio: dataHoraLocal(inicio), pontos: unicos.slice(0, 150).map(pontoParaApi) },
});
ok(r.status === 200 && r.corpo.quantidadePontos === 150, 'delta 1: servidor confirma 150 pontos');
ok(r.corpo.hashPontos === sha(textoCanonico(unicos.slice(0, 150))), 'RN16: hash do servidor = hash calculado pelo app');

// Delta 2 reenviando 10 pontos já enviados (falha de rede simulada) + novos
r = await chamar('/api/atividades/sincronizacao/pontos', {
  metodo: 'POST',
  token,
  corpo: { identificadorLocal: uuid, tipoAtividade: 'CORRIDA', dataInicio: dataHoraLocal(inicio), pontos: unicos.slice(140, 250).map(pontoParaApi) },
});
ok(r.corpo.quantidadePontos === 250, 'delta 2 com pontos repetidos não duplica (250 pontos)');

// Finaliza mandando só o que falta
const fim = inicio + 300_000;
const fin = await chamar('/api/atividades/sincronizar', {
  metodo: 'POST',
  token,
  corpo: { identificadorLocal: uuid, tipoAtividade: 'CORRIDA', dataInicio: dataHoraLocal(inicio), dataFim: dataHoraLocal(fim), duracaoSegundos: 300, pontosGps: unicos.slice(250).map(pontoParaApi) },
});
ok(fin.status === 201 && fin.corpo.status === 'CONCLUIDA' && fin.corpo.pontosGps.length === unicos.length, 'finalização: CONCLUIDA com todos os pontos');
const km = fin.corpo.distanciaMetros / 1000;
ok(km > 0.85 && km < 0.95, `distância Haversine plausível (${km.toFixed(3)} km)`);

const carteira1 = await chamar('/api/gamificacao/carteira', { token });
const reenvio = await chamar('/api/atividades/sincronizar', {
  metodo: 'POST',
  token,
  corpo: { identificadorLocal: uuid, tipoAtividade: 'CORRIDA', dataInicio: dataHoraLocal(inicio), dataFim: dataHoraLocal(fim), duracaoSegundos: 300, pontosGps: [] },
});
const carteira2 = await chamar('/api/gamificacao/carteira', { token });
ok(reenvio.status === 201 && JSON.stringify(carteira1.corpo) === JSON.stringify(carteira2.corpo), 'RN04: reenvio não duplica recompensa');
ok(carteira1.corpo.moedas === Math.floor(km * 50), `RN10: ${carteira1.corpo.moedas} moedas = 50/km`);

const hist = await chamar('/api/atividades', { token });
ok(hist.corpo.totalElements === 1, 'RF31: histórico lista a corrida');

const h = await chamar('/api/hidratacao/lembrete', { metodo: 'PATCH', token, corpo: { lembreteAtivo: true, intervaloMinutos: 30 } });
const status = await chamar('/api/hidratacao', { token });
ok(h.status === 204 && status.corpo.intervaloMinutos === 30, 'lembrete de água a cada 30 minutos salvo no servidor');

const outro = await chamar('/api/atividades/sincronizacao/' + uuid, { token: 'invalido' });
ok(outro.status === 401 || outro.status === 403, 'sem token válido não acessa dados');

const ren = await chamar('/auth/refresh', { metodo: 'POST', corpo: { refreshToken: login.corpo.refreshToken } });
ok(ren.status === 200, 'RNF07: renovação do token');

console.log(`\nE2E OK: ${passos} verificações.`);
