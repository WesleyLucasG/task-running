// D45 — balanceamento final: quantidade de monstros, armadura, agilidade, barra da fase, morte/reinício
// e simulações dos perfis A–E com o motor real. Executar na pasta mobile: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  abatidosNaVolta, calcularStatsHeroi, danoRecebido, intervaloAtaque, novaVolta, passo, posicaoChefe,
  posicoesMonstros, progressoDaVolta, quantidadeMonstros, reducaoPorArmadura,
} from '../src/domain/idle.ts';
import { CATALOGO } from '../src/domain/loja.ts';
import { avaliar, heroi, tentativa } from './simular-balanceamento.mjs';

const selado = { podeEnfrentar: false, motivo: 'selado', vidaAtual: 0, vidaMax: 1, limiteDano: 0 };
const pontos = { forca: 0, vitalidade: 0, velocidade: 0 };
const fixo = () => 0.5;

test('quantidade de monstros por fase: 10, 15, 20, 25, 30; chefe depois do último e fora da contagem', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(quantidadeMonstros), [10, 15, 20, 25, 30]);
  for (let f = 1; f <= 5; f++) {
    const pos = posicoesMonstros(f);
    assert.equal(pos.length, quantidadeMonstros(f));
    assert.ok(pos.every((p, i) => i === 0 || p - pos[i - 1] === 12), 'mesmo espaçamento (ritmo de abates inalterado)');
    assert.ok(posicaoChefe(f) > pos[pos.length - 1]);
    const e = novaVolta({ fase: f, heroi: heroi(1), chefe: selado });
    assert.equal(e.inimigos.filter((i) => i.chefe).length, 0, 'o chefe não é um monstro comum');
  }
});

test('armadura reduz o dano recebido, com teto de 60% e golpe mínimo 1 (igual ao servidor)', () => {
  assert.equal(reducaoPorArmadura(0), 0);
  assert.equal(reducaoPorArmadura(10), 0.2);
  assert.equal(reducaoPorArmadura(40), 0.5);
  assert.equal(reducaoPorArmadura(9999), 0.6);
  assert.equal(danoRecebido(5, reducaoPorArmadura(10)), 4);
  assert.equal(danoRecebido(1, 0.6), 1);
  for (let g = 1; g <= 30; g++) for (const r of [0, 0.3, 0.6, 5]) assert.ok(danoRecebido(g, r) >= 1 && danoRecebido(g, r) <= g);
});

test('agilidade reduz o intervalo entre ataques, no máximo 30% (700 ms)', () => {
  assert.equal(intervaloAtaque(0), 1000);
  assert.equal(intervaloAtaque(18), 847);
  assert.equal(intervaloAtaque(500), 700);
  const lento = calcularStatsHeroi({ forcaBase: 10, vidaMaxima: 25, bonusForca: 0, bonusVida: 0, pontos });
  const rapido = calcularStatsHeroi({ forcaBase: 10, vidaMaxima: 25, agilidade: 4, bonusAgilidade: 6, bonusForca: 0, bonusVida: 0, pontos });
  assert.equal(lento.intervaloMs, 1000);
  assert.equal(rapido.intervaloMs, 909);
});

test('modo API: o motor usa intervalo e redução enviados pelo servidor, sem recalcular', () => {
  const s = calcularStatsHeroi({
    forcaBase: 12, vidaMaxima: 35, agilidade: 2, bonusForca: 3, bonusVida: 4, bonusArmadura: 99, bonusAgilidade: 99, pontos,
    servidor: { intervaloAtaqueMs: 950, reducaoDano: 0.1 },
  });
  assert.equal(s.intervaloMs, 950);
  assert.equal(s.reducaoDano, 0.1);
  assert.equal(s.dano, 15, 'força base + força dos itens, uma vez só');
  assert.equal(s.vidaMax, 39, 'vida do nível + vida dos itens, uma vez só');
});

test('itens: os 4 atributos no catálogo (iguais ao servidor) e todo item tem armadura ou agilidade', () => {
  const por = (id) => CATALOGO.find((i) => i.id === id);
  assert.deepEqual([por(1).bonusForca, por(1).bonusVida, por(1).bonusArmadura, por(1).bonusAgilidade], [3, 0, 0, 2]);
  assert.deepEqual([por(9).bonusForca, por(9).bonusVida, por(9).bonusArmadura, por(9).bonusAgilidade], [1, 6, 4, 0]);
  assert.deepEqual([por(12).bonusForca, por(12).bonusVida, por(12).bonusArmadura, por(12).bonusAgilidade], [5, 27, 18, 0]);
  assert.equal(CATALOGO.length, 20);
  for (const i of CATALOGO) assert.ok(i.bonusArmadura + i.bonusAgilidade > 0, i.nome);
});

test('barra da fase acompanha os monstros derrotados (2 de 10 = 20%) e volta a zero na morte', () => {
  const ctx = { fase: 1, heroi: heroi(1), chefe: selado };
  let e = novaVolta(ctx);
  assert.equal(progressoDaVolta(e), 0);
  let mortos = 0;
  while (mortos < 2) {
    const r = passo(e, 100, ctx, fixo);
    e = r.estado;
    mortos += r.eventos.filter((x) => x.tipo === 'MONSTRO_DERROTADO').length;
  }
  assert.equal(progressoDaVolta(e), 0.2);
  assert.deepEqual(abatidosNaVolta(e), { abatidos: 2, total: 10 });
  // Andar sem lutar não enche a barra
  assert.equal(progressoDaVolta({ ...e, pos: e.pos + 50 }), 0.2);
});

test('morte: interrompe, volta ao início com vida cheia, barra zerada e monstros novos (ids nunca repetidos)', () => {
  const ctx = { fase: 3, heroi: heroi(1), chefe: selado };
  let e = novaVolta(ctx);
  const idsPrimeira = new Set(e.inimigos.map((i) => i.id));
  let morreu = false;
  for (let t = 0; t < 600000 && !morreu; t += 100) {
    const r = passo(e, 100, ctx, fixo);
    e = r.estado;
    morreu = r.eventos.some((x) => x.tipo === 'HEROI_DERROTADO');
  }
  assert.ok(morreu, 'nível 1 sem itens morre na fase 3');
  assert.equal(e.modo, 'MORTO');
  // Durante a pausa ninguém luta nem ganha nada
  const parado = passo(e, 100, ctx, fixo);
  assert.equal(parado.eventos.length, 0);
  for (let t = 0; t < 2000; t += 100) e = passo(e, 100, ctx, fixo).estado;
  assert.equal(e.modo, 'ANDANDO');
  assert.ok(e.pos < posicoesMonstros(3)[0]);
  assert.equal(e.vida, ctx.heroi.vidaMax);
  assert.equal(progressoDaVolta(e), 0);
  assert.equal(e.inimigos.length, quantidadeMonstros(3));
  assert.ok(e.inimigos.every((i) => i.vida === i.vidaMax && !idsPrimeira.has(i.id)), 'nova sequência, novos ids');
});

test('vida máxima muda durante a fase: ganho entra na vida atual; perda nunca deixa a vida acima da máxima', () => {
  const ctx1 = { fase: 1, heroi: heroi(1), chefe: selado };
  let e = { ...novaVolta(ctx1), vida: 10 };
  const ctx2 = { ...ctx1, heroi: heroi(2) }; // subiu de nível: 25 → 35
  e = passo(e, 100, ctx2, fixo).estado;
  assert.equal(e.vida, 20);
  const ctx3 = { ...ctx1, heroi: { ...heroi(1), vidaMax: 15 } }; // retirou item
  e = passo({ ...e, vida: 20 }, 100, ctx3, fixo).estado;
  assert.ok(e.vida <= 15);
});

test('armadura e agilidade mudam o resultado real do combate', () => {
  const sem = tentativa(2, heroi(2), 11);
  const comArmadura = tentativa(2, { ...heroi(2), reducaoDano: reducaoPorArmadura(10) }, 11);
  assert.ok(comArmadura.abatidos > sem.abatidos || comArmadura.vida > sem.vida, 'armadura protege');
  const lento = tentativa(1, { ...heroi(1), intervaloMs: 1000 }, 5);
  const rapido = tentativa(1, { ...heroi(1), intervaloMs: 700 }, 5);
  assert.ok(rapido.venceu && rapido.segundos <= lento.segundos && rapido.vida >= lento.vida, 'agilidade acelera e protege');
});

// Simulações (200 tentativas por perfil/fase, mesmo motor do app)
const conjunto = (r) => [['ARMA', r], ['CAPACETE', r], ['ARMADURA', r], ['BOTAS', r]];

test('perfil A (nível 1, 25 de vida, sem itens): vence a fase 1 sempre e morre na fase 2', () => {
  const st = heroi(1);
  assert.equal(st.vidaMax, 25);
  const f1 = avaliar(1, st);
  assert.equal(f1.vitoria, 100);
  assert.equal(f1.abatidos, 10);
  assert.ok(f1.vidaFinal > 0);
  assert.equal(avaliar(2, st).vitoria, 0);
});

test('perfis B–E: cada fase pede mais nível/itens e há mais de uma combinação viável', () => {
  assert.equal(heroi(2).vidaMax, 35);
  assert.equal(avaliar(2, heroi(2, conjunto('COMUM'))).vitoria, 100, 'B: nível 2 com itens comuns vence a fase 2');
  assert.equal(avaliar(3, heroi(4, [['ARMA', 'INCOMUM'], ['CAPACETE', 'COMUM'], ['ARMADURA', 'INCOMUM'], ['BOTAS', 'COMUM']])).vitoria, 100, 'C: fase 3');
  assert.equal(avaliar(3, heroi(5)).vitoria, 0, 'fase 3 sem itens no nível 5 perde');
  assert.ok(avaliar(4, heroi(6, conjunto('RARO'))).vitoria >= 90, 'D: fase 4 com raros');
  assert.equal(avaliar(4, heroi(8, conjunto('INCOMUM'))).vitoria, 100, 'fase 4 também com incomuns no nível 8');
  assert.equal(avaliar(4, heroi(10)).vitoria, 0, 'nível 10 sem itens não passa da fase 4');
  // Fase 5: vencível por 3 combinações diferentes; impossível sem itens ou com nível baixo
  assert.equal(avaliar(5, heroi(10, conjunto('EPICO'))).vitoria, 100, 'E: épicos');
  assert.equal(avaliar(5, heroi(10, conjunto('RARO'))).vitoria, 100, 'raros');
  assert.equal(avaliar(5, heroi(10, conjunto('INCOMUM'))).vitoria, 100, 'incomuns');
  assert.equal(avaliar(5, heroi(10)).vitoria, 0);
  assert.ok(avaliar(5, heroi(7, conjunto('RARO'))).vitoria < 10, 'nível 7 com raros quase nunca vence a fase 5');
});
