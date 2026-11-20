import { apiConfigurada } from '../services/api';
import * as Remoto from '../services/jogoRemoto';
import * as Crypto from 'expo-crypto';
import { CATALOGO, Raridade, sortearRaridade, TipoBau, TipoItem } from '../domain/loja';
import { escolherItem } from '../domain/recompensas';
import { aleatorioSeguro } from './aleatorio';
import { getDbLoja } from './loja';
import { descartarItem, LocalItem, moverItem } from './regrasLoot';

export type Bau = { id: string; tipo: TipoBau; criadoEm: string };

export type ItemInventario = {
  id: string; // id do registro no inventário
  itemId: number;
  nome: string;
  tipo: TipoItem;
  raridade: Raridade;
  bonusForca: number;
  bonusVida: number;
  bonusArmadura: number; // D45; 0 em itens antigos e no modo local
  bonusAgilidade: number;
  equipado: boolean;
  local: LocalItem; // INVENTARIO ou BAU (baú de armazenamento)
  valorVenda?: number; // modo API: moedas da venda, calculadas pelo servidor
};

export async function listarBaus(usuarioId: string): Promise<Bau[]> {
  if (apiConfigurada()) return Remoto.listarBaus();
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
  if (apiConfigurada()) return Remoto.abrirBau(bauId);
  const db = await getDbLoja();
  let novo!: ItemInventario;

  await db.withTransactionAsync(async () => {
    const bau = await db.getFirstAsync<{ tipo: TipoBau; resgatado: number }>(
      `SELECT tipo, resgatado FROM baus WHERE id = ? AND usuario_id = ?`,
      [bauId, usuarioId],
    );
    if (!bau) throw new Error('Baú não encontrado.'); // RN07
    if (bau.resgatado === 1) throw new Error('Este baú já foi aberto.');

    const raridade = sortearRaridade(bau.tipo, aleatorioSeguro);
    const item = escolherItem(CATALOGO, raridade, aleatorioSeguro);
    const registroId = Crypto.randomUUID();

    await db.runAsync(
      `INSERT INTO inventario (id, usuario_id, item_id, equipado, data_adquirido, local)
       VALUES (?, ?, ?, 0, ?, 'INVENTARIO')`,
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
      bonusArmadura: 0, // modo local: o banco do aparelho não guarda armadura/agilidade
      bonusAgilidade: 0,
      equipado: false,
      local: 'INVENTARIO',
    };
  });

  return novo;
}

// RF25
export async function listarInventario(usuarioId: string): Promise<ItemInventario[]> {
  if (apiConfigurada()) return Remoto.listarInventario();
  const db = await getDbLoja();
  const linhas = await db.getAllAsync<{
    id: string;
    item_id: number;
    equipado: number;
    local: LocalItem;
    nome: string;
    tipo: TipoItem;
    raridade: Raridade;
    bonus_forca: number;
    bonus_vida: number;
  }>(
    `SELECT inv.id, inv.item_id, inv.equipado, inv.local, i.nome, i.tipo, i.raridade, i.bonus_forca, i.bonus_vida
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
    bonusArmadura: 0,
    bonusAgilidade: 0,
    equipado: l.equipado === 1,
    local: l.local,
  }));
}

// RF26: equipar desequipa o item anterior do mesmo tipo (UC10)
export async function alternarEquipado(usuarioId: string, registroId: string): Promise<void> {
  if (apiConfigurada()) return Remoto.alternarEquipado(registroId);
  const db = await getDbLoja();
  await db.withTransactionAsync(async () => {
    const alvo = await db.getFirstAsync<{ equipado: number; tipo: string; local: LocalItem }>(
      `SELECT inv.equipado, inv.local, i.tipo
         FROM inventario inv JOIN itens i ON i.id = inv.item_id
        WHERE inv.id = ? AND inv.usuario_id = ?`,
      [registroId, usuarioId],
    );
    if (!alvo) throw new Error('Item não encontrado.'); // RN07
    if (alvo.local === 'BAU') throw new Error('Retire o item do baú antes de equipá-lo.');

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
export async function bonusEquipados(usuarioId: string): Promise<Remoto.BonusCombate> {
  if (apiConfigurada()) return Remoto.bonusEquipados();
  const db = await getDbLoja();
  const l = await db.getFirstAsync<{ forca: number; vida: number }>(
    `SELECT COALESCE(SUM(i.bonus_forca), 0) AS forca, COALESCE(SUM(i.bonus_vida), 0) AS vida
       FROM inventario inv JOIN itens i ON i.id = inv.item_id
      WHERE inv.usuario_id = ? AND inv.equipado = 1`,
    [usuarioId],
  );
  // Modo local (sem servidor): o banco do aparelho só guarda força e vida; armadura/agilidade valem 0
  return { forca: l?.forca ?? 0, vida: l?.vida ?? 0, armadura: 0, agilidade: 0 };
}
// Baú de armazenamento (D19): guardar/retirar sem alterar o item
export async function moverItemDeLocal(usuarioId: string, registroId: string, destino: LocalItem): Promise<void> {
  const db = await getDbLoja();
  await moverItem(db, usuarioId, registroId, destino);
}


// Descartar item da mochila em troca de moedas (2/4/6/8/10 por raridade)
export async function descartarItemDaMochila(usuarioId: string, registroId: string) {
  const db = await getDbLoja();
  return descartarItem(db, usuarioId, registroId);
}

// Venda (modo API): o servidor decide o valor pela raridade real e faz tudo numa transação
export async function venderItem(registroId: string) {
  if (!apiConfigurada()) throw new Error('A venda de itens precisa de conexão com o servidor.');
  return Remoto.venderItem(registroId);
}
