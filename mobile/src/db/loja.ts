import * as SQLite from 'expo-sqlite';
import { CATALOGO } from '../domain/loja';
import { getDb } from '.';

let pronto: Promise<SQLite.SQLiteDatabase> | null = null;

// Banco com as tabelas de hidratação, baús, itens e inventário já criadas
export function getDbLoja(): Promise<SQLite.SQLiteDatabase> {
  if (!pronto) {
    pronto = (async () => {
      const db = await getDb();
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS registros_hidratacao (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          usuario_id TEXT NOT NULL,
          quantidade_ml INTEGER NOT NULL,
          data_registro TEXT NOT NULL,
          dia TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_hidr_usuario_dia ON registros_hidratacao(usuario_id, dia);

        CREATE TABLE IF NOT EXISTS configuracoes_hidratacao (
          usuario_id TEXT PRIMARY KEY NOT NULL,
          lembrete_ativo INTEGER NOT NULL DEFAULT 0,
          intervalo_horas INTEGER NOT NULL DEFAULT 2
        );

        CREATE TABLE IF NOT EXISTS itens (
          id INTEGER PRIMARY KEY NOT NULL,
          nome TEXT NOT NULL,
          tipo TEXT NOT NULL,
          raridade TEXT NOT NULL,
          bonus_forca INTEGER NOT NULL DEFAULT 0,
          bonus_vida INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS baus (
          id TEXT PRIMARY KEY NOT NULL,
          usuario_id TEXT NOT NULL,
          tipo TEXT NOT NULL,
          resgatado INTEGER NOT NULL DEFAULT 0,
          criado_em TEXT NOT NULL,
          dia TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS inventario (
          id TEXT PRIMARY KEY NOT NULL,
          usuario_id TEXT NOT NULL,
          item_id INTEGER NOT NULL,
          equipado INTEGER NOT NULL DEFAULT 0,
          data_adquirido TEXT NOT NULL,
          FOREIGN KEY (item_id) REFERENCES itens(id)
        );
      `);

      await db.withTransactionAsync(async () => {
        for (const i of CATALOGO) {
          await db.runAsync(
            `INSERT INTO itens (id, nome, tipo, raridade, bonus_forca, bonus_vida)
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               nome = excluded.nome, tipo = excluded.tipo, raridade = excluded.raridade,
               bonus_forca = excluded.bonus_forca, bonus_vida = excluded.bonus_vida`,
            [i.id, i.nome, i.tipo, i.raridade, i.bonusForca, i.bonusVida],
          );
        }
      });
      return db;
    })().catch((e) => {
      pronto = null; // permite tentar de novo se falhar
      throw e;
    });
  }
  return pronto;
}