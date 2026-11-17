// Regras de loot e do baú de armazenamento que mexem no banco.
// Recebem a conexão e os geradores por parâmetro (sem importar expo-*), por isso
// podem ser testadas no Node com SQLite em memória (ver testes/loot.test.mjs).
import { CATALOGO } from '../domain/loja';
import type { ItemCatalogo } from '../domain/loja';
import { escolherItem, moedasPorMonstro, sortearBauMonstro, sortearLendarioChefe } from '../domain/recompensas';
import type { Aleatorio, RaridadeBauDrop } from '../domain/recompensas';

// Subconjunto da API do expo-sqlite usado aqui
export type DbLike = {
  runAsync(sql: string, params: (string | number | null)[]): Promise<{ changes: number }>;
  getFirstAsync<T>(sql: string, params: (string | number | null)[]): Promise<T | null>;
  withTransactionAsync(fn: () => Promise<void>): Promise<void>;
};

export type Ferramentas = { aleatorio: Aleatorio; novoId: () => string; agora: () => Date };

export type LocalItem = 'INVENTARIO' | 'BAU';

const dia = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

async function inserirBau(db: DbLike, usuarioId: string, tipo: string, f: Ferramentas): Promise<string> {
  const id = f.novoId();
  const agora = f.agora();
  await db.runAsync(
    `INSERT INTO baus (id, usuario_id, tipo, resgatado, criado_em, dia) VALUES (?, ?, ?, 0, ?, ?)`,
    [id, usuarioId, tipo, agora.toISOString(), dia(agora)],
  );
  return id;
}

export type RecompensaMonstro = { moedas: number; bau: { id: string; tipo: RaridadeBauDrop } | null };

// Monstro comum derrotado: moedas sempre + chance de baú (sem XP: RF18 continua só por distância)
export async function recompensarMonstro(
  db: DbLike,
  usuarioId: string,
  fase: number,
  f: Ferramentas,
): Promise<RecompensaMonstro> {
  const moedas = moedasPorMonstro(fase);
  const raridade = sortearBauMonstro(f.aleatorio);
  let bau: RecompensaMonstro['bau'] = null;

  await db.withTransactionAsync(async () => {
    await db.runAsync(`INSERT OR IGNORE INTO carteiras (usuario_id) VALUES (?)`, [usuarioId]);
    await db.runAsync(`UPDATE carteiras SET saldo_moedas = saldo_moedas + ? WHERE usuario_id = ?`, [
      moedas,
      usuarioId,
    ]);
    if (raridade) bau = { id: await inserirBau(db, usuarioId, raridade, f), tipo: raridade };
  });
  return { moedas, bau };
}

export type RecompensaChefe = { concedida: boolean; bauId: string | null; itemLendario: ItemCatalogo | null };

// Chefe derrotado definitivamente: baú Ouro (RF22, já existente) + 10% de item lendário extra.
// A tabela recompensas_chefe (chave usuário+fase) garante que isso aconteça uma única vez.
// Deve ser chamada dentro da transação que zerou a vida do chefe.
export async function concederRecompensaChefe(
  db: DbLike,
  usuarioId: string,
  fase: number,
  f: Ferramentas,
): Promise<RecompensaChefe> {
  const r = await db.runAsync(
    `INSERT OR IGNORE INTO recompensas_chefe (usuario_id, fase_numero, concedida_em) VALUES (?, ?, ?)`,
    [usuarioId, fase, f.agora().toISOString()],
  );
  if (r.changes === 0) return { concedida: false, bauId: null, itemLendario: null };

  const bauId = await inserirBau(db, usuarioId, 'OURO', f);
  let itemLendario: ItemCatalogo | null = null;
  if (sortearLendarioChefe(f.aleatorio)) {
    itemLendario = escolherItem(CATALOGO, 'LENDARIO', f.aleatorio);
    await db.runAsync(
      `INSERT INTO inventario (id, usuario_id, item_id, equipado, data_adquirido, local)
       VALUES (?, ?, ?, 0, ?, 'INVENTARIO')`,
      [f.novoId(), usuarioId, itemLendario.id, f.agora().toISOString()],
    );
  }
  return { concedida: true, bauId, itemLendario };
}

// Baú de armazenamento: só muda a coluna `local` do MESMO registro.
// Não cria nem apaga linhas, então não há como duplicar, perder ou alterar atributos.
export async function moverItem(db: DbLike, usuarioId: string, registroId: string, destino: LocalItem): Promise<void> {
  const item = await db.getFirstAsync<{ equipado: number; local: LocalItem }>(
    `SELECT equipado, local FROM inventario WHERE id = ? AND usuario_id = ?`,
    [registroId, usuarioId],
  );
  if (!item) throw new Error('Item não encontrado.');
  if (item.local === destino) return;
  if (destino === 'BAU' && item.equipado === 1) {
    throw new Error('Desequipe o item antes de guardá-lo no baú.');
  }
  await db.runAsync(`UPDATE inventario SET local = ? WHERE id = ? AND usuario_id = ? AND equipado = 0`, [
    destino,
    registroId,
    usuarioId,
  ]);
}
