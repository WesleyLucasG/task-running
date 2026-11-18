// RNF11: criptografia dos pontos GPS locais. Executar na pasta mobile: npm test
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { cifrarPonto, decifrarPonto } from '../src/domain/cifraGps.ts';

const chave = new Uint8Array(randomBytes(32));
const ponto = { latitude: -18.918612, longitude: -48.277233, altitude: 812.5 };

test('cifra e decifra a coordenada; o texto gravado não contém a coordenada', () => {
  const g = cifrarPonto(chave, new Uint8Array(randomBytes(12)), ponto, 'atv-1');
  assert.ok(!g.includes('18.9186') && !g.includes('48.2772'));
  assert.deepEqual(decifrarPonto(chave, g, 'atv-1'), ponto);
});

test('nonces diferentes geram textos diferentes para o mesmo ponto', () => {
  const a = cifrarPonto(chave, new Uint8Array(randomBytes(12)), ponto, 'atv-1');
  const b = cifrarPonto(chave, new Uint8Array(randomBytes(12)), ponto, 'atv-1');
  assert.notEqual(a, b);
});

test('adulteração, chave errada ou outra atividade são rejeitadas', () => {
  const g = cifrarPonto(chave, new Uint8Array(randomBytes(12)), ponto, 'atv-1');
  const ultimo = g.at(-1) === '0' ? '1' : '0';
  assert.throws(() => decifrarPonto(chave, g.slice(0, -1) + ultimo, 'atv-1'));
  assert.throws(() => decifrarPonto(new Uint8Array(randomBytes(32)), g, 'atv-1'));
  assert.throws(() => decifrarPonto(chave, g, 'atv-2'));
});
