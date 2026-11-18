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
    forcaBase: e.atributos.forcaBase,
    agilidade: e.atributos.agilidade,
    vidaAtual: e.atributos.vidaMaxima,
    vidaMaxima: e.atributos.vidaMaxima,
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

// Garantia de tipagem: os ids do catálogo do app são os mesmos do servidor (1–16)
export const ITENS_CATALOGO = CATALOGO;
