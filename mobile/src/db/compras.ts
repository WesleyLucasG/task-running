import * as Crypto from 'expo-crypto';
import { CATALOGO, precoItem } from '../domain/loja';
import { getDbLoja } from './loja';

// Loja Mística (melhoria D3): compra com moedas ganhas correndo (RF18).
// Saldo e inventário mudam na mesma transação para não haver compra "pela metade".
export async function comprarItem(usuarioId: string, itemId: number): Promise<{ saldo: number; nome: string }> {
  const item = CATALOGO.find((i) => i.id === itemId);
  if (!item) throw new Error('Item não encontrado.');
  const preco = precoItem(item);
  const db = await getDbLoja();
  let saldo = 0;

  await db.withTransactionAsync(async () => {
    await db.runAsync(`INSERT OR IGNORE INTO carteiras (usuario_id) VALUES (?)`, [usuarioId]);
    const c = await db.getFirstAsync<{ saldo_moedas: number }>(
      `SELECT saldo_moedas FROM carteiras WHERE usuario_id = ?`,
      [usuarioId],
    );
    const atual = c?.saldo_moedas ?? 0;
    if (atual < preco) throw new Error(`Moedas insuficientes: faltam ${preco - atual}.`);
    saldo = atual - preco;
    await db.runAsync(`UPDATE carteiras SET saldo_moedas = ? WHERE usuario_id = ?`, [saldo, usuarioId]);
    await db.runAsync(
      `INSERT INTO inventario (id, usuario_id, item_id, equipado, data_adquirido) VALUES (?, ?, ?, 0, ?)`,
      [Crypto.randomUUID(), usuarioId, item.id, new Date().toISOString()],
    );
  });

  return { saldo, nome: item.nome };
}
