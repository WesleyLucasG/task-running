// RF09: o documento não define a fórmula. Adotamos 35 ml por kg de peso corporal.
export function calcularMetaAgua(pesoKg: number): number {
  return Math.round(pesoKg * 35);
}