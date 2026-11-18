import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import { diaLocal } from '../domain/datas';
import { calcularDano, FaseCatalogo, FASES, fasePorNumero } from '../domain/fases';
import { ferramentasReais } from './aleatorio';
import { getDbLoja } from './loja';
import { concederRecompensaChefe } from './regrasLoot';
import type { ItemCatalogo } from '../domain/loja';

let pronto: Promise<SQLiteDatabase> | null = null;

// Banco com a tabela de progresso das fases criada
export function getDbFases(): Promise<SQLiteDatabase> {
  if (!pronto) {
    pronto = (async () => {
      const db = await getDbLoja();
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS progresso_fase (
          usuario_id TEXT NOT NULL,
          fase_numero INTEGER NOT NULL,
          distancia_acumulada_metros REAL NOT NULL DEFAULT 0,
          chefe_liberado INTEGER NOT NULL DEFAULT 0,
          vida_atual_chefe INTEGER NOT NULL DEFAULT 0,
          concluida INTEGER NOT NULL DEFAULT 0,
          bau_meta_concedido INTEGER NOT NULL DEFAULT 0,
          ultimo_ataque_em TEXT,
          PRIMARY KEY (usuario_id, fase_numero)
        );

        -- Pontos de habilidade distribuídos (2 por km concluído, decisão D15)
        CREATE TABLE IF NOT EXISTS habilidades (
          usuario_id TEXT PRIMARY KEY NOT NULL,
          forca INTEGER NOT NULL DEFAULT 0,
          vitalidade INTEGER NOT NULL DEFAULT 0,
          velocidade INTEGER NOT NULL DEFAULT 0
        );
      `);
      return db;
    })().catch((e) => {
      pronto = null;
      throw e;
    });
  }
  return pronto;
}

type LinhaProgresso = {
  usuario_id: string;
  fase_numero: number;
  distancia_acumulada_metros: number;
  chefe_liberado: number;
  vida_atual_chefe: number;
  concluida: number;
  bau_meta_concedido: number;
  ultimo_ataque_em: string | null;
};

export type Situacao = 'CONCLUIDA' | 'ATUAL' | 'BLOQUEADA';

export type EstadoMapa = {
  fases: { fase: FaseCatalogo; situacao: Situacao }[];
  atual: {
    fase: FaseCatalogo;
    acumuladaMetros: number;
    chefeLiberado: boolean;
    vidaAtualChefe: number;
    podeAtacar: boolean;
    motivoBloqueio: string | null;
    danoEstimado: number;
  } | null;
  jogoConcluido: boolean;
};

export type ResultadoAtaque = {
  dano: number;
  vidaRestante: number;
  vidaMaxima: number;
  derrotado: boolean;
  proximaFase: string | null;
  itemLendario: ItemCatalogo | null; // bônus de 10% do chefe (D19)
};

async function garantirAvatar(db: SQLiteDatabase, usuarioId: string) {
  await db.runAsync(`INSERT OR IGNORE INTO avatares (usuario_id) VALUES (?)`, [usuarioId]);
}

// A primeira fase nasce quando o jogador é consultado pela primeira vez
async function garantirProgresso(db: SQLiteDatabase, usuarioId: string) {
  const n = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM progresso_fase WHERE usuario_id = ?`,
    [usuarioId],
  );
  if ((n?.n ?? 0) === 0) {
    await db.runAsync(`INSERT INTO progresso_fase (usuario_id, fase_numero) VALUES (?, ?)`, [
      usuarioId,
      FASES[0].numero,
    ]);
  }
}

function faseAtualDe(db: SQLiteDatabase, usuarioId: string) {
  return db.getFirstAsync<LinhaProgresso>(
    `SELECT * FROM progresso_fase
      WHERE usuario_id = ? AND concluida = 0 ORDER BY fase_numero ASC LIMIT 1`,
    [usuarioId],
  );
}

async function concederBau(db: SQLiteDatabase, usuarioId: string, tipo: 'PRATA') {
  const agora = new Date();
  await db.runAsync(
    `INSERT INTO baus (id, usuario_id, tipo, resgatado, criado_em, dia) VALUES (?, ?, ?, 0, ?, ?)`,
    [Crypto.randomUUID(), usuarioId, tipo, agora.toISOString(), diaLocal(agora)],
  );
}

// Chamada de dentro da transação que conclui a atividade (ver jogo.ts)
export async function registrarDistanciaNaFase(
  db: SQLiteDatabase,
  usuarioId: string,
  distanciaMetros: number,
): Promise<void> {
  await garantirProgresso(db, usuarioId);
  const atual = await faseAtualDe(db, usuarioId);
  if (!atual || distanciaMetros <= 0) return;
  const fase = fasePorNumero(atual.fase_numero);
  if (!fase) return;

  // RN13: soma integralmente, mas o valor considerado é limitado à meta
  const acumulada = Math.min(
    atual.distancia_acumulada_metros + distanciaMetros,
    fase.metaDistanciaMetros,
  );
  const liberar = atual.chefe_liberado === 0 && acumulada >= fase.metaDistanciaMetros;

  if (liberar) {
    // RN15: a vida do chefe começa no máximo no instante da liberação
    await db.runAsync(
      `UPDATE progresso_fase
          SET distancia_acumulada_metros = ?, chefe_liberado = 1,
              vida_atual_chefe = ?, bau_meta_concedido = 1
        WHERE usuario_id = ? AND fase_numero = ?`,
      [acumulada, fase.chefe.vidaMaxima, usuarioId, fase.numero],
    );
    if (atual.bau_meta_concedido === 0) await concederBau(db, usuarioId, 'PRATA'); // RF22
  } else {
    await db.runAsync(
      `UPDATE progresso_fase SET distancia_acumulada_metros = ?
        WHERE usuario_id = ? AND fase_numero = ?`,
      [acumulada, usuarioId, fase.numero],
    );
  }
}

type ContextoCombate = {
  maiorKm: number;
  ultimaAtividade: string | null;
  pendenteDeSincronizar: boolean;
  forcaBase: number;
  bonusForca: number;
};

async function lerContextoCombate(db: SQLiteDatabase, usuarioId: string): Promise<ContextoCombate> {
  const corte = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  // RN11(b)/RN12: só contam atividades CONCLUÍDAS E SINCRONIZADAS nas últimas 24 h
  const a = await db.getFirstAsync<{ maior: number | null; ultima: string | null }>(
    `SELECT MAX(distancia_metros) AS maior, MAX(data_fim) AS ultima
       FROM atividades
      WHERE usuario_id = ? AND status = 'CONCLUIDA' AND sincronizado = 1 AND data_fim >= ?`,
    [usuarioId, corte],
  );
  const naoSinc = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM atividades
      WHERE usuario_id = ? AND status = 'CONCLUIDA' AND sincronizado = 0 AND data_fim >= ?`,
    [usuarioId, corte],
  );
  const f = await db.getFirstAsync<{ forca_base: number }>(
    `SELECT forca_base FROM avatares WHERE usuario_id = ?`,
    [usuarioId],
  );
  const h = await db.getFirstAsync<{ forca: number }>(
    `SELECT forca FROM habilidades WHERE usuario_id = ?`,
    [usuarioId],
  );
  const b = await db.getFirstAsync<{ forca: number }>(
    `SELECT COALESCE(SUM(i.bonus_forca), 0) AS forca
       FROM inventario inv JOIN itens i ON i.id = inv.item_id
      WHERE inv.usuario_id = ? AND inv.equipado = 1`,
    [usuarioId],
  );
  return {
    maiorKm: (a?.maior ?? 0) / 1000, // RN12: maior distância das últimas 24h
    ultimaAtividade: a?.ultima ?? null,
    pendenteDeSincronizar: (naoSinc?.n ?? 0) > 0,
    // Pontos em Força somam à força base do herói (D15)
    forcaBase: (f?.forca_base ?? 10) + (h?.forca ?? 0),
    bonusForca: b?.forca ?? 0,
  };
}

function motivoBloqueio(prog: LinhaProgresso, ctx: ContextoCombate): string | null {
  if (prog.chefe_liberado === 0) {
    return 'Complete a meta de distância da fase para liberar o chefe.';
  }
  // RN11 (b)
  if (ctx.ultimaAtividade === null) {
    return ctx.pendenteDeSincronizar
      ? 'Meta atingida! Falta sincronizar sua corrida recente: conecte-se à internet para liberar o confronto.'
      : 'Meta atingida! Faça uma corrida nas últimas 24 horas para enfrentar o chefe.';
  }
  // UC11, passo 6: novo ataque só depois de mais atividade física
  if (prog.ultimo_ataque_em && ctx.ultimaAtividade <= prog.ultimo_ataque_em) {
    return 'Faça uma nova atividade para atacar novamente.';
  }
  return null;
}

export async function obterEstadoMapa(usuarioId: string): Promise<EstadoMapa> {
  const db = await getDbFases();
  await garantirAvatar(db, usuarioId);
  await garantirProgresso(db, usuarioId);

  const linhas = await db.getAllAsync<LinhaProgresso>(
    `SELECT * FROM progresso_fase WHERE usuario_id = ? ORDER BY fase_numero ASC`,
    [usuarioId],
  );
  const atualLinha = linhas.find((l) => l.concluida === 0) ?? null;

  const fases = FASES.map((fase) => {
    const l = linhas.find((x) => x.fase_numero === fase.numero);
    let situacao: Situacao = 'BLOQUEADA';
    if (l?.concluida === 1) situacao = 'CONCLUIDA';
    else if (atualLinha?.fase_numero === fase.numero) situacao = 'ATUAL';
    return { fase, situacao };
  });

  if (!atualLinha) return { fases, atual: null, jogoConcluido: true };

  const fase = fasePorNumero(atualLinha.fase_numero)!;
  const ctx = await lerContextoCombate(db, usuarioId);
  const motivo = motivoBloqueio(atualLinha, ctx);

  return {
    fases,
    jogoConcluido: false,
    atual: {
      fase,
      acumuladaMetros: atualLinha.distancia_acumulada_metros,
      chefeLiberado: atualLinha.chefe_liberado === 1,
      vidaAtualChefe: atualLinha.vida_atual_chefe,
      podeAtacar: motivo === null,
      motivoBloqueio: motivo,
      danoEstimado: calcularDano(ctx.forcaBase, ctx.bonusForca, ctx.maiorKm),
    },
  };
}

// UC11 (botão do mapa): um golpe com o dano máximo permitido pela RN12
export function atacarChefe(usuarioId: string): Promise<ResultadoAtaque> {
  return registrarConfronto(usuarioId, Number.POSITIVE_INFINITY);
}

// Confronto na esteira idle: o herói causou `danoCausado` ao chefe. O valor é limitado
// pela RN12, a vida restante é persistida (RN15) e o confronto consome a atividade (UC11).
export async function registrarConfronto(usuarioId: string, danoCausado: number): Promise<ResultadoAtaque> {
  const db = await getDbFases();
  let resultado!: ResultadoAtaque;

  await db.withTransactionAsync(async () => {
    await garantirAvatar(db, usuarioId);
    await garantirProgresso(db, usuarioId);
    const prog = await faseAtualDe(db, usuarioId);
    if (!prog) throw new Error('Você já concluiu todas as fases.');
    const fase = fasePorNumero(prog.fase_numero)!;

    const ctx = await lerContextoCombate(db, usuarioId);
    const motivo = motivoBloqueio(prog, ctx);
    if (motivo) throw new Error(motivo);

    const limite = calcularDano(ctx.forcaBase, ctx.bonusForca, ctx.maiorKm); // RN12
    const dano = Math.max(0, Math.min(Math.round(danoCausado), limite, prog.vida_atual_chefe));
    const vida = Math.max(0, prog.vida_atual_chefe - dano); // RN15
    const derrotado = vida <= 0;

    await db.runAsync(
      `UPDATE progresso_fase SET vida_atual_chefe = ?, ultimo_ataque_em = ?, concluida = ?
        WHERE usuario_id = ? AND fase_numero = ?`,
      [vida, new Date().toISOString(), derrotado ? 1 : 0, usuarioId, fase.numero],
    );

    let proximaFase: string | null = null;
    let itemLendario: ItemCatalogo | null = null;
    if (derrotado) {
      // RF22 (baú Ouro) + 10% de item lendário, uma única vez por chefe (D19)
      const premio = await concederRecompensaChefe(db, usuarioId, fase.numero, ferramentasReais);
      itemLendario = premio.itemLendario;
      const proxima = fasePorNumero(fase.numero + 1);
      if (proxima) {
        // RN13: cada nova fase começa com distância acumulada zero
        await db.runAsync(
          `INSERT OR IGNORE INTO progresso_fase (usuario_id, fase_numero) VALUES (?, ?)`,
          [usuarioId, proxima.numero],
        );
        proximaFase = proxima.nome;
      }
    }

    resultado = {
      dano,
      vidaRestante: vida,
      vidaMaxima: fase.chefe.vidaMaxima,
      derrotado,
      proximaFase,
      itemLendario,
    };
  });

  return resultado;
}