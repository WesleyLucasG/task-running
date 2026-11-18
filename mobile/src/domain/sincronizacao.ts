// Regras puras da sincronização (RN04, RN05, RN16). Sem imports de runtime: testável no Node.
import type { Ponto } from './geo';

// Estados do registro SincronizacaoLocal (só no aparelho)
export type EstadoSync = 'PENDENTE' | 'SINCRONIZANDO' | 'SINCRONIZADO' | 'FALHA_TEMPORARIA' | 'AGUARDANDO_CONEXAO';

export const ROTULO_ESTADO_SYNC: Record<EstadoSync, string> = {
  PENDENTE: 'Pendente',
  SINCRONIZANDO: 'Sincronizando',
  SINCRONIZADO: 'Sincronizado',
  FALHA_TEMPORARIA: 'Falha temporária',
  AGUARDANDO_CONEXAO: 'Aguardando conexão',
};

export const LOTE_MAXIMO_PONTOS = 500;

const dois = (n: number) => String(n).padStart(2, '0');

/** Data/hora LOCAL no formato do LocalDateTime do backend: yyyy-MM-ddTHH:mm:ss (sem fuso). */
export function dataHoraLocal(ms: number): string {
  const d = new Date(ms);
  return (
    `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}` +
    `T${dois(d.getHours())}:${dois(d.getMinutes())}:${dois(d.getSeconds())}`
  );
}

/**
 * Texto canônico dos pontos — o MESMO algoritmo de HashPontosGps.java:
 * "lat,lon,yyyy-MM-ddTHH:mm:ss" com 6 casas decimais, em ordem de tempo, separados por ";".
 * O SHA-256 desse texto é comparado com o hash devolvido pelo servidor.
 */
export function textoCanonico(pontosOrdenados: Pick<Ponto, 'latitude' | 'longitude' | 'timestamp'>[]): string {
  return pontosOrdenados
    .map((p) => `${p.latitude.toFixed(6)},${p.longitude.toFixed(6)},${dataHoraLocal(p.timestamp)}`)
    .join(';');
}

/**
 * O backend guarda o horário com precisão de SEGUNDO e ignora pontos repetidos pelo horário.
 * Para o aparelho e o servidor contarem igual, fica um ponto por segundo (o primeiro).
 */
export function umPontoPorSegundo<T extends { timestamp: number }>(pontosOrdenados: T[]): T[] {
  const vistos = new Set<number>();
  return pontosOrdenados.filter((p) => {
    const s = Math.floor(p.timestamp / 1000);
    if (vistos.has(s)) return false;
    vistos.add(s);
    return true;
  });
}

/** Espera progressiva entre tentativas: 5 s, 10 s, 20 s ... até 10 minutos. */
export function atrasoTentativaMs(tentativas: number): number {
  return Math.min(5000 * 2 ** Math.max(0, tentativas), 10 * 60 * 1000);
}

/** Corpo dos pontos no formato do PontoGpsRequestDTO. */
export function pontoParaApi(p: Ponto) {
  return {
    latitude: p.latitude,
    longitude: p.longitude,
    altitude: p.altitude,
    timestamp: dataHoraLocal(p.timestamp),
  };
}
