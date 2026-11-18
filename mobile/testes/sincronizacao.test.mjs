// Testes das regras de sincronização (RN16). Executar na pasta mobile: npm test
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { atrasoTentativaMs, dataHoraLocal, textoCanonico } from '../src/domain/sincronizacao.ts';

const sha = (t) => createHash('sha256').update(t, 'utf8').digest('hex');

test('RN16: hash canônico igual ao do backend (mesmo vetor do teste Java)', () => {
  const pontos = [
    { latitude: -18.9186, longitude: -48.2772, timestamp: new Date(2026, 10, 17, 10, 0, 0).getTime() },
    { latitude: -18.919, longitude: -48.2772, timestamp: new Date(2026, 10, 17, 10, 0, 5).getTime() },
  ];
  assert.equal(sha(textoCanonico(pontos)), 'fa14d9b43a1fd71eea23100415c6cfe8c6bd19111e70229fa41e8a5cb428aa6a');
  assert.equal(sha(textoCanonico([])), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
});

test('data/hora local no formato do LocalDateTime (segundos sempre presentes)', () => {
  assert.equal(dataHoraLocal(new Date(2026, 0, 5, 7, 3, 0).getTime()), '2026-01-05T07:03:00');
});

test('espera progressiva entre tentativas, com teto de 10 minutos', () => {
  assert.deepEqual([0, 1, 2, 3].map(atrasoTentativaMs), [5000, 10000, 20000, 40000]);
  assert.equal(atrasoTentativaMs(50), 600000);
});

test('um ponto por segundo: o aparelho conta igual ao servidor', async () => {
  const { umPontoPorSegundo } = await import('../src/domain/sincronizacao.ts');
  const base = new Date(2026, 10, 17, 10, 0, 0).getTime();
  const r = umPontoPorSegundo([{ timestamp: base }, { timestamp: base + 400 }, { timestamp: base + 1000 }]);
  assert.deepEqual(r.map((p) => p.timestamp), [base, base + 1000]);
});
