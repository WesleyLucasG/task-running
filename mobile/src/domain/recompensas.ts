// Recompensas da esteira idle (decisão D19 do PROGRESSO.md).
// TODOS os números de balanceamento ficam aqui, para ajuste em um único lugar.
import type { ItemCatalogo, Raridade } from './loja';

export type RaridadeBauDrop = 'COMUM' | 'INCOMUM' | 'RARO' | 'LENDARIO';

export const CONFIG_RECOMPENSAS = {
  /** Moedas de um monstro comum na fase 1. */
  moedasBasePorMonstro: 1,
  /** Acréscimo por fase sobre a base (0.5 = +50% a cada fase). */
  multiplicadorPorFase: 0.5,
  /** Chance de um monstro comum deixar um baú. */
  chanceBau: 0.2,
  /** Distribuição da raridade ENTRE os baús encontrados (soma = 1). Lendário nunca vem de monstro. */
  raridadeBau: [
    ['COMUM', 0.7],
    ['INCOMUM', 0.25],
    ['RARO', 0.05],
    ['LENDARIO', 0],
  ] as [RaridadeBauDrop, number][],
  /** Chance extra de item lendário ao derrotar DEFINITIVAMENTE um chefe. */
  chanceLendarioChefe: 0.1,
  /** Moedas recebidas ao descartar um item (Épico não foi definido: 8, entre Raro e Lendário). */
  valorDescarte: { COMUM: 2, INCOMUM: 4, RARO: 6, EPICO: 8, LENDARIO: 10 } as Record<Raridade, number>,
};

export function valorDescarte(raridade: Raridade, cfg = CONFIG_RECOMPENSAS): number {
  return cfg.valorDescarte[raridade] ?? 0;
}

export type Aleatorio = () => number; // [0, 1)

// Fase 1 = 1 moeda, fase 2 = 2, fase 3 = 2, fase 4 = 3, fase 5 = 3.
// Uma volta (7 monstros) na fase 1 rende 7 moedas: um item comum (150) custa ~21 voltas,
// mantendo a corrida real (50 moedas/km, RF18) como fonte principal de ouro.
export function moedasPorMonstro(fase: number, cfg = CONFIG_RECOMPENSAS): number {
  const f = Math.max(1, Math.floor(fase));
  return Math.max(1, Math.round(cfg.moedasBasePorMonstro * (1 + cfg.multiplicadorPorFase * (f - 1))));
}

/** Rola o drop de um monstro comum: null = sem baú. Nunca retorna LENDARIO enquanto o peso for 0. */
export function sortearBauMonstro(aleatorio: Aleatorio, cfg = CONFIG_RECOMPENSAS): RaridadeBauDrop | null {
  if (aleatorio() >= cfg.chanceBau) return null;
  const pesos = cfg.raridadeBau.filter(([r, p]) => p > 0 && r !== 'LENDARIO');
  const total = pesos.reduce((s, [, p]) => s + p, 0);
  let r = aleatorio() * total;
  for (const [raridade, peso] of pesos) {
    if (r < peso) return raridade;
    r -= peso;
  }
  return pesos[pesos.length - 1][0];
}

/** Rola o bônus lendário do chefe (independente do baú de vitória). */
export function sortearLendarioChefe(aleatorio: Aleatorio, cfg = CONFIG_RECOMPENSAS): boolean {
  return aleatorio() < cfg.chanceLendarioChefe;
}

/** Escolhe um item do catálogo com a raridade pedida (uniforme entre os candidatos). */
export function escolherItem(
  catalogo: ItemCatalogo[],
  raridade: Raridade,
  aleatorio: Aleatorio,
): ItemCatalogo {
  const candidatos = catalogo.filter((i) => i.raridade === raridade);
  if (!candidatos.length) throw new Error(`Nenhum item com raridade ${raridade}.`);
  return candidatos[Math.min(candidatos.length - 1, Math.floor(aleatorio() * candidatos.length))];
}
