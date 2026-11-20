export const XP_POR_KM = 100; // RN10
export const MOEDAS_POR_KM = 50; // RN10
export const XP_POR_100ML_AGUA = 10; // RN10 (usado na etapa de hidratação)
export const BONUS_MAXIMO = 1.5; // RN10: bônus limitado a 50%

export type EstadoAvatar = {
  nivel: number;
  experiencia: number;
  forcaBase: number;
  agilidade: number;
  vidaAtual: number;
  vidaMaxima: number;
};

// RF19 — curva aprovada (igual ao servidor, RegrasAvatar): 100, 150 … 500 XP por nível, máximo 10
export const NIVEL_MAXIMO = 10;
export function xpParaProximoNivel(nivel: number): number {
  return nivel >= NIVEL_MAXIMO ? 0 : 50 * Math.max(1, nivel) + 50;
}

/** Progresso da barra de XP (0–1). No modo API usa o valor do servidor; no nível máximo a barra fica cheia. */
export function progressoXp(a: { nivel: number; experiencia: number; xpParaProximoNivel?: number }): {
  atual: number;
  necessario: number;
  fracao: number;
  maximo: boolean;
} {
  const necessario = a.xpParaProximoNivel ?? xpParaProximoNivel(a.nivel);
  if (a.nivel >= NIVEL_MAXIMO || necessario <= 0) return { atual: 0, necessario: 0, fracao: 1, maximo: true };
  return { atual: a.experiencia, necessario, fracao: Math.max(0, Math.min(1, a.experiencia / necessario)), maximo: false };
}

// RN10: utilidade funcional do atributo agilidade
export function multiplicadorAgilidade(agilidade: number): number {
  return Math.min(1 + agilidade * 0.005, BONUS_MAXIMO);
}

export function calcularRecompensa(distanciaMetros: number, agilidade: number) {
  const km = Math.max(0, distanciaMetros) / 1000;
  const multiplicador = multiplicadorAgilidade(agilidade);
  return {
    xp: Math.floor(km * XP_POR_KM * multiplicador),
    moedas: Math.floor(km * MOEDAS_POR_KM * multiplicador),
    multiplicador,
  };
}

// RF19: soma o XP e sobe quantos níveis forem necessários (o XP que sobra é mantido)
export function aplicarXp<T extends EstadoAvatar>(avatar: T, xp: number): T {
  let { nivel, experiencia, forcaBase, agilidade, vidaMaxima, vidaAtual } = avatar;
  experiencia += xp;
  while (nivel < NIVEL_MAXIMO && experiencia >= xpParaProximoNivel(nivel)) {
    experiencia -= xpParaProximoNivel(nivel);
    nivel += 1;
    forcaBase += 2;
    agilidade += 2;
    vidaMaxima += 10;
    vidaAtual = vidaMaxima;
  }
  return { ...avatar, nivel, experiencia, forcaBase, agilidade, vidaMaxima, vidaAtual };
}