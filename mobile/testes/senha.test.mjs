// RF08 no Mobile — mesma tabela do Backend (RegraSenhaTest.java). Executar na pasta mobile: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { requisitosSenha, validarSenha } from '../src/domain/validacoes.ts';

const CASOS = [
  ['abc123!', false, 'A senha precisa ter no mínimo 8 caracteres.'],
  ['abcdefgh!', false, 'A senha precisa ter ao menos um número.'],
  ['12345678!', false, 'A senha precisa ter ao menos uma letra.'],
  ['Abcdefg1', false, 'A senha precisa ter ao menos um caractere especial.'],
  ['Abcdefg1!', true, null],
  ['Task@2026', true, null],
  ['ação2026!', true, null], // acentos contam como letra
  ['ação20266', false, 'A senha precisa ter ao menos um caractere especial.'], // "ç" não é especial
  ['Senha 2026', false, 'A senha precisa ter ao menos um caractere especial.'], // espaço não é especial
  ['Ñandú#2026', true, null],
  ['пароль1!', true, null],
];

for (const [senha, valida, mensagem] of CASOS) {
  test(`RF08: "${senha}" → ${valida ? 'válida' : 'inválida'}`, () => {
    assert.equal(validarSenha(senha), mensagem);
    assert.equal(requisitosSenha(senha).every((r) => r.atendido), valida);
  });
}

test('checklist atualiza item a item conforme a digitação', () => {
  const estado = (s) => Object.fromEntries(requisitosSenha(s).map((r) => [r.id, r.atendido]));
  assert.deepEqual(estado(''), { tamanho: false, letra: false, numero: false, especial: false });
  assert.deepEqual(estado('T'), { tamanho: false, letra: true, numero: false, especial: false });
  assert.deepEqual(estado('Task@'), { tamanho: false, letra: true, numero: false, especial: true });
  assert.deepEqual(estado('Task@2026'), { tamanho: true, letra: true, numero: true, especial: true });
});
