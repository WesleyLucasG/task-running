// BRONZE/PRATA/OURO: baús de meta (hidratação, fase, chefe).
// COMUM/INCOMUM/RARO/LENDARIO: baús de recompensa encontrados na esteira (item da mesma raridade).
export type TipoBau = 'BRONZE' | 'PRATA' | 'OURO' | 'COMUM' | 'INCOMUM' | 'RARO' | 'LENDARIO';
export type Raridade = 'COMUM' | 'INCOMUM' | 'RARO' | 'EPICO' | 'LENDARIO';
export type TipoItem = 'ARMA' | 'CAPACETE' | 'ARMADURA' | 'BOTAS';

export type ItemCatalogo = {
  id: number;
  nome: string;
  tipo: TipoItem;
  raridade: Raridade;
  bonusForca: number;
  bonusVida: number;
  bonusArmadura: number; // reduz o dano recebido (idle.ts → reducaoPorArmadura)
  bonusAgilidade: number; // reduz o intervalo entre ataques (idle.ts → intervaloAtaque)
};

export const RARIDADES: Raridade[] = ['COMUM', 'INCOMUM', 'RARO', 'EPICO', 'LENDARIO'];
export const TIPOS_ITEM: TipoItem[] = ['ARMA', 'CAPACETE', 'ARMADURA', 'BOTAS'];

export const ROTULO_RARIDADE: Record<Raridade, string> = {
  COMUM: 'Comum',
  INCOMUM: 'Incomum',
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
  COMUM: 'Baú Comum',
  INCOMUM: 'Baú Incomum',
  RARO: 'Baú Raro',
  LENDARIO: 'Baú Lendário',
};

export const COR_RARIDADE: Record<Raridade, string> = {
  COMUM: '#94A3B8',
  INCOMUM: '#22C55E',
  RARO: '#3B82F6',
  EPICO: '#A855F7',
  LENDARIO: '#FACC15',
};
export const COR_BAU: Record<TipoBau, string> = {
  BRONZE: '#CD7F32',
  PRATA: '#CBD5E1',
  OURO: '#FACC15',
  COMUM: '#94A3B8',
  INCOMUM: '#22C55E',
  RARO: '#3B82F6',
  LENDARIO: '#FACC15',
};

// Balanceamento final (igual ao servidor, JogoService.inicializarItens): atributos do item Comum
// multiplicados pela raridade. Arma = força; capacete/armadura = vida e armadura; botas = agilidade.
export const MULTIPLICADOR: Record<Raridade, number> = { COMUM: 1, INCOMUM: 1.5, RARO: 2, EPICO: 3, LENDARIO: 4.5 };
export const BASE_ITEM: Record<TipoItem, { forca: number; vida: number; armadura: number; agilidade: number }> = {
  ARMA: { forca: 3, vida: 0, armadura: 0, agilidade: 2 },
  CAPACETE: { forca: 1, vida: 4, armadura: 2, agilidade: 0 },
  ARMADURA: { forca: 1, vida: 6, armadura: 4, agilidade: 0 },
  BOTAS: { forca: 1, vida: 2, armadura: 1, agilidade: 3 },
};
const BASE = BASE_ITEM;
const NOMES: Record<TipoItem, string[]> = {
  ARMA: ['Cajado de Madeira', 'Caduceu de Bronze', 'Caduceu de Prata', 'Caduceu Dourado'],
  CAPACETE: ['Boné de Corredor', 'Elmo de Bronze', 'Elmo Alado', 'Elmo Dourado de Hermes'],
  ARMADURA: ['Túnica Simples', 'Túnica de Atleta', 'Túnica Olímpica', 'Manto Dourado de Hermes'],
  BOTAS: ['Tênis Gasto', 'Tênis de Maratona', 'Tênis Alado', 'Sandálias Aladas de Hermes'],
};

const NOMES_INCOMUM: Record<TipoItem, string> = {
  ARMA: 'Lança de Ferro',
  CAPACETE: 'Elmo de Ferro',
  ARMADURA: 'Túnica Reforçada',
  BOTAS: 'Tênis de Trilha',
};

// Catálogo fixo. Os ids 1–16 (4 tipos x 4 raridades originais) NÃO podem mudar:
// o inventário guarda o item_id. Os itens Incomum entraram depois, com ids 17–20.
const RARIDADES_ORIGINAIS: Raridade[] = ['COMUM', 'RARO', 'EPICO', 'LENDARIO'];
const montar = (id: number, nome: string, tipo: TipoItem, raridade: Raridade): ItemCatalogo => ({
  id,
  nome,
  tipo,
  raridade,
  bonusForca: Math.round(BASE[tipo].forca * MULTIPLICADOR[raridade]),
  bonusVida: Math.round(BASE[tipo].vida * MULTIPLICADOR[raridade]),
  bonusArmadura: Math.round(BASE[tipo].armadura * MULTIPLICADOR[raridade]),
  bonusAgilidade: Math.round(BASE[tipo].agilidade * MULTIPLICADOR[raridade]),
});

export const CATALOGO: ItemCatalogo[] = [
  ...TIPOS_ITEM.flatMap((tipo, i) =>
    RARIDADES_ORIGINAIS.map((raridade, j) => montar(i * 4 + j + 1, NOMES[tipo][j], tipo, raridade)),
  ),
  ...TIPOS_ITEM.map((tipo, i) => montar(17 + i, NOMES_INCOMUM[tipo], tipo, 'INCOMUM')),
];

// Probabilidades (%) de cada raridade por tipo de baú
const TABELA_DROP: Record<TipoBau, [Raridade, number][]> = {
  BRONZE: [['COMUM', 80], ['RARO', 20]],
  PRATA: [['COMUM', 50], ['RARO', 40], ['EPICO', 10]],
  OURO: [['COMUM', 20], ['RARO', 40], ['EPICO', 30], ['LENDARIO', 10]],
  // Baús da esteira: a raridade do item é a do baú
  COMUM: [['COMUM', 100]],
  INCOMUM: [['INCOMUM', 100]],
  RARO: [['RARO', 100]],
  LENDARIO: [['LENDARIO', 100]],
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
// Loja Mística (melhoria D3): preços por raridade, valores do protótipo Figma
export const PRECO_RARIDADE: Record<Raridade, number> = { COMUM: 150, INCOMUM: 300, RARO: 450, EPICO: 1200, LENDARIO: 2500 };
export const DESCONTO_OFERTA = 0.3;

// Oferta do dia: um item do catálogo escolhido pela data (igual para o dia inteiro)
export function ofertaDoDia(data: Date = new Date()): ItemCatalogo {
  const semente = data.getFullYear() * 400 + data.getMonth() * 31 + data.getDate();
  return CATALOGO[semente % CATALOGO.length];
}

export function precoItem(item: ItemCatalogo, data: Date = new Date()): number {
  const base = PRECO_RARIDADE[item.raridade];
  return ofertaDoDia(data).id === item.id ? Math.round(base * (1 - DESCONTO_OFERTA)) : base;
}

/** Texto curto com os 4 atributos do item (só os que existem): "⚔ +3 força  ❤ +6 vida  🛡 +4 armadura  ⚡ +2 agilidade". */
export function textoAtributos(i: { bonusForca: number; bonusVida: number; bonusArmadura?: number; bonusAgilidade?: number }): string {
  return [
    i.bonusForca > 0 && `⚔ +${i.bonusForca} força`,
    i.bonusVida > 0 && `❤ +${i.bonusVida} vida`,
    (i.bonusArmadura ?? 0) > 0 && `🛡 +${i.bonusArmadura} armadura`,
    (i.bonusAgilidade ?? 0) > 0 && `⚡ +${i.bonusAgilidade} agilidade`,
  ]
    .filter(Boolean)
    .join('  ');
}
