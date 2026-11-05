// mobile/src/services/waterService.ts
import db from '../database/db';

// RN09: Meta diária em ml = Peso (kg) * 35ml
export const calculateWaterGoal = (weightKg: number): number => {
  return Math.round(weightKg * 35);
};

// Registrar consumo de água no dia atual
export const logWaterIntake = (amountMl: number) => {
  const today = new Date().toISOString().split('T')[0];
  db.runSync('INSERT INTO water_logs (date, amount_ml) VALUES (?, ?)', [today, amountMl]);
};

// Buscar total consumido hoje
export const getTodayWaterIntake = (): number => {
  const today = new Date().toISOString().split('T')[0];
  const result: any = db.getFirstSync(
    'SELECT SUM(amount_ml) as total FROM water_logs WHERE date = ?',
    [today]
  );
  return result?.total || 0;
};