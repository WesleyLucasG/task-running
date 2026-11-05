export type Coordenada = { latitude: number; longitude: number };
export type Ponto = Coordenada & { altitude: number | null; timestamp: number };

export const VELOCIDADE_MAX_KMH = 30; // RNF12
export const LACUNA_MAX_S = 15; // acima disso, houve perda de sinal (RN03)
export const PRECISAO_MAX_M = 30; // descarta pontos com precisão ruim
export const DIST_MIN_M = 2; // ignora tremedeira do GPS parado

const RAIO_TERRA_M = 6371000;
const rad = (graus: number) => (graus * Math.PI) / 180;

// RN02
export function coordenadaValida(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

// Distância em metros entre dois pontos (fórmula de Haversine)
export function haversine(a: Coordenada, b: Coordenada): number {
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * RAIO_TERRA_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function velocidadeKmh(distanciaM: number, segundos: number): number {
  return segundos > 0 ? (distanciaM / segundos) * 3.6 : Infinity;
}

// Pace em minutos por km. RN08: sem distância, pace = 0.0
export function calcularPace(distanciaMetros: number, duracaoSegundos: number): number {
  if (distanciaMetros <= 0) return 0.0;
  return duracaoSegundos / 60 / (distanciaMetros / 1000);
}

// O documento não define a fórmula. Adotamos uma estimativa simples por kg e km.
export function estimarCalorias(pesoKg: number, distanciaMetros: number, tipo: string): number {
  const fator = tipo === 'CORRIDA' ? 1.0 : 0.5;
  return Math.round(pesoKg * (distanciaMetros / 1000) * fator);
}

export function formatarDistanciaKm(metros: number): string {
  return (metros / 1000).toFixed(2);
}

export function formatarDuracao(segundos: number): string {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatarPace(pace: number): string {
  if (!pace || !Number.isFinite(pace)) return "--'--\"";
  let min = Math.floor(pace);
  let seg = Math.round((pace - min) * 60);
  if (seg === 60) {
    min += 1;
    seg = 0;
  }
  return `${min}'${String(seg).padStart(2, '0')}"`;
}