import type { Cabelo, Genero } from '../domain/avatar';
import { aplicarXp, calcularRecompensa } from '../domain/jogo';
import { getDb } from '.';
import type { Metricas } from './atividades';
import { getDbFases, registrarDistanciaNaFase } from './fases';

export type Avatar = {
  nivel: number;
  experiencia: number;
  forcaBase: number;
  agilidade: number;
  vidaAtual: number;
  vidaMaxima: number;
  genero: Genero;
  cabelo: Cabelo;
  corPele: string;
  corRoupa: string;
};

export type LinhaAvatar = {
  nivel: number;
  experiencia: number;
  forca_base: number;
  agilidade: number;
  vida_atual: number;
  vida_maxima: number;
  genero: Genero;
  cabelo: Cabelo;
  cor_pele: string;
  cor_roupa: string;
};

export function mapear(l: LinhaAvatar): Avatar {
  return {
    nivel: l.nivel,
    experiencia: l.experiencia,
    forcaBase: l.forca_base,
    agilidade: l.agilidade,
    vidaAtual: l.vida_atual,
    vidaMaxima: l.vida_maxima,
    genero: l.genero,
    cabelo: l.cabelo,
    corPele: l.cor_pele,
    corRoupa: l.cor_roupa,
  };
}

// UC01: avatar (nível 1) e carteira (saldo zero) nascem junto com a conta.
// Como o cadastro é local, criamos na primeira vez que o jogador é consultado.
export async function garantirJogador(usuarioId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`INSERT OR IGNORE INTO avatares (usuario_id) VALUES (?)`, [usuarioId]);
  await db.runAsync(`INSERT OR IGNORE INTO carteiras (usuario_id) VALUES (?)`, [usuarioId]);
}

export async function obterJogador(usuarioId: string): Promise<{ avatar: Avatar; moedas: number }> {
  await garantirJogador(usuarioId);
  const db = await getDb();
  const a = await db.getFirstAsync<LinhaAvatar>(`SELECT * FROM avatares WHERE usuario_id = ?`, [
    usuarioId,
  ]);
  const c = await db.getFirstAsync<{ saldo_moedas: number }>(
    `SELECT saldo_moedas FROM carteiras WHERE usuario_id = ?`,
    [usuarioId],
  );
  return { avatar: mapear(a!), moedas: c?.saldo_moedas ?? 0 };
}

// RF11
export async function atualizarAparencia(
  usuarioId: string,
  parcial: Partial<Pick<Avatar, 'genero' | 'cabelo' | 'corPele' | 'corRoupa'>>,
): Promise<void> {
  const { avatar } = await obterJogador(usuarioId);
  const novo = { ...avatar, ...parcial };
  const db = await getDb();
  await db.runAsync(
    `UPDATE avatares SET genero = ?, cabelo = ?, cor_pele = ?, cor_roupa = ? WHERE usuario_id = ?`,
    [novo.genero, novo.cabelo, novo.corPele, novo.corRoupa, usuarioId],
  );
}

export type ResultadoRecompensa = {
  xp: number;
  moedas: number;
  multiplicador: number;
  nivelAntes: number;
  nivelDepois: number;
};

// Conclui a atividade e concede XP, moedas e distância na fase em uma única transação (RNF26)
export async function concluirAtividadeComRecompensa(
  atividadeId: string,
  usuarioId: string,
  m: Metricas,
): Promise<ResultadoRecompensa> {
  await garantirJogador(usuarioId);
  await getDbFases(); // garante que a tabela progresso_fase existe
  const db = await getDb();
  let resultado!: ResultadoRecompensa;

  await db.withTransactionAsync(async () => {
    const atividade = await db.getFirstAsync<{ status: string }>(
      `SELECT status FROM atividades WHERE id = ? AND usuario_id = ?`,
      [atividadeId, usuarioId],
    );
    // Impede pagar duas vezes pela mesma atividade
    if (!atividade || atividade.status !== 'EM_ANDAMENTO') {
      throw new Error('Atividade não está em andamento.');
    }

    const linha = await db.getFirstAsync<LinhaAvatar>(`SELECT * FROM avatares WHERE usuario_id = ?`, [
      usuarioId,
    ]);
    const avatar = mapear(linha!);
    const r = calcularRecompensa(m.distanciaMetros, avatar.agilidade);
    const novo = aplicarXp(avatar, r.xp);

    await db.runAsync(
      `UPDATE atividades
          SET status = 'CONCLUIDA', data_fim = ?, duracao_segundos = ?,
              distancia_metros = ?, calorias = ?, pace_medio = ?
        WHERE id = ?`,
      [
        m.dataFim.toISOString(),
        m.duracaoSegundos,
        m.distanciaMetros,
        m.calorias,
        m.paceMedio,
        atividadeId,
      ],
    );
    await db.runAsync(
      `UPDATE avatares
          SET nivel = ?, experiencia = ?, forca_base = ?, agilidade = ?, vida_atual = ?, vida_maxima = ?
        WHERE usuario_id = ?`,
      [
        novo.nivel,
        novo.experiencia,
        novo.forcaBase,
        novo.agilidade,
        novo.vidaAtual,
        novo.vidaMaxima,
        usuarioId,
      ],
    );
    await db.runAsync(`UPDATE carteiras SET saldo_moedas = saldo_moedas + ? WHERE usuario_id = ?`, [
      r.moedas,
      usuarioId,
    ]);
    await db.runAsync(
      `INSERT INTO recompensas_atividade
         (atividade_id, xp, moedas, multiplicador, nivel_antes, nivel_depois)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [atividadeId, r.xp, r.moedas, r.multiplicador, avatar.nivel, novo.nivel],
    );

    // RN13: a distância da atividade entra na fase atual (limitada à meta)
    await registrarDistanciaNaFase(db, usuarioId, m.distanciaMetros);

    resultado = {
      xp: r.xp,
      moedas: r.moedas,
      multiplicador: r.multiplicador,
      nivelAntes: avatar.nivel,
      nivelDepois: novo.nivel,
    };
  });

  return resultado;
}

export async function buscarRecompensa(atividadeId: string): Promise<ResultadoRecompensa | null> {
  const db = await getDb();
  const l = await db.getFirstAsync<{
    xp: number;
    moedas: number;
    multiplicador: number;
    nivel_antes: number;
    nivel_depois: number;
  }>(`SELECT * FROM recompensas_atividade WHERE atividade_id = ?`, [atividadeId]);
  return l
    ? {
        xp: l.xp,
        moedas: l.moedas,
        multiplicador: l.multiplicador,
        nivelAntes: l.nivel_antes,
        nivelDepois: l.nivel_depois,
      }
    : null;
}