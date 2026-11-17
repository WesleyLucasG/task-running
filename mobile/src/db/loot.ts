import { ferramentasReais } from './aleatorio';
import { getDbLoja } from './loja';
import { recompensarMonstro, RecompensaMonstro } from './regrasLoot';

// Monstro comum derrotado na esteira: moedas + chance de baú (D19)
export async function recompensarMonstroDerrotado(usuarioId: string, fase: number): Promise<RecompensaMonstro> {
  const db = await getDbLoja();
  return recompensarMonstro(db, usuarioId, fase, ferramentasReais);
}
