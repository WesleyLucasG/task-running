import type { FaseCatalogo } from '../domain/fases';
import { BaseHeroi, calcularStatsHeroi, Contexto } from '../domain/idle';
import { obterEstadoMapa } from './fases';
import { obterHabilidades } from './habilidades';
import { bonusEquipados } from './inventario';
import { obterJogador } from './jogo';

export type ContextoIdle = {
  contexto: Contexto;
  base: BaseHeroi;
  fase: FaseCatalogo | null; // null = todas as fases concluídas
  acumuladaMetros: number;
  pontosDisponiveis: number;
};

// Junta avatar (nível), itens equipados, pontos de habilidade e situação do chefe
// no contexto que o motor idle precisa.
export async function obterContextoIdle(usuarioId: string): Promise<ContextoIdle> {
  const [{ avatar }, bonus, hab, mapa] = await Promise.all([
    obterJogador(usuarioId),
    bonusEquipados(usuarioId),
    obterHabilidades(usuarioId),
    obterEstadoMapa(usuarioId),
  ]);

  const base: BaseHeroi = {
    forcaBase: avatar.forcaBase,
    vidaMaxima: avatar.vidaMaxima,
    bonusForca: bonus.forca,
    bonusVida: bonus.vida,
    pontos: { forca: hab.forca, vitalidade: hab.vitalidade, velocidade: hab.velocidade },
  };
  const a = mapa.atual;
  const ultima = mapa.fases[mapa.fases.length - 1].fase;

  return {
    base,
    fase: a?.fase ?? null,
    acumuladaMetros: a?.acumuladaMetros ?? 0,
    pontosDisponiveis: hab.disponiveis,
    contexto: {
      fase: (a?.fase ?? ultima).numero,
      heroi: calcularStatsHeroi(base),
      chefe: {
        podeEnfrentar: !!a?.podeAtacar,
        motivo: a ? a.motivoBloqueio : 'Todas as terras foram conquistadas!',
        vidaAtual: a?.vidaAtualChefe ?? 0,
        vidaMax: (a?.fase ?? ultima).chefe.vidaMaxima,
        limiteDano: a?.podeAtacar ? a.danoEstimado : 0,
      },
    },
  };
}
