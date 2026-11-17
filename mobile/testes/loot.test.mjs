// Testes do sistema de loot (D19). Executar na pasta mobile: npm test
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { CATALOGO } from '../src/domain/loja.ts';
import {
  CONFIG_RECOMPENSAS, escolherItem, moedasPorMonstro, sortearBauMonstro, sortearLendarioChefe,
} from '../src/domain/recompensas.ts';
import { concederRecompensaChefe, moverItem, recompensarMonstro } from '../src/db/regrasLoot.ts';

// Gerador pseudoaleatório com semente (mulberry32): resultados reproduzíveis
function semente(s) {
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Banco em memória com o mesmo esquema do app, embrulhado na API do expo-sqlite
function novoBanco() {
  const d = new DatabaseSync(':memory:');
  d.exec(`
    CREATE TABLE carteiras (usuario_id TEXT PRIMARY KEY, saldo_moedas INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE itens (id INTEGER PRIMARY KEY, nome TEXT, tipo TEXT, raridade TEXT, bonus_forca INTEGER, bonus_vida INTEGER);
    CREATE TABLE baus (id TEXT PRIMARY KEY, usuario_id TEXT, tipo TEXT, resgatado INTEGER DEFAULT 0, criado_em TEXT, dia TEXT);
    CREATE TABLE inventario (id TEXT PRIMARY KEY, usuario_id TEXT, item_id INTEGER, equipado INTEGER DEFAULT 0,
      data_adquirido TEXT, local TEXT NOT NULL DEFAULT 'INVENTARIO');
    CREATE TABLE recompensas_chefe (usuario_id TEXT, fase_numero INTEGER, concedida_em TEXT,
      PRIMARY KEY (usuario_id, fase_numero));
  `);
  const ins = d.prepare('INSERT INTO itens VALUES (?, ?, ?, ?, ?, ?)');
  for (const i of CATALOGO) ins.run(i.id, i.nome, i.tipo, i.raridade, i.bonusForca, i.bonusVida);
  const db = {
    raw: d,
    runAsync: async (sql, p = []) => ({ changes: Number(d.prepare(sql).run(...p).changes) }),
    getFirstAsync: async (sql, p = []) => d.prepare(sql).get(...p) ?? null,
    withTransactionAsync: async (fn) => {
      d.exec('BEGIN');
      try { await fn(); d.exec('COMMIT'); } catch (e) { d.exec('ROLLBACK'); throw e; }
    },
  };
  return db;
}
const ferramentas = (s = 1) => ({ aleatorio: semente(s), novoId: randomUUID, agora: () => new Date('2026-11-17T12:00:00') });
const saldo = (db) => db.raw.prepare(`SELECT saldo_moedas AS s FROM carteiras WHERE usuario_id = 'u1'`).get()?.s ?? 0;

test('1-2. todo monstro dá moedas, crescendo por fase e balanceado com a loja', async () => {
  assert.deepEqual([1, 2, 3, 4, 5].map((f) => moedasPorMonstro(f)), [1, 2, 2, 3, 3]);
  const db = novoBanco();
  const f = ferramentas();
  for (let i = 0; i < 50; i++) await recompensarMonstro(db, 'u1', 1, f);
  assert.equal(saldo(db), 50);
  // Item comum (150) exige no mínimo ~21 voltas de 7 monstros na fase 1
  assert.ok(150 / (7 * moedasPorMonstro(1)) >= 20);
});

test('3-5. chance de baú ~20% e raridades 70/25/5, nunca lendário', () => {
  const r = semente(42);
  const N = 200000;
  const cont = { COMUM: 0, INCOMUM: 0, RARO: 0, LENDARIO: 0, nada: 0 };
  for (let i = 0; i < N; i++) cont[sortearBauMonstro(r) ?? 'nada']++;
  const bau = N - cont.nada;
  assert.ok(Math.abs(bau / N - 0.2) < 0.005, `baús ${bau / N}`);
  assert.ok(Math.abs(cont.COMUM / N - 0.14) < 0.004);
  assert.ok(Math.abs(cont.INCOMUM / N - 0.05) < 0.003);
  assert.ok(Math.abs(cont.RARO / N - 0.01) < 0.0015);
  assert.equal(cont.LENDARIO, 0);
});

test('5. monstro nunca gera lendário mesmo se o peso for alterado', () => {
  const cfg = { ...CONFIG_RECOMPENSAS, chanceBau: 1, raridadeBau: [['LENDARIO', 1], ['COMUM', 0.0001]] };
  for (let i = 0; i < 1000; i++) assert.notEqual(sortearBauMonstro(Math.random, cfg), 'LENDARIO');
});

test('6. chefe tem ~10% de chance de lendário', () => {
  const r = semente(7);
  let n = 0;
  for (let i = 0; i < 100000; i++) if (sortearLendarioChefe(r)) n++;
  assert.ok(Math.abs(n / 100000 - 0.1) < 0.004);
  for (let i = 0; i < 200; i++) assert.equal(escolherItem(CATALOGO, 'LENDARIO', r).raridade, 'LENDARIO');
});

test('7. recompensa do chefe acontece só uma vez por fase', async () => {
  const db = novoBanco();
  const f = { ...ferramentas(), aleatorio: () => 0 }; // força o drop lendário
  const a = await concederRecompensaChefe(db, 'u1', 1, f);
  const b = await concederRecompensaChefe(db, 'u1', 1, f);
  assert.equal(a.concedida, true);
  assert.equal(a.itemLendario.raridade, 'LENDARIO');
  assert.equal(b.concedida, false);
  assert.equal(db.raw.prepare(`SELECT COUNT(*) n FROM baus WHERE tipo = 'OURO'`).get().n, 1);
  assert.equal(db.raw.prepare(`SELECT COUNT(*) n FROM inventario`).get().n, 1);
  // Outra fase ainda pode recompensar
  assert.equal((await concederRecompensaChefe(db, 'u1', 2, f)).concedida, true);
});

test('8. baú encontrado fica salvo com a raridade sorteada', async () => {
  const db = novoBanco();
  const f = { ...ferramentas(), aleatorio: () => 0.1 }; // < 20% e cai em COMUM
  const r = await recompensarMonstro(db, 'u1', 3, f);
  assert.equal(r.bau.tipo, 'COMUM');
  assert.equal(db.raw.prepare('SELECT tipo FROM baus WHERE id = ?').get(r.bau.id).tipo, 'COMUM');
  assert.equal(saldo(db), moedasPorMonstro(3));
});

test('9-10. mover entre Inventário e Baú não duplica, não perde e persiste', async () => {
  const db = novoBanco();
  const ins = db.raw.prepare(`INSERT INTO inventario (id, usuario_id, item_id, equipado, data_adquirido) VALUES (?, 'u1', ?, ?, 'x')`);
  ins.run('a', 5, 0);
  ins.run('b', 9, 1);
  const antes = db.raw.prepare('SELECT id, item_id FROM inventario ORDER BY id').all();
  await moverItem(db, 'u1', 'a', 'BAU');
  await moverItem(db, 'u1', 'a', 'BAU'); // repetir não muda nada
  assert.equal(db.raw.prepare(`SELECT local FROM inventario WHERE id = 'a'`).get().local, 'BAU');
  await assert.rejects(moverItem(db, 'u1', 'b', 'BAU'), /Desequipe/);
  await assert.rejects(moverItem(db, 'outro', 'a', 'INVENTARIO'), /não encontrado/);
  await moverItem(db, 'u1', 'a', 'INVENTARIO');
  const depois = db.raw.prepare('SELECT id, item_id FROM inventario ORDER BY id').all();
  assert.deepEqual(depois, antes);
});

test('descartar converte em moedas pela raridade e bloqueia equipado/baú', async () => {
  const { descartarItem } = await import('../src/db/regrasLoot.ts');
  const { valorDescarte } = await import('../src/domain/recompensas.ts');
  assert.deepEqual(['COMUM', 'INCOMUM', 'RARO', 'EPICO', 'LENDARIO'].map((r) => valorDescarte(r)), [2, 4, 6, 8, 10]);
  const db = novoBanco();
  const porRaridade = (r) => CATALOGO.find((i) => i.raridade === r).id;
  const ins = db.raw.prepare(`INSERT INTO inventario (id, usuario_id, item_id, equipado, data_adquirido, local) VALUES (?, 'u1', ?, ?, 'x', ?)`);
  ins.run('c', porRaridade('COMUM'), 0, 'INVENTARIO');
  ins.run('l', porRaridade('LENDARIO'), 0, 'INVENTARIO');
  ins.run('e', porRaridade('RARO'), 1, 'INVENTARIO');
  ins.run('b', porRaridade('INCOMUM'), 0, 'BAU');
  assert.equal((await descartarItem(db, 'u1', 'c')).moedas, 2);
  assert.equal((await descartarItem(db, 'u1', 'l')).moedas, 10);
  await assert.rejects(descartarItem(db, 'u1', 'e'), /Desequipe/);
  await assert.rejects(descartarItem(db, 'u1', 'b'), /Retire/);
  await assert.rejects(descartarItem(db, 'u1', 'c'), /não encontrado/); // não descarta duas vezes
  assert.equal(saldo(db), 12);
  assert.deepEqual(db.raw.prepare('SELECT id FROM inventario ORDER BY id').all().map((r) => r.id), ['b', 'e']);
});
