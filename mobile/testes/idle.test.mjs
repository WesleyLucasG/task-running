// Testes do motor idle. Executar na pasta mobile: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  calcularStatsHeroi, novaVolta, passo, pontosGanhos, POSICOES_MONSTROS,
} from '../src/domain/idle.ts';

const fixo = () => 0.5; // sem variação aleatória (golpe = valor exato)
const base = { forcaBase: 10, vidaMaxima: 100, bonusForca: 0, bonusVida: 0, pontos: { forca: 0, vitalidade: 0, velocidade: 0 } };
const chefeSelado = { podeEnfrentar: false, motivo: 'selado', vidaAtual: 0, vidaMax: 30, limiteDano: 0 };

function rodar(ctx, estado, ms, ate) {
  const eventos = [];
  for (let t = 0; t < ms; t += 100) {
    const r = passo(estado, 100, ctx, fixo);
    estado = r.estado; eventos.push(...r.eventos);
    if (ate && r.eventos.some(ate)) break;
  }
  return { estado, eventos };
}

test('pontos de habilidade: 2 por km concluído', () => {
  assert.equal(pontosGanhos(0), 0);
  assert.equal(pontosGanhos(499), 0);
  assert.equal(pontosGanhos(1000), 2);
  assert.equal(pontosGanhos(3750), 7);
});

test('atributos alteram dano, vida e velocidade', () => {
  const s = calcularStatsHeroi({ ...base, bonusForca: 3, bonusVida: 20, pontos: { forca: 2, vitalidade: 3, velocidade: 10 } });
  assert.equal(s.dano, 10 + 3 + 4);
  assert.equal(s.vidaMax, 100 + 20 + 30);
  assert.equal(s.intervaloMs, 667);
});

test('herói da fase 1 vence os monstros e encontra o chefe selado', () => {
  const ctx = { fase: 1, heroi: calcularStatsHeroi(base), chefe: chefeSelado };
  const { eventos } = rodar(ctx, novaVolta(ctx), 120000, (e) => e.tipo === 'CHEFE_SELADO');
  assert.equal(eventos.filter((e) => e.tipo === 'MONSTRO_DERROTADO').length, POSICOES_MONSTROS.length);
  assert.ok(eventos.some((e) => e.tipo === 'CHEFE_SELADO'));
  assert.ok(!eventos.some((e) => e.tipo === 'HEROI_DERROTADO'));
});

test('herói fraco morre e volta ao início com vida cheia', () => {
  const ctx = { fase: 4, heroi: calcularStatsHeroi(base), chefe: chefeSelado };
  let { estado, eventos } = rodar(ctx, novaVolta(ctx), 120000, (e) => e.tipo === 'HEROI_DERROTADO');
  assert.ok(eventos.some((e) => e.tipo === 'HEROI_DERROTADO'));
  ({ estado } = rodar(ctx, estado, 2000));
  assert.equal(estado.pos > 0 && estado.pos < POSICOES_MONSTROS[0], true);
  assert.equal(estado.vida, ctx.heroi.vidaMax);
});

test('dano no chefe é limitado pela Energia Divina (RN12)', () => {
  const chefe = { podeEnfrentar: true, motivo: null, vidaAtual: 30, vidaMax: 30, limiteDano: 12 };
  const ctx = { fase: 1, heroi: calcularStatsHeroi({ ...base, vidaMaxima: 1000 }), chefe };
  const { eventos } = rodar(ctx, novaVolta(ctx), 120000, (e) => e.tipo === 'CONFRONTO_FIM');
  const fim = eventos.find((e) => e.tipo === 'CONFRONTO_FIM');
  assert.deepEqual(fim, { tipo: 'CONFRONTO_FIM', dano: 12, derrotado: false, causa: 'ENERGIA' });
});

test('chefe com pouca vida é derrotado', () => {
  const chefe = { podeEnfrentar: true, motivo: null, vidaAtual: 8, vidaMax: 30, limiteDano: 50 };
  const ctx = { fase: 1, heroi: calcularStatsHeroi({ ...base, vidaMaxima: 1000 }), chefe };
  const { eventos } = rodar(ctx, novaVolta(ctx), 120000, (e) => e.tipo === 'CONFRONTO_FIM');
  const fim = eventos.find((e) => e.tipo === 'CONFRONTO_FIM');
  assert.equal(fim.derrotado, true);
  assert.equal(fim.dano, 8);
});
