// RPG 2D v1.1: curva de nível (igual ao servidor), monstros da Tabela A, quadros da espada, javali e
// formatação das metas. Executar na pasta mobile: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { aplicarXp, NIVEL_MAXIMO, progressoXp, xpParaProximoNivel } from '../src/domain/jogo.ts';
import { calcularStatsHeroi, novaVolta, passo, statsMonstro } from '../src/domain/idle.ts';
import { ANGULO_ESPADA, DURACAO_QUADRO_ESPADA, quadroEspada, retangulos, SPRITES_FASE } from '../src/domain/sprites.ts';
import { percentual, textoProgresso, textoRenovacao } from '../src/domain/metas.ts';

test('curva aprovada: 100, 150 … 500 XP por nível e máximo no 10 (igual ao RegrasAvatar do servidor)', () => {
  assert.deepEqual(
    [1, 2, 3, 4, 5, 6, 7, 8, 9].map(xpParaProximoNivel),
    [100, 150, 200, 250, 300, 350, 400, 450, 500],
  );
  assert.equal(xpParaProximoNivel(10), 0);
  assert.equal(NIVEL_MAXIMO, 10);
});

test('aplicarXp (modo local) sobe vários níveis de uma vez, com +2/+2/+10, e para no 10', () => {
  const base = { nivel: 1, experiencia: 0, forcaBase: 10, agilidade: 0, vidaAtual: 100, vidaMaxima: 100 };
  const r = aplicarXp(base, 800); // 100+150+200+250 = 700 → nível 5 com 100 de sobra
  assert.equal(r.nivel, 5);
  assert.equal(r.experiencia, 100);
  assert.equal(r.forcaBase, 18);
  assert.equal(r.agilidade, 8);
  assert.equal(r.vidaMaxima, 140);
  const max = aplicarXp(base, 99999);
  assert.equal(max.nivel, 10);
  assert.equal(max.forcaBase, 28);
  assert.equal(max.vidaMaxima, 190);
});

test('barra de XP: usa o valor do servidor quando existe e não divide por zero no nível máximo', () => {
  assert.deepEqual(progressoXp({ nivel: 3, experiencia: 120, xpParaProximoNivel: 200 }), {
    atual: 120,
    necessario: 200,
    fracao: 0.6,
    maximo: false,
  });
  assert.equal(progressoXp({ nivel: 2, experiencia: 75 }).necessario, 150); // modo local
  const max = progressoXp({ nivel: 10, experiencia: 0, xpParaProximoNivel: 0 });
  assert.equal(max.maximo, true);
  assert.equal(max.fracao, 1);
});

test('Tabela A: vida e dano dos monstros por fase', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map((f) => statsMonstro(f).vidaMax), [25, 40, 58, 80, 105]);
  assert.deepEqual([1, 2, 3, 4, 5].map((f) => statsMonstro(f).dano), [4, 6, 8, 11, 14]);
});

// Simula voltas completas com gerador fixo: true se o herói chega ao fim da fase sem morrer
function venceVolta(fase, nivel, bonusForca = 0, bonusVida = 0) {
  let seed = 11;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const heroi = calcularStatsHeroi({
    forcaBase: 10 + 2 * (nivel - 1),
    vidaMaxima: 100 + 10 * (nivel - 1),
    bonusForca,
    bonusVida,
    pontos: { forca: 0, vitalidade: 0, velocidade: 0 },
  });
  const ctx = { fase, heroi, chefe: { podeEnfrentar: false, motivo: 'x', vidaAtual: 0, vidaMax: 1, limiteDano: 0 } };
  let e = novaVolta(ctx);
  let voltas = 0;
  let mortes = 0;
  for (let t = 0; t < 10 * 60000; t += 100) {
    const r = passo(e, 100, ctx, rnd);
    e = r.estado;
    for (const ev of r.eventos) {
      if (ev.tipo === 'CHEFE_SELADO') voltas++;
      if (ev.tipo === 'HEROI_DERROTADO') mortes++;
    }
  }
  return voltas > 0 && mortes === 0;
}

test('balanceamento: progressão real de dificuldade e fase 5 vencível no nível 10 com itens', () => {
  assert.ok(venceVolta(1, 1), 'fase 1 no nível 1');
  assert.ok(!venceVolta(3, 1), 'fase 3 não é vencida no nível 1');
  assert.ok(venceVolta(3, 4), 'fase 3 no nível 4');
  assert.ok(!venceVolta(5, 5), 'fase 5 não é vencida no nível 5 sem itens');
  assert.ok(venceVolta(5, 10, 14, 70), 'fase 5 no nível 10 com itens raros');
});

test('espada: 3 quadros de ataque logo após o golpe e descanso depois; só lê o instante do golpe', () => {
  const g = 5000;
  assert.equal(quadroEspada(g, g), 1);
  assert.equal(quadroEspada(g + DURACAO_QUADRO_ESPADA, g), 2);
  assert.equal(quadroEspada(g + 2 * DURACAO_QUADRO_ESPADA, g), 3);
  assert.equal(quadroEspada(g + 3 * DURACAO_QUADRO_ESPADA, g), 0);
  assert.equal(quadroEspada(100, -9999), 0); // nenhum golpe ainda
  assert.equal(new Set(Object.values(ANGULO_ESPADA)).size, 4, 'cada quadro tem uma pose diferente');
});

test('javali novo: mesma largura de grade (12), cores na paleta, presas e focinho presentes', () => {
  const j = SPRITES_FASE[1].monstro;
  for (const linha of j.grade) assert.equal(linha.length, 12);
  const pixels = j.grade.join('');
  for (const c of new Set(pixels.replace(/\./g, ''))) assert.ok(j.paleta[c], `cor ${c}`);
  for (const c of ['T', 'P', 'N', 'O', 'E']) assert.ok(pixels.includes(c), `parte ${c} do javali`);
  assert.ok(retangulos(j).length > 0);
});

test('metas: textos de progresso, percentual e renovação', () => {
  assert.equal(textoProgresso({ progresso: 1400, alvo: 2000, unidade: 'm', concluida: false }), '1,4 km / 2 km');
  assert.equal(textoProgresso({ progresso: 7, alvo: 10, unidade: 'monstros', concluida: false }), '7 / 10 monstros');
  assert.equal(textoProgresso({ progresso: 800, alvo: 1225, unidade: 'ml', concluida: false }), '800 / 1.225 ml');
  assert.equal(percentual({ progresso: 1400, alvo: 2000, unidade: 'm', concluida: false }), 70);
  assert.equal(percentual({ progresso: 3, alvo: 3, unidade: 'dias', concluida: true }), 100);
  assert.equal(textoRenovacao(5 * 3600 + 12 * 60 + 5), 'renova em 5 h 12 min');
  assert.equal(textoRenovacao(2 * 86400 + 4 * 3600), 'renova em 2 d 4 h');
  assert.equal(textoRenovacao(-3), 'renova em 0 s');
});
