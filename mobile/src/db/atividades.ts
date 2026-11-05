import * as Crypto from 'expo-crypto';
import type { Ponto } from '../domain/geo';
import { getDb } from '.';


export type TipoAtividade = 'CORRIDA' | 'CAMINHADA';
export type StatusAtividade = 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';

export type Atividade = {
  id: string;
  usuarioId: string;
  tipo: TipoAtividade;
  status: StatusAtividade;
  dataInicio: string;
  dataFim: string | null;
  duracaoSegundos: number;
  distanciaMetros: number;
  calorias: number;
  paceMedio: number;
  sincronizado: boolean;
};

type Linha = {
  id: string;
  usuario_id: string;
  tipo: TipoAtividade;
  status: StatusAtividade;
  data_inicio: string;
  data_fim: string | null;
  duracao_segundos: number;
  distancia_metros: number;
  calorias: number;
  pace_medio: number;
  sincronizado: number;
};

function mapear(l: Linha): Atividade {
  return {
    id: l.id,
    usuarioId: l.usuario_id,
    tipo: l.tipo,
    status: l.status,
    dataInicio: l.data_inicio,
    dataFim: l.data_fim,
    duracaoSegundos: l.duracao_segundos,
    distanciaMetros: l.distancia_metros,
    calorias: l.calorias,
    paceMedio: l.pace_medio,
    sincronizado: l.sincronizado === 1,
  };
}

export async function iniciarAtividade(
  usuarioId: string,
  tipo: TipoAtividade,
  inicio: Date,
): Promise<string> {
  const db = await getDb();
  const id = Crypto.randomUUID(); // identificadorLocal (RN04)
  await db.runAsync(
    `INSERT INTO atividades (id, usuario_id, tipo, status, data_inicio)
     VALUES (?, ?, ?, 'EM_ANDAMENTO', ?)`,
    [id, usuarioId, tipo, inicio.toISOString()],
  );
  return id;
}

export async function salvarPonto(atividadeId: string, p: Ponto): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO pontos_gps (atividade_id, latitude, longitude, altitude, timestamp)
     VALUES (?, ?, ?, ?, ?)`,
    [atividadeId, p.latitude, p.longitude, p.altitude, p.timestamp],
  );
}

export type Metricas = {
  dataFim: Date;
  duracaoSegundos: number;
  distanciaMetros: number;
  calorias: number;
  paceMedio: number;
};

export async function finalizarAtividade(id: string, m: Metricas): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE atividades
        SET status = 'CONCLUIDA', data_fim = ?, duracao_segundos = ?,
            distancia_metros = ?, calorias = ?, pace_medio = ?
      WHERE id = ?`,
    [m.dataFim.toISOString(), m.duracaoSegundos, m.distanciaMetros, m.calorias, m.paceMedio, id],
  );
}

// RF33
export async function cancelarAtividade(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE atividades SET status = 'CANCELADA' WHERE id = ?`, [id]);
}

// RF31: só atividades concluídas do usuário, da mais recente para a mais antiga
export async function listarAtividades(usuarioId: string): Promise<Atividade[]> {
  const db = await getDb();
  const linhas = await db.getAllAsync<Linha>(
    `SELECT * FROM atividades
      WHERE usuario_id = ? AND status = 'CONCLUIDA'
      ORDER BY data_inicio DESC`,
    [usuarioId],
  );
  return linhas.map(mapear);
}

export async function buscarAtividade(id: string, usuarioId: string): Promise<Atividade | null> {
  const db = await getDb();
  const l = await db.getFirstAsync<Linha>(
    `SELECT * FROM atividades WHERE id = ? AND usuario_id = ?`,
    [id, usuarioId],
  );
  return l ? mapear(l) : null;
}

export async function listarPontos(atividadeId: string): Promise<Ponto[]> {
  const db = await getDb();
  return db.getAllAsync<Ponto>(
    `SELECT latitude, longitude, altitude, timestamp
       FROM pontos_gps WHERE atividade_id = ? ORDER BY timestamp ASC`,
    [atividadeId],
  );
}

export async function excluirAtividade(id: string, usuarioId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM atividades WHERE id = ? AND usuario_id = ?`, [id, usuarioId]);
}