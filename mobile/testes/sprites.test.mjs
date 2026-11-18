// Pixel art: grades válidas, retângulos e versão bloqueada (cinza). Executar na pasta mobile: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emCinza, retangulos, SPRITES_FASE } from '../src/domain/sprites.ts';

test('cada fase tem monstro, chefe e cenário com cores definidas na paleta', () => {
  for (const n of [1, 2, 3, 4, 5]) {
    for (const s of Object.values(SPRITES_FASE[n])) {
      const usados = new Set(s.grade.join('').replace(/\./g, ''));
      for (const c of usados) assert.ok(s.paleta[c], `fase ${n}: cor '${c}' sem paleta`);
      assert.ok(retangulos(s).length > 0);
    }
  }
});

test('pixels vizinhos iguais viram um retângulo só', () => {
  const r = retangulos({ grade: ['AAB.', '.AA.'], paleta: { A: '#FF0000', B: '#00FF00' } });
  assert.deepEqual(r, [[0, 0, 2, 1, '#FF0000'], [2, 0, 1, 1, '#00FF00'], [1, 1, 2, 1, '#FF0000']]);
});

test('versão bloqueada é cinza (R = G = B)', () => {
  const c = emCinza('#16A34A');
  assert.equal(c.slice(1, 3), c.slice(3, 5));
  assert.equal(c.slice(3, 5), c.slice(5, 7));
});
