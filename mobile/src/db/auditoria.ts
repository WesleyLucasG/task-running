import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb } from '.';

let pronto: Promise<SQLiteDatabase> | null = null;

function getDbAuditoria(): Promise<SQLiteDatabase> {
  if (!pronto) {
    pronto = (async () => {
      const db = await getDb();
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS logs_auditoria (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          usuario_id TEXT,
          evento TEXT NOT NULL,
          email TEXT,
          resultado TEXT NOT NULL,
          timestamp TEXT NOT NULL
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

export async function registrarEvento(
  evento: string,
  resultado: string,
  opcoes: { email?: string; usuarioId?: string } = {},
): Promise<void> {
  try {
    const db = await getDbAuditoria();
    await db.runAsync(
      `INSERT INTO logs_auditoria (usuario_id, evento, email, resultado, timestamp)
       VALUES (?, ?, ?, ?, ?)`,
      [opcoes.usuarioId ?? null, evento, opcoes.email ?? null, resultado, new Date().toISOString()],
    );
  } catch (e) {
    console.warn('Falha ao registrar auditoria', e);
  }
}