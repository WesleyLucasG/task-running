// Simulação estatística do balanceamento (usa o MESMO motor da esteira, domain/idle.ts).
// Executar na pasta mobile:
//   node --experimental-strip-types --no-warnings testes/simular-balanceamento.mjs
// Mede, para cada perfil e fase: % de tentativas vencidas, monstros derrotados, vida restante, tempo,
// e quantos baús de monstro são esperados (chance por abate do servidor, RegrasMonstro).
import { calcularStatsHeroi, novaVolta, passo, quantidadeMonstros } from '../src/domain/idle.ts';
import { CATALOGO } from '../src/domain/loja.ts';

// Chance de baú por abate (igual ao servidor, RegrasMonstro.CHANCE_BAU)
export const CHANCE_BAU_MONSTRO = [0.04, 0.05, 0.06, 0.07, 0.08];

export function atributosDoConjunto(itens) {
  return itens.reduce(
    (t, [tipo, raridade]) => {
      const i = CATALOGO.find((c) => c.tipo === tipo && c.raridade === raridade);
      return { forca: t.forca + i.bonusForca, vida: t.vida + i.bonusVida, armadura: t.armadura + i.bonusArmadura, agilidade: t.agilidade + i.bonusAgilidade };
    },
    { forca: 0, vida: 0, armadura: 0, agilidade: 0 },
  );
}

const TENTATIVAS = 200;

// Atributos do nível (servidor, RegrasAvatar): Força 10+2(n-1), Vida 25+10(n-1), Agilidade 2(n-1)
export function heroi(nivel, itens = []) {
  const b = atributosDoConjunto(itens);
  return calcularStatsHeroi({
    forcaBase: 10 + 2 * (nivel - 1),
    vidaMaxima: 25 + 10 * (nivel - 1),
    agilidade: 2 * (nivel - 1),
    bonusForca: b.forca,
    bonusVida: b.vida,
    bonusArmadura: b.armadura,
    bonusAgilidade: b.agilidade,
    pontos: { forca: 0, vitalidade: 0, velocidade: 0 },
  });
}

/** Uma tentativa da fase (chefe selado: mede só os monstros comuns). */
export function tentativa(fase, stats, seed) {
  let s = seed;
  const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const ctx = { fase, heroi: stats, chefe: { podeEnfrentar: false, motivo: 'x', vidaAtual: 0, vidaMax: 1, limiteDano: 0 } };
  let e = novaVolta(ctx);
  let abatidos = 0;
  for (let t = 0; t < 20 * 60000; t += 100) {
    const r = passo(e, 100, ctx, rnd);
    e = r.estado;
    for (const ev of r.eventos) {
      if (ev.tipo === 'MONSTRO_DERROTADO') abatidos++;
      if (ev.tipo === 'HEROI_DERROTADO') return { venceu: false, abatidos, vida: 0, segundos: t / 1000 };
      if (ev.tipo === 'CHEFE_SELADO') return { venceu: true, abatidos, vida: e.vida, segundos: t / 1000 };
    }
  }
  return { venceu: false, abatidos, vida: e.vida, segundos: 1200 };
}

export function avaliar(fase, stats) {
  const rs = Array.from({ length: TENTATIVAS }, (_, i) => tentativa(fase, stats, 7919 * (i + 1)));
  const media = (f) => rs.reduce((a, r) => a + f(r), 0) / rs.length;
  const vitorias = rs.filter((r) => r.venceu);
  return {
    vitoria: Math.round((100 * vitorias.length) / rs.length),
    abatidos: media((r) => r.abatidos),
    vidaFinal: vitorias.length ? vitorias.reduce((a, r) => a + r.vida, 0) / vitorias.length : 0,
    segundos: vitorias.length ? vitorias.reduce((a, r) => a + r.segundos, 0) / vitorias.length : 0,
  };
}

export const PERFIS = {
  'A  nv1 sem itens': [1, []],
  'B  nv2 itens iniciais (arma+botas comuns)': [2, [['ARMA', 'COMUM'], ['BOTAS', 'COMUM']]],
  'B2 nv2 conjunto comum': [2, [['ARMA', 'COMUM'], ['CAPACETE', 'COMUM'], ['ARMADURA', 'COMUM'], ['BOTAS', 'COMUM']]],
  'C  nv4 comum+incomum': [4, [['ARMA', 'INCOMUM'], ['CAPACETE', 'COMUM'], ['ARMADURA', 'INCOMUM'], ['BOTAS', 'COMUM']]],
  'C2 nv5 incomum': [5, [['ARMA', 'INCOMUM'], ['CAPACETE', 'INCOMUM'], ['ARMADURA', 'INCOMUM'], ['BOTAS', 'INCOMUM']]],
  'C3 nv5 sem itens': [5, []],
  'D  nv6 raros': [6, [['ARMA', 'RARO'], ['CAPACETE', 'RARO'], ['ARMADURA', 'RARO'], ['BOTAS', 'RARO']]],
  'D2 nv7 raros (arma+armadura) e incomuns': [7, [['ARMA', 'RARO'], ['CAPACETE', 'INCOMUM'], ['ARMADURA', 'RARO'], ['BOTAS', 'INCOMUM']]],
  'D3 nv7 só defesa rara (capacete+armadura+botas)': [7, [['CAPACETE', 'RARO'], ['ARMADURA', 'RARO'], ['BOTAS', 'RARO']]],
  'E  nv10 épicos': [10, [['ARMA', 'EPICO'], ['CAPACETE', 'EPICO'], ['ARMADURA', 'EPICO'], ['BOTAS', 'EPICO']]],
  'E2 nv10 raros': [10, [['ARMA', 'RARO'], ['CAPACETE', 'RARO'], ['ARMADURA', 'RARO'], ['BOTAS', 'RARO']]],
  'E3 nv10 sem itens': [10, []],
  'X  nv3 comum': [3, [['ARMA', 'COMUM'], ['CAPACETE', 'COMUM'], ['ARMADURA', 'COMUM'], ['BOTAS', 'COMUM']]],
  'X2 nv8 raros': [8, [['ARMA', 'RARO'], ['CAPACETE', 'RARO'], ['ARMADURA', 'RARO'], ['BOTAS', 'RARO']]],
  'X3 nv8 incomuns': [8, [['ARMA', 'INCOMUM'], ['CAPACETE', 'INCOMUM'], ['ARMADURA', 'INCOMUM'], ['BOTAS', 'INCOMUM']]],
  'X4 nv9 raros': [9, [['ARMA', 'RARO'], ['CAPACETE', 'RARO'], ['ARMADURA', 'RARO'], ['BOTAS', 'RARO']]],
  'X5 nv10 incomuns': [10, [['ARMA', 'INCOMUM'], ['CAPACETE', 'INCOMUM'], ['ARMADURA', 'INCOMUM'], ['BOTAS', 'INCOMUM']]],
  'X6 nv9 raros + arma épica': [9, [['ARMA', 'EPICO'], ['CAPACETE', 'RARO'], ['ARMADURA', 'RARO'], ['BOTAS', 'RARO']]],
  'X7 nv10 lendários': [10, [['ARMA', 'LENDARIO'], ['CAPACETE', 'LENDARIO'], ['ARMADURA', 'LENDARIO'], ['BOTAS', 'LENDARIO']]],
};

if (process.argv[1]?.endsWith('simular-balanceamento.mjs')) {
  console.log('Vitória % | monstros derrotados (média) | vida restante | tempo da fase (s)\n');
  for (const [nome, [nivel, itens]] of Object.entries(PERFIS)) {
    const st = heroi(nivel, itens);
    const linha = [1, 2, 3, 4, 5].map((f) => {
      const r = avaliar(f, st);
      return `F${f} ${String(r.vitoria).padStart(3)}% ${r.abatidos.toFixed(1).padStart(4)}/${quantidadeMonstros(f)} hp${r.vidaFinal.toFixed(0).padStart(3)} ${r.segundos.toFixed(0).padStart(3)}s`;
    });
    console.log(`${nome.padEnd(48)} [dano ${st.dano} vida ${st.vidaMax} red ${Math.round(st.reducaoDano * 100)}% int ${st.intervaloMs}ms]`);
    console.log('   ' + linha.join(' | '));
  }
  console.log('\nBaús de monstro esperados por fase completa (sem contar o limite diário):');
  console.log('   ' + [1, 2, 3, 4, 5].map((f) => `F${f}: ${(quantidadeMonstros(f) * CHANCE_BAU_MONSTRO[f - 1]).toFixed(2)}`).join('  '));
}
