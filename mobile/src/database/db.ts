// src/database/db.ts
import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('task_running.db');

export const initDatabase = () => {
  // Criação das tabelas
  db.execSync(`
    CREATE TABLE IF NOT EXISTS gps_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      timestamp INTEGER NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS water_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      amount_ml INTEGER NOT NULL
    );
  `);
};