import { pontosGanhos, Pontos } from '../domain/idle';
import { getDbFases } from './fases';

export type Atributo = keyof Pontos;
export type EstadoHabilidades = Pontos & { ganhos: number; disponiveis: number; distanciaTotalMetros: number };

// Pontos ganhos = 2 por km de atividades concluídas (D15). Disponíveis = ganhos - distribuídos.
export async function obterHabilidades(usuarioId: string): Promise<EstadoHabilidades> {
  const db = await getDbFases();
  await db.runAsync(`INSERT OR IGNORE INTO habilidades (usuario_id) VALUES (?)`, [usuarioId]);
  const h = await db.getFirstAsync<Pontos>(
    `SELECT forca, vitalidade, velocidade FROM habilidades WHERE usuario_id = ?`,
    [usuarioId],
  );
  const d = await db.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(distancia_metros) AS total FROM atividades WHERE usuario_id = ? AND status = 'CONCLUIDA'`,
    [usuarioId],
  );
  const pontos = h ?? { forca: 0, vitalidade: 0, velocidade: 0 };
  const distanciaTotalMetros = d?.total ?? 0;
  const ganhos = pontosGanhos(distanciaTotalMetros);
  const usados = pontos.forca + pontos.vitalidade + pontos.velocidade;
  return { ...pontos, ganhos, disponiveis: Math.max(0, ganhos - usados), distanciaTotalMetros };
}

export async function distribuirPonto(usuarioId: string, atributo: Atributo): Promise<EstadoHabilidades> {
  const atual = await obterHabilidades(usuarioId);
  if (atual.disponiveis <= 0) throw new Error('Sem pontos disponíveis. Corra para ganhar mais!');
  const coluna = { forca: 'forca', vitalidade: 'vitalidade', velocidade: 'velocidade' }[atributo];
  const db = await getDbFases();
  await db.runAsync(`UPDATE habilidades SET ${coluna} = ${coluna} + 1 WHERE usuario_id = ?`, [usuarioId]);
  return obterHabilidades(usuarioId);
}
