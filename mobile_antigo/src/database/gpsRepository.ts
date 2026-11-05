// src/database/gpsRepository.ts
import { db } from './db';

export const saveLocationOffline = (latitude: number, longitude: number, timestamp: number) => {
  db.runSync(
    'INSERT INTO gps_queue (latitude, longitude, timestamp, synced) VALUES (?, ?, ?, 0)',
    [latitude, longitude, timestamp]
  );
};

export const getUnsyncedLocations = () => {
  return db.getAllSync('SELECT * FROM gps_queue WHERE synced = 0');
};

export const removeSyncedLocations = (ids: number[]) => {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => '?').join(',');
  db.runSync(`DELETE FROM gps_queue WHERE id IN (${placeholders})`, ids);
};