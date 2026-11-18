// Falas contextuais do Hermes, disparadas por EVENTOS REAIS do app.
// Regras: cada chave fala no máximo uma vez por sessão e há um intervalo mínimo entre falas.
import type { PoseHermes } from '../components/Hermes';

export type FalaHermes = { id: number; texto: string; pose: PoseHermes };
type Ouvinte = (f: FalaHermes) => void;

const INTERVALO_MINIMO_MS = 5000;
const ouvintes = new Set<Ouvinte>();
const jaFaladas = new Set<string>();
let ultimaFala = 0;
let proximoId = 1;
let pendente: ReturnType<typeof setTimeout> | null = null;

/**
 * chave: identifica o evento (ex.: 'sync-<uuid>', 'gps-perdido-<uuid>'); repetida → ignorada.
 * Falas muito próximas esperam o intervalo mínimo (a mais recente vence).
 */
export function hermesFalar(chave: string, texto: string, pose: PoseHermes = 'falando'): void {
  if (jaFaladas.has(chave)) return;
  jaFaladas.add(chave);
  const emitir = () => {
    ultimaFala = Date.now();
    pendente = null;
    const fala = { id: proximoId++, texto, pose };
    ouvintes.forEach((o) => o(fala));
  };
  const espera = ultimaFala + INTERVALO_MINIMO_MS - Date.now();
  if (pendente) clearTimeout(pendente);
  if (espera <= 0) emitir();
  else pendente = setTimeout(emitir, espera);
}

/** Permite que um evento volte a falar (ex.: sinal de GPS perdido de novo em outro momento). */
export function hermesEsquecer(chave: string): void {
  jaFaladas.delete(chave);
}

/** Troca de conta: as falas da sessão anterior não valem para o próximo usuário. */
export function hermesReiniciar(): void {
  jaFaladas.clear();
  if (pendente) clearTimeout(pendente);
  pendente = null;
}

export function ouvirHermes(o: Ouvinte): () => void {
  ouvintes.add(o);
  return () => {
    ouvintes.delete(o);
  };
}
