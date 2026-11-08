import * as Crypto from 'expo-crypto';
import { diaLocal } from '../domain/datas';
import { aplicarXp, XP_POR_100ML_AGUA } from '../domain/jogo';
import { garantirJogador, LinhaAvatar, mapear } from './jogo';
import { getDbLoja } from './loja';

export type ResultadoConsumo = {
  xp: number;
  subiuNivel: boolean;
  nivelDepois: number;
  metaAtingida: boolean;
  bauConcedido: boolean;
};

export type DiaHidratacao = { dia: string; totalMl: number };
export type ConfigLembrete = { ativo: boolean; intervaloHoras: number };

export async function registrarConsumo(
  usuarioId: string,
  quantidadeMl: number,
  metaMl: number,
): Promise<ResultadoConsumo> {
  // UC04, passo 4: quantidade precisa ser maior que zero
  if (!Number.isFinite(quantidadeMl) || quantidadeMl <= 0) {
    throw new Error('Informe uma quantidade maior que zero.');
  }
  await garantirJogador(usuarioId);
  const db = await getDbLoja();
  const agora = new Date();
  const dia = diaLocal(agora);
  let resultado!: ResultadoConsumo;

  await db.withTransactionAsync(async () => {
    const antes = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(quantidade_ml), 0) AS total
         FROM registros_hidratacao WHERE usuario_id = ? AND dia = ?`,
      [usuarioId, dia],
    );
    const totalDepois = (antes?.total ?? 0) + quantidadeMl;

    await db.runAsync(
      `INSERT INTO registros_hidratacao (usuario_id, quantidade_ml, data_registro, dia)
       VALUES (?, ?, ?, ?)`,
      [usuarioId, quantidadeMl, agora.toISOString(), dia],
    );

    // RN10: 100 ml = 10 XP (proporcional, arredondado para baixo)
    const xp = Math.floor((quantidadeMl * XP_POR_100ML_AGUA) / 100);
    const linha = await db.getFirstAsync<LinhaAvatar>(`SELECT * FROM avatares WHERE usuario_id = ?`, [
      usuarioId,
    ]);
    const avatar = mapear(linha!);
    const novo = aplicarXp(avatar, xp);
    await db.runAsync(
      `UPDATE avatares
          SET nivel = ?, experiencia = ?, forca_base = ?, agilidade = ?, vida_atual = ?, vida_maxima = ?
        WHERE usuario_id = ?`,
      [novo.nivel, novo.experiencia, novo.forcaBase, novo.agilidade, novo.vidaAtual, novo.vidaMaxima, usuarioId],
    );

    // RN14: meta batida concede 1 Baú Bronze, no máximo 1 por dia
    const metaAtingida = totalDepois >= metaMl;
    let bauConcedido = false;
    if (metaAtingida) {
      const ja = await db.getFirstAsync<{ n: number }>(
        `SELECT COUNT(*) AS n FROM baus WHERE usuario_id = ? AND tipo = 'BRONZE' AND dia = ?`,
        [usuarioId, dia],
      );
      if ((ja?.n ?? 0) === 0) {
        await db.runAsync(
          `INSERT INTO baus (id, usuario_id, tipo, resgatado, criado_em, dia)
           VALUES (?, ?, 'BRONZE', 0, ?, ?)`,
          [Crypto.randomUUID(), usuarioId, agora.toISOString(), dia],
        );
        bauConcedido = true;
      }
    }

    resultado = {
      xp,
      subiuNivel: novo.nivel > avatar.nivel,
      nivelDepois: novo.nivel,
      metaAtingida,
      bauConcedido,
    };
  });

  return resultado;
}

export async function totalDoDia(usuarioId: string): Promise<number> {
  const db = await getDbLoja();
  const l = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(quantidade_ml), 0) AS total
       FROM registros_hidratacao WHERE usuario_id = ? AND dia = ?`,
    [usuarioId, diaLocal()],
  );
  return l?.total ?? 0;
}

// RF30: histórico agrupado por data
export async function historicoPorDia(usuarioId: string, limite = 14): Promise<DiaHidratacao[]> {
  const db = await getDbLoja();
  const linhas = await db.getAllAsync<{ dia: string; total: number }>(
    `SELECT dia, SUM(quantidade_ml) AS total
       FROM registros_hidratacao WHERE usuario_id = ?
      GROUP BY dia ORDER BY dia DESC LIMIT ?`,
    [usuarioId, limite],
  );
  return linhas.map((l) => ({ dia: l.dia, totalMl: l.total }));
}

export async function obterConfig(usuarioId: string): Promise<ConfigLembrete> {
  const db = await getDbLoja();
  const l = await db.getFirstAsync<{ lembrete_ativo: number; intervalo_horas: number }>(
    `SELECT lembrete_ativo, intervalo_horas FROM configuracoes_hidratacao WHERE usuario_id = ?`,
    [usuarioId],
  );
  return l ? { ativo: l.lembrete_ativo === 1, intervaloHoras: l.intervalo_horas } : { ativo: false, intervaloHoras: 2 };
}

export async function salvarConfig(usuarioId: string, c: ConfigLembrete): Promise<void> {
  const db = await getDbLoja();
  await db.runAsync(
    `INSERT INTO configuracoes_hidratacao (usuario_id, lembrete_ativo, intervalo_horas)
     VALUES (?, ?, ?)
     ON CONFLICT(usuario_id) DO UPDATE SET
       lembrete_ativo = excluded.lembrete_ativo, intervalo_horas = excluded.intervalo_horas`,
    [usuarioId, c.ativo ? 1 : 0, c.intervaloHoras],
  );
}