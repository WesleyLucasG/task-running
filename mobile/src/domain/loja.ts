export type TipoBau = 'BRONZE' | 'PRATA' | 'OURO';
export type Raridade = 'COMUM' | 'RARO' | 'EPICO' | 'LENDARIO';
export type TipoItem = 'ARMA' | 'CAPACETE' | 'ARMADURA' | 'BOTAS';

export type ItemCatalogo = {
  id: number;
  nome: string;
  tipo: TipoItem;
  raridade: Raridade;
  bonusForca: number;
  bonusVida: number;
};

export const RARIDADES: Raridade[] = ['COMUM', 'RARO', 'EPICO', 'LENDARIO'];
export const TIPOS_ITEM: TipoItem[] = ['ARMA', 'CAPACETE', 'ARMADURA', 'BOTAS'];

export const ROTULO_RARIDADE: Record<Raridade, string> = {
  COMUM: 'Comum',
  RARO: 'Raro',
  EPICO: 'Épico',
  LENDARIO: 'Lendário',
};
export const ROTULO_TIPO: Record<TipoItem, string> = {
  ARMA: 'Arma',
  CAPACETE: 'Capacete',
  ARMADURA: 'Armadura',
  BOTAS: 'Botas',
};
export const ROTULO_BAU: Record<TipoBau, string> = {
  BRONZE: 'Baú Bronze',
  PRATA: 'Baú Prata',
  OURO: 'Baú Ouro',
};

export const COR_RARIDADE: Record<Raridade, string> = {
  COMUM: '#94A3B8',
  RARO: '#3B82F6',
  EPICO: '#A855F7',
  LENDARIO: '#FACC15',
};
export const COR_BAU: Record<TipoBau, string> = {
  BRONZE: '#CD7F32',
  PRATA: '#CBD5E1',
  OURO: '#FACC15',
};

const MULTIPLICADOR: Record<Raridade, number> = { COMUM: 1, RARO: 2, EPICO: 4, LENDARIO: 7 };
const BASE: Record<TipoItem, { forca: number; vida: number }> = {
  ARMA: { forca: 3, vida: 0 },
  CAPACETE: { forca: 1, vida: 10 },
  ARMADURA: { forca: 1, vida: 20 },
  BOTAS: { forca: 2, vida: 5 },
};
const NOMES: Record<TipoItem, string[]> = {
  ARMA: ['Cajado de Madeira', 'Caduceu de Bronze', 'Caduceu de Prata', 'Caduceu Dourado'],
  CAPACETE: ['Boné de Corredor', 'Elmo de Bronze', 'Elmo Alado', 'Elmo Dourado de Hermes'],
  ARMADURA: ['Túnica Simples', 'Túnica de Atleta', 'Túnica Olímpica', 'Manto Dourado de Hermes'],
  BOTAS: ['Tênis Gasto', 'Tênis de Maratona', 'Tênis Alado', 'Sandálias Aladas de Hermes'],
};

// Catálogo fixo: 4 tipos x 4 raridades = 16 itens
export const CATALOGO: ItemCatalogo[] = TIPOS_ITEM.flatMap((tipo, i) =>
  RARIDADES.map((raridade, j) => ({
    id: i * RARIDADES.length + j + 1,
    nome: NOMES[tipo][j],
    tipo,
    raridade,
    bonusForca: BASE[tipo].forca * MULTIPLICADOR[raridade],
    bonusVida: BASE[tipo].vida * MULTIPLICADOR[raridade],
  })),
);

// Probabilidades (%) de cada raridade por tipo de baú
const TABELA_DROP: Record<TipoBau, [Raridade, number][]> = {
  BRONZE: [['COMUM', 80], ['RARO', 20]],
  PRATA: [['COMUM', 50], ['RARO', 40], ['EPICO', 10]],
  OURO: [['COMUM', 20], ['RARO', 40], ['EPICO', 30], ['LENDARIO', 10]],
};

export function sortearRaridade(tipo: TipoBau, aleatorio: () => number = Math.random): Raridade {
  const tabela = TABELA_DROP[tipo];
  const r = aleatorio() * 100;
  let acumulado = 0;
  for (const [raridade, chance] of tabela) {
    acumulado += chance;
    if (r < acumulado) return raridade;
  }
  return tabela[tabela.length - 1][0];
}