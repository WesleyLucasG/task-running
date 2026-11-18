import type { DiaHidratacao, ResultadoConsumo } from '../db/hidratacao';
import { api } from './api';
import { obterEstado } from './jogoRemoto';

// Hidratação no servidor (RF28–RF30, RN10, RN14). XP e baú são calculados no backend;
// o app só informa o que o servidor confirmou (diferença da carteira e dos baús antes/depois).
type StatusApi = { metaDiariaMl: number; consumidoHojeMl: number; porcentagemConcluida: number };

export async function registrar(quantidadeMl: number): Promise<ResultadoConsumo> {
  const antes = await obterEstado();
  const status = await api<StatusApi>('/api/hidratacao/registrar', { metodo: 'POST', corpo: { quantidadeMl } });
  const depois = await obterEstado();
  return {
    xp: Math.max(0, depois.carteira.experienciaXp - antes.carteira.experienciaXp),
    subiuNivel: depois.carteira.nivel > antes.carteira.nivel,
    nivelDepois: depois.carteira.nivel,
    metaAtingida: status.consumidoHojeMl >= status.metaDiariaMl,
    bauConcedido: depois.bausPendentes > antes.bausPendentes,
  };
}

export async function totalDoDia(): Promise<number> {
  return (await api<StatusApi>('/api/hidratacao')).consumidoHojeMl;
}

export async function historico(dias: number): Promise<DiaHidratacao[]> {
  const lista = await api<{ data: string; totalMl: number }[]>(`/api/hidratacao/historico?dias=${dias}`);
  return lista.map((d) => ({ dia: d.data, totalMl: d.totalMl }));
}
