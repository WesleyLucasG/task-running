import * as Crypto from 'expo-crypto';
import { CATALOGO, Raridade, sortearRaridade, TipoBau, TipoItem } from '../domain/loja';
import { getDbLoja } from './loja';

export type Bau = { id: string; tipo: TipoBau; criadoEm: string };

export type ItemInventario = {
  id: string; // id do registro no inventário
  itemId: number;
  nome: string;
  tipo: TipoItem;
  raridade: Raridade;
  bonusForca: number;
  bonusVida: number;
  equipado: boolean;
};

export async function listarBaus(usuarioId: string): Promise<Bau[]> {
  const db = await getDbLoja();
  const linhas = await db.getAllAsync<{ id: string; tipo: TipoBau; criado_em: string }>(
    `SELECT id, tipo, criado_em FROM baus
      WHERE usuario_id = ? AND resgatado = 0 ORDER BY criado_em ASC`,
    [usuarioId],
  );
  return linhas.map((l) => ({ id: l.id, tipo: l.tipo, criadoEm: l.criado_em }));
}

// UC12
export async function abrirBau(usuarioId: string, bauId: string): Promise<ItemInventario> {
  const db = await getDbLoja();
  let novo!: ItemInventario;

  await db.withTransactionAsync(async () => {
    const bau = await db.getFirstAsync<{ tipo: TipoBau; resgatado: number }>(
      `SELECT tipo, resgatado FROM baus WHERE id = ? AND usuario_id = ?`,
      [bauId, usuarioId],
    );
    if (!bau) throw new Error('Baú não encontrado.'); // RN07
    if (bau.resgatado === 1) throw new Error('Este baú já foi aberto.');

    const raridade = sortearRaridade(bau.tipo);
    const candidatos = CATALOGO.filter((i) => i.raridade === raridade);
    const item = candidatos[Math.floor(Math.random() * candidatos.length)];
    const registroId = Crypto.randomUUID();

    await db.runAsync(
      `INSERT INTO inventario (id, usuario_id, item_id, equipado, data_adquirido)
       VALUES (?, ?, ?, 0, ?)`,
      [registroId, usuarioId, item.id, new Date().toISOString()],
    );
    await db.runAsync(`UPDATE baus SET resgatado = 1 WHERE id = ?`, [bauId]);

    novo = {
      id: registroId,
      itemId: item.id,
      nome: item.nome,
      tipo: item.tipo,
      raridade: item.raridade,
      bonusForca: item.bonusForca,
      bonusVida: item.bonusVida,
      equipado: false,
    };
  });

  return novo;
}

// RF25
export async function listarInventario(usuarioId: string): Promise<ItemInventario[]> {
  const db = await getDbLoja();
  const linhas = await db.getAllAsync<{
    id: string;
    item_id: number;
    equipado: number;
    nome: string;
    tipo: TipoItem;
    raridade: Raridade;
    bonus_forca: number;
    bonus_vida: number;
  }>(
    `SELECT inv.id, inv.item_id, inv.equipado, i.nome, i.tipo, i.raridade, i.bonus_forca, i.bonus_vida
       FROM inventario inv JOIN itens i ON i.id = inv.item_id
      WHERE inv.usuario_id = ?
      ORDER BY inv.equipado DESC, inv.data_adquirido DESC`,
    [usuarioId],
  );
  return linhas.map((l) => ({
    id: l.id,
    itemId: l.item_id,
    nome: l.nome,
    tipo: l.tipo,
    raridade: l.raridade,
    bonusForca: l.bonus_forca,
    bonusVida: l.bonus_vida,
    equipado: l.equipado === 1,
  }));
}

// RF26: equipar desequipa o item anterior do mesmo tipo (UC10)
export async function alternarEquipado(usuarioId: string, registroId: string): Promise<void> {
  const db = await getDbLoja();
  await db.withTransactionAsync(async () => {
    const alvo = await db.getFirstAsync<{ equipado: number; tipo: string }>(
      `SELECT inv.equipado, i.tipo
         FROM inventario inv JOIN itens i ON i.id = inv.item_id
        WHERE inv.id = ? AND inv.usuario_id = ?`,
      [registroId, usuarioId],
    );
    if (!alvo) throw new Error('Item não encontrado.'); // RN07

    if (alvo.equipado === 1) {
      await db.runAsync(`UPDATE inventario SET equipado = 0 WHERE id = ?`, [registroId]);
      return;
    }
    await db.runAsync(
      `UPDATE inventario SET equipado = 0
        WHERE usuario_id = ? AND equipado = 1
          AND item_id IN (SELECT id FROM itens WHERE tipo = ?)`,
      [usuarioId, alvo.tipo],
    );
    await db.runAsync(`UPDATE inventario SET equipado = 1 WHERE id = ?`, [registroId]);
  });
}

// Soma dos bônus dos itens equipados (será usada no dano contra o chefe, RN12)
export async function bonusEquipados(usuarioId: string): Promise<{ forca: number; vida: number }> {
  const db = await getDbLoja();
  const l = await db.getFirstAsync<{ forca: number; vida: number }>(
    `SELECT COALESCE(SUM(i.bonus_forca), 0) AS forca, COALESCE(SUM(i.bonus_vida), 0) AS vida
       FROM inventario inv JOIN itens i ON i.id = inv.item_id
      WHERE inv.usuario_id = ? AND inv.equipado = 1`,
    [usuarioId],
  );
  return { forca: l?.forca ?? 0, vida: l?.vida ?? 0 };
}