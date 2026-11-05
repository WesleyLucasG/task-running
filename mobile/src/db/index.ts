import * as SQLite from 'expo-sqlite';

let conexao: Promise<SQLite.SQLiteDatabase> | null = null;

// Abre o banco uma única vez e cria as tabelas se ainda não existirem
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!conexao) {
    conexao = (async () => {
      const db = await SQLite.openDatabaseAsync('taskrunning.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS atividades (
          id TEXT PRIMARY KEY NOT NULL,
          usuario_id TEXT NOT NULL,
          tipo TEXT NOT NULL,
          status TEXT NOT NULL,
          data_inicio TEXT NOT NULL,
          data_fim TEXT,
          duracao_segundos INTEGER NOT NULL DEFAULT 0,
          distancia_metros REAL NOT NULL DEFAULT 0,
          calorias INTEGER NOT NULL DEFAULT 0,
          pace_medio REAL NOT NULL DEFAULT 0,
          sincronizado INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS pontos_gps (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          atividade_id TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          altitude REAL,
          timestamp INTEGER NOT NULL,
          FOREIGN KEY (atividade_id) REFERENCES atividades(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_pontos_atividade ON pontos_gps(atividade_id);

        CREATE TABLE IF NOT EXISTS avatares (
          usuario_id TEXT PRIMARY KEY NOT NULL,
          nivel INTEGER NOT NULL DEFAULT 1,
          experiencia INTEGER NOT NULL DEFAULT 0,
          forca_base INTEGER NOT NULL DEFAULT 10,
          agilidade INTEGER NOT NULL DEFAULT 0,
          vida_atual INTEGER NOT NULL DEFAULT 100,
          vida_maxima INTEGER NOT NULL DEFAULT 100,
          genero TEXT NOT NULL DEFAULT 'MASCULINO',
          cabelo TEXT NOT NULL DEFAULT 'CURTO',
          cor_pele TEXT NOT NULL DEFAULT '#F1C27D',
          cor_roupa TEXT NOT NULL DEFAULT '#F97316'
        );

        CREATE TABLE IF NOT EXISTS carteiras (
          usuario_id TEXT PRIMARY KEY NOT NULL,
          saldo_moedas INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS recompensas_atividade (
          atividade_id TEXT PRIMARY KEY NOT NULL,
          xp INTEGER NOT NULL,
          moedas INTEGER NOT NULL,
          multiplicador REAL NOT NULL,
          nivel_antes INTEGER NOT NULL,
          nivel_depois INTEGER NOT NULL,
          FOREIGN KEY (atividade_id) REFERENCES atividades(id) ON DELETE CASCADE
        );
      `);
      return db;
    })();
  }
  return conexao;
}