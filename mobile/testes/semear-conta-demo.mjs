// Cria uma conta de DEMONSTRAÇÃO com progresso real, só pela API (como o app faria), para testar as
// telas no emulador contra o backend LOCAL. Nunca rode contra produção.
// Uso (pasta mobile):
//   node --experimental-strip-types --no-warnings --import ./testes/resolver.mjs testes/semear-conta-demo.mjs http://localhost:8080 <cpf> <genero>
import { randomUUID } from 'node:crypto';
import { dataHoraLocal, pontoParaApi } from '../src/domain/sincronizacao.ts';

const URL = (process.argv[2] ?? 'http://localhost:8080').replace(/\/+$/, '');
if (!/localhost|127\.0\.0\.1|10\.0\.2\.2/.test(URL)) throw new Error('Este script só roda contra o backend local.');
const cpf = process.argv[3];
const genero = process.argv[4] ?? 'FEMININO';

async function chamar(caminho, { metodo = 'GET', corpo, token } = {}) {
  const r = await fetch(URL + caminho, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const t = await r.text();
  return { status: r.status, corpo: t ? JSON.parse(t) : null };
}

const nome = genero === 'FEMININO' ? 'Atalanta Veloz' : 'Teseu Veloz';
await chamar('/auth/register', {
  metodo: 'POST',
  corpo: { nome, email: `demo-${cpf}@taskrunning.app`, senha: 'Senha@123', cpf, peso: 62 },
});
const token = (await chamar('/auth/login', { metodo: 'POST', corpo: { cpf, senha: 'Senha@123' } })).corpo.token;

const aparencia =
  genero === 'FEMININO'
    ? { genero, cabelo: 'LONGO', corCabelo: '#B45309', corPele: '#8D5524', corRoupa: '#7C3AED', detalheRoupa: 'CAPA' }
    : { genero, cabelo: 'CURTO', corCabelo: '#111827', corPele: '#F1C27D', corRoupa: '#16A34A', detalheRoupa: 'FAIXA' };
await chamar('/api/jogo/aparencia', { metodo: 'PUT', token, corpo: aparencia });

// Corridas plausíveis (~3 m/s) nas últimas horas: completam a meta da fase 1 e liberam o chefe
async function correr(metros, deslocamentoMs) {
  const t0 = Date.now() + deslocamentoMs;
  const n = Math.ceil(metros / 3);
  const pts = Array.from({ length: n }, (_, i) => ({
    latitude: -18.95 - i * 0.000027, longitude: -48.27, altitude: 800, timestamp: t0 + i * 1000,
  }));
  return chamar('/api/atividades/sincronizar', {
    metodo: 'POST',
    token,
    corpo: {
      identificadorLocal: randomUUID(), tipoAtividade: 'CORRIDA', dataInicio: dataHoraLocal(t0),
      dataFim: dataHoraLocal(t0 + n * 1000), duracaoSegundos: n, pontosGps: pts.map(pontoParaApi),
    },
  });
}
await correr(1200, -3 * 3600_000);
await correr(1300, -3600_000);
// Abre o baú Prata da meta e equipa o item
for (const b of (await chamar('/api/jogo/baus', { token })).corpo) {
  const item = (await chamar(`/api/jogo/baus/${b.id}/abrir`, { metodo: 'POST', token })).corpo;
  await chamar(`/api/jogo/inventario/${item.id}/equipar`, { metodo: 'PUT', token });
}
await chamar('/api/hidratacao/registrar', { metodo: 'POST', token, corpo: { quantidadeMl: 1200 } });
const e = (await chamar('/api/jogo/estado', { token })).corpo;
console.log(`conta demo ${cpf}: nível ${e.atributos.nivel}, ${e.carteira.moedas} moedas, XP ${e.atributos.xpNoNivel}/${e.atributos.xpParaProximoNivel}`);
