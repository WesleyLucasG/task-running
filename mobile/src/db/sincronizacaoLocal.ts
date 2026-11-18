import type { SQLiteDatabase } from 'expo-sqlite';
import type { EstadoSync } from '../domain/sincronizacao';
import { getDb } from '.';

// RN16: registro SincronizacaoLocal — existe só no aparelho e só durante o ciclo de vida da
// atividade (do início até a sincronização confirmada). Não é histórico permanente.
export type RegistroSync = {
  atividadeId: string;
  pontosEnviados: number; // quantos pontos (em ordem de tempo) o servidor já confirmou
  hashEnviado: string | null; // hash confirmado pelo servidor para esses pontos
  estado: EstadoSync;
  tentativas: number;
  proximaTentativaEm: number; // epoch ms (espera progressiva)
  ultimoErro: string | null;
};

type Linha = {
  atividade_id: string;
  pontos_enviados: number;
  hash_enviado: string | null;
  estado: EstadoSync;
  tentativas: number;
  proxima_tentativa_em: number;
  ultimo_erro: string | null;
};

let pronto: Promise<SQLiteDatabase> | null = null;
function db(): Promise<SQLiteDatabase> {
  if (!pronto) {
    pronto = (async () => {
      const d = await getDb();
      await d.execAsync(`
        CREATE TABLE IF NOT EXISTS sincronizacao_local (
          atividade_id TEXT PRIMARY KEY NOT NULL,
          pontos_enviados INTEGER NOT NULL DEFAULT 0,
          hash_enviado TEXT,
          estado TEXT NOT NULL DEFAULT 'PENDENTE',
          tentativas INTEGER NOT NULL DEFAULT 0,
          proxima_tentativa_em INTEGER NOT NULL DEFAULT 0,
          ultimo_erro TEXT,
          atualizado_em INTEGER NOT NULL DEFAULT 0
        );
      `);
      return d;
    })().catch((e) => {
      pronto = null;
      throw e;
    });
  }
  return pronto;
}

const mapear = (l: Linha): RegistroSync => ({
  atividadeId: l.atividade_id,
  pontosEnviados: l.pontos_enviados,
  hashEnviado: l.hash_enviado,
  estado: l.estado,
  tentativas: l.tentativas,
  proximaTentativaEm: l.proxima_tentativa_em,
  ultimoErro: l.ultimo_erro,
});

export async function obterRegistro(atividadeId: string): Promise<RegistroSync> {
  const d = await db();
  await d.runAsync(`INSERT OR IGNORE INTO sincronizacao_local (atividade_id, atualizado_em) VALUES (?, ?)`, [
    atividadeId,
    Date.now(),
  ]);
  const l = await d.getFirstAsync<Linha>(`SELECT * FROM sincronizacao_local WHERE atividade_id = ?`, [atividadeId]);
  return mapear(l!);
}

export async function lerRegistro(atividadeId: string): Promise<RegistroSync | null> {
  const d = await db();
  const l = await d.getFirstAsync<Linha>(`SELECT * FROM sincronizacao_local WHERE atividade_id = ?`, [atividadeId]);
  return l ? mapear(l) : null;
}

export async function atualizarRegistro(
  atividadeId: string,
  mudancas: Partial<Omit<RegistroSync, 'atividadeId'>>,
): Promise<void> {
  const atual = await obterRegistro(atividadeId);
  const r = { ...atual, ...mudancas };
  const d = await db();
  await d.runAsync(
    `UPDATE sincronizacao_local
        SET pontos_enviados = ?, hash_enviado = ?, estado = ?, tentativas = ?,
            proxima_tentativa_em = ?, ultimo_erro = ?, atualizado_em = ?
      WHERE atividade_id = ?`,
    [r.pontosEnviados, r.hashEnviado, r.estado, r.tentativas, r.proximaTentativaEm, r.ultimoErro, Date.now(), atividadeId],
  );
}

// RN16: fim do ciclo de vida (sincronização confirmada) → o registro deixa de existir
export async function encerrarRegistro(atividadeId: string): Promise<void> {
  const d = await db();
  await d.runAsync(`DELETE FROM sincronizacao_local WHERE atividade_id = ?`, [atividadeId]);
}
