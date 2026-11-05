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

// Decisão de projeto: o documento não define a curva de níveis
export function xpParaProximoNivel(nivel: number): number {
  return 200 * nivel;
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
  while (experiencia >= xpParaProximoNivel(nivel)) {
    experiencia -= xpParaProximoNivel(nivel);
    nivel += 1;
    forcaBase += 2;
    agilidade += 2;
    vidaMaxima += 10;
    vidaAtual = vidaMaxima;
  }
  return { ...avatar, nivel, experiencia, forcaBase, agilidade, vidaMaxima, vidaAtual };
}