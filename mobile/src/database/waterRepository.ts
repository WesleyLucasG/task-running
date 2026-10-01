// src/database/waterRepository.ts
import { db } from './db';

export const addWaterLog = (amountMl: number) => {
  const today = new Date().toISOString().split('T')[0];
  db.runSync('INSERT INTO water_logs (date, amount_ml) VALUES (?, ?)', [today, amountMl]);
};

export const getTodayWaterTotal = (): number => {
  const today = new Date().toISOString().split('T')[0];
  const result: any = db.getFirstSync(
    'SELECT SUM(amount_ml) as total FROM water_logs WHERE date = ?',
    [today]
  );
  return result?.total || 0;
};