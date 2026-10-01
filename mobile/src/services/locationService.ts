// mobile/src/services/locationService.ts
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import db from '../database/db';

// Salvar coordenada offline no SQLite
export const enqueueGPSLocation = (latitude: number, longitude: number, timestamp: number) => {
  db.runSync(
    'INSERT INTO gps_queue (latitude, longitude, timestamp, synced) VALUES (?, ?, ?, 0)',
    [latitude, longitude, timestamp]
  );
};

// Sincronizar coordenadas pendentes com o backend quando houver conexão
export const syncPendingGPSData = async () => {
  const net = await NetInfo.fetch();
  if (!net.isConnected) return;

  const pending: any[] = db.getAllSync('SELECT * FROM gps_queue WHERE synced = 0');
  if (pending.length === 0) return;

  try {
    // Exemplo de envio em lote para o seu Backend Spring Boot
    /*
    await fetch('https://seu-backend.com/api/corrida/sincronizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordinates: pending }),
    });
    */

    // Marcar como sincronizados ou remover do banco local
    const ids = pending.map((item) => item.id);
    const placeholders = ids.map(() => '?').join(',');
    db.runSync(`DELETE FROM gps_queue WHERE id IN (${placeholders})`, ids);
  } catch (error) {
    console.error('Erro na sincronização de GPS:', error);
  }
};

// Capturar posição em tempo real
export const captureCurrentLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Permissão de GPS negada');

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  const { latitude, longitude } = location.coords;
  const timestamp = location.timestamp;

  const net = await NetInfo.fetch();
  if (net.isConnected) {
    // Envia direto e limpa a fila se houver dados pendentes
    await syncPendingGPSData();
  } else {
    // Salva no banco local para envio posterior
    enqueueGPSLocation(latitude, longitude, timestamp);
  }

  return { latitude, longitude, timestamp };
};