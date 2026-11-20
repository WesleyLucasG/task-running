import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Bau, ItemInventario } from '../db/inventario';
import type { Avatar } from '../db/jogo';
import type { EstadoMapa, ResultadoAtaque, Situacao } from '../db/fases';
import type { Cabelo, DetalheRoupa, Genero } from '../domain/avatar';
import { CATALOGO, Raridade, TipoBau, TipoItem } from '../domain/loja';
import { fasePorNumero, FASES } from '../domain/fases';
import { api, ErroApi } from './api';

// RPG no servidor (/api/jogo): a fonte oficial de carteira, aparência, fases, chefes, baús e itens.
// O app só exibe o que a API devolve; o último estado fica em cache para abrir sem internet.

export type AparenciaApi = {
  genero: Genero;
  cabelo: Cabelo;
  corCabelo: string;
  corPele: string;
  corRoupa: string;
  detalheRoupa: DetalheRoupa;
};

type AtributosApi = {
  nivel: number;
  experiencia: number;
  xpNoNivel: number;
  xpParaProximoNivel: number;
  forcaBase: number;
  agilidade: number;
  vidaMaxima: number;
  bonusForca: number;
  bonusVida: number;
  multiplicadorRecompensa: number;
};

type FaseApi = {
  numero: number;
  situacao: Situacao;
  distanciaAcumuladaMetros: number;
  chefeLiberado: boolean;
  vidaAtualChefe: number;
};

export type EstadoJogoApi = {
  carteira: { moedas: number; experienciaXp: number; nivel: number };
  atributos: AtributosApi;
  aparencia: AparenciaApi;
  fases: FaseApi[];
  chefeAtual: { faseNumero: number; podeAtacar: boolean; motivoBloqueio: string | null; danoEstimado: number } | null;
  bausPendentes: number;
};

type ItemApi = {
  id: number;
  itemId: number;
  nome: string;
  tipo: TipoItem;
  raridade: Raridade;
  bonusForca: number;
  bonusVida: number;
  equipado: boolean;
  valorVenda?: number;
};

const CHAVE_CACHE = 'tr:cache-estado-jogo';

export async function obterEstado(): Promise<EstadoJogoApi> {
  try {
    const e = await api<EstadoJogoApi>('/api/jogo/estado');
    await AsyncStorage.setItem(CHAVE_CACHE, JSON.stringify(e));
    return e;
  } catch (erro) {
    // Sem internet: mostra o último estado confirmado pelo servidor (não inventa valores)
    if (erro instanceof ErroApi && erro.semConexao) {
      const bruto = await AsyncStorage.getItem(CHAVE_CACHE);
      if (bruto) return JSON.parse(bruto) as EstadoJogoApi;
    }
    throw erro;
  }
}

export async function limparCache(): Promise<void> {
  await AsyncStorage.removeItem(CHAVE_CACHE);
}

/** Converte o estado do servidor no formato de avatar que as telas já usam. */
export function avatarDoEstado(e: EstadoJogoApi): Avatar {
  return {
    nivel: e.atributos.nivel,
    experiencia: e.atributos.xpNoNivel,
    xpParaProximoNivel: e.atributos.xpParaProximoNivel,
    forcaBase: e.atributos.forcaBase,
    agilidade: e.atributos.agilidade,
    // O servidor devolve a vida JÁ com o bônus dos itens; aqui fica só a vida do nível (como no modo local),
    // porque a esteira soma o bônus dos itens à parte. Antes o bônus era contado duas vezes.
    vidaAtual: e.atributos.vidaMaxima - e.atributos.bonusVida,
    vidaMaxima: e.atributos.vidaMaxima - e.atributos.bonusVida,
    genero: e.aparencia.genero,
    cabelo: e.aparencia.cabelo,
    corPele: e.aparencia.corPele,
    corRoupa: e.aparencia.corRoupa,
    corCabelo: e.aparencia.corCabelo,
    detalheRoupa: e.aparencia.detalheRoupa,
  };
}

export async function obterJogador(): Promise<{ avatar: Avatar; moedas: number }> {
  const e = await obterEstado();
  return { avatar: avatarDoEstado(e), moedas: e.carteira.moedas };
}

export async function salvarAparencia(a: AparenciaApi): Promise<void> {
  await api('/api/jogo/aparencia', { metodo: 'PUT', corpo: a });
  await obterEstado(); // atualiza o cache com o que o servidor gravou
}

export async function obterEstadoMapa(): Promise<EstadoMapa> {
  const e = await obterEstado();
  const fases = e.fases
    .map((f) => ({ fase: fasePorNumero(f.numero), situacao: f.situacao }))
    .filter((f): f is { fase: NonNullable<typeof f.fase>; situacao: Situacao } => !!f.fase);
  const atualApi = e.fases.find((f) => f.situacao === 'ATUAL');
  const fase = atualApi ? fasePorNumero(atualApi.numero) : undefined;
  return {
    fases: fases.length ? fases : FASES.map((f) => ({ fase: f, situacao: 'BLOQUEADA' as Situacao })),
    jogoConcluido: !atualApi,
    atual:
      atualApi && fase
        ? {
            fase,
            acumuladaMetros: atualApi.distanciaAcumuladaMetros,
            chefeLiberado: atualApi.chefeLiberado,
            vidaAtualChefe: atualApi.vidaAtualChefe,
            podeAtacar: !!e.chefeAtual?.podeAtacar,
            motivoBloqueio: e.chefeAtual?.motivoBloqueio ?? null,
            danoEstimado: e.chefeAtual?.danoEstimado ?? 0,
          }
        : null,
  };
}

/** UC11: o app informa o dano da esteira; o servidor aplica a RN12 e persiste a vida (RN15). */
export async function atacarChefe(danoCausado: number): Promise<ResultadoAtaque> {
  const r = await api<{
    dano: number;
    vidaRestante: number;
    vidaMaxima: number;
    derrotado: boolean;
    proximaFase: string | null;
  }>('/api/jogo/chefe/atacar', {
    metodo: 'POST',
    corpo: Number.isFinite(danoCausado) ? { danoCausado: Math.max(0, Math.round(danoCausado)) } : {},
  });
  await obterEstado().catch(() => {});
  return { ...r, itemLendario: null };
}

export async function listarBaus(): Promise<Bau[]> {
  const lista = await api<{ id: number; tipo: TipoBau; criadoEm: string }[]>('/api/jogo/baus');
  return lista.map((b) => ({ id: String(b.id), tipo: b.tipo, criadoEm: b.criadoEm }));
}

const paraItem = (i: ItemApi): ItemInventario => ({
  id: String(i.id),
  itemId: i.itemId,
  nome: i.nome,
  tipo: i.tipo,
  raridade: i.raridade,
  bonusForca: i.bonusForca,
  bonusVida: i.bonusVida,
  equipado: i.equipado,
  local: 'INVENTARIO',
  valorVenda: i.valorVenda,
});

/** UC12: o sorteio é feito no servidor; o app só mostra o item recebido. */
export async function abrirBau(bauId: string): Promise<ItemInventario> {
  const item = paraItem(await api<ItemApi>(`/api/jogo/baus/${encodeURIComponent(bauId)}/abrir`, { metodo: 'POST' }));
  await obterEstado().catch(() => {});
  return item;
}

export async function listarInventario(): Promise<ItemInventario[]> {
  return (await api<ItemApi[]>('/api/jogo/inventario')).map(paraItem);
}

export async function alternarEquipado(registroId: string): Promise<void> {
  await api(`/api/jogo/inventario/${encodeURIComponent(registroId)}/equipar`, { metodo: 'PUT' });
  await obterEstado().catch(() => {});
}

export async function bonusEquipados(): Promise<{ forca: number; vida: number }> {
  const e = await obterEstado();
  return { forca: e.atributos.bonusForca, vida: e.atributos.bonusVida };
}

// ─── Monstros da esteira (extensão aprovada) ────────────────────────────────

export type ResultadoAbate = {
  recompensado: boolean;
  motivo: 'LIMITE_DIARIO' | 'RITMO' | null;
  repetido: boolean;
  faseNumero: number;
  xp: number;
  moedas: number;
  bauId: number | null;
  tipoBau: TipoBau | null;
  abatesRecompensadosHoje: number;
  limiteDiario: number;
  nivel: number;
  experienciaXp: number;
  saldoMoedas: number;
};

/**
 * O app envia só o identificador do abate; XP, moedas e baú são decididos pelo servidor.
 * Em falha de rede reenvia o MESMO id (o servidor não paga duas vezes).
 */
export async function registrarAbate(idAbate: string, tentativas = 3): Promise<ResultadoAbate> {
  for (let t = 1; ; t++) {
    try {
      return await api<ResultadoAbate>('/api/jogo/monstros/abate', { metodo: 'POST', corpo: { idAbate } });
    } catch (e) {
      if (!(e instanceof ErroApi && e.semConexao) || t >= tentativas) throw e;
      await new Promise((r) => setTimeout(r, 1500 * t));
    }
  }
}

// ─── Metas diárias e semanais ───────────────────────────────────────────────

export type Meta = {
  codigo: string;
  periodo: 'DIARIA' | 'SEMANAL';
  categoria: 'COMBATE' | 'CORRIDA' | 'HIDRATACAO' | 'PROGRESSAO' | 'BONUS';
  titulo: string;
  descricao: string;
  progresso: number;
  alvo: number;
  unidade: string;
  moedas: number;
  concluida: boolean;
  resgatada: boolean;
  bonus: boolean;
};

export type Metas = {
  diarias: Meta[];
  semanais: Meta[];
  segundosParaRenovarDiarias: number;
  segundosParaRenovarSemanais: number;
};

export async function listarMetas(): Promise<Metas> {
  return api<Metas>('/api/jogo/metas');
}

export async function resgatarMeta(codigo: string): Promise<{ codigo: string; moedas: number; saldoMoedas: number }> {
  const r = await api<{ codigo: string; moedas: number; saldoMoedas: number }>(
    `/api/jogo/metas/${encodeURIComponent(codigo)}/resgatar`,
    { metodo: 'POST' },
  );
  await obterEstado().catch(() => {});
  return r;
}

// ─── Venda de itens ─────────────────────────────────────────────────────────

export async function venderItem(
  registroId: string,
): Promise<{ nome: string; raridade: Raridade; moedas: number; saldoMoedas: number; repetido: boolean }> {
  const r = await api<{ nome: string; raridade: Raridade; moedas: number; saldoMoedas: number; repetido: boolean }>(
    `/api/jogo/inventario/${encodeURIComponent(registroId)}/vender`,
    { metodo: 'POST' },
  );
  await obterEstado().catch(() => {});
  return r;
}

// Garantia de tipagem: os ids do catálogo do app são os mesmos do servidor (1–16)
export const ITENS_CATALOGO = CATALOGO;
