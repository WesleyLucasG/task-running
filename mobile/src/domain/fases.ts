export type FaseCatalogo = {
  numero: number;
  nome: string;
  descricao: string;
  metaDistanciaMetros: number;
  chefe: { nome: string; vidaMaxima: number; emoji: string };
};

// Nomes provisórios: serão ajustados com as telas do Figma
export const FASES: FaseCatalogo[] = [
  {
    numero: 1,
    nome: 'Trilha da Aurora',
    descricao: 'Os primeiros passos da sua jornada, entre névoa e luz da manhã.',
    metaDistanciaMetros: 2000,
    chefe: { nome: 'Lobo da Neblina', vidaMaxima: 30, emoji: '🐺' },
  },
  {
    numero: 2,
    nome: 'Floresta Sussurrante',
    descricao: 'Árvores antigas escondem criaturas que testam a sua constância.',
    metaDistanciaMetros: 4000,
    chefe: { nome: 'Aranha Gigante', vidaMaxima: 70, emoji: '🕷️' },
  },
  {
    numero: 3,
    nome: 'Desfiladeiro de Pedra',
    descricao: 'Um caminho estreito entre montanhas, guardado por gigantes.',
    metaDistanciaMetros: 6000,
    chefe: { nome: 'Golem de Pedra', vidaMaxima: 120, emoji: '🗿' },
  },
  {
    numero: 4,
    nome: 'Deserto das Miragens',
    descricao: 'Calor, areia e ilusões. Só quem tem fôlego atravessa.',
    metaDistanciaMetros: 8000,
    chefe: { nome: 'Serpente das Dunas', vidaMaxima: 180, emoji: '🐍' },
  },
  {
    numero: 5,
    nome: 'Pico do Trovão',
    descricao: 'O topo do mundo, onde as tempestades nascem.',
    metaDistanciaMetros: 10000,
    chefe: { nome: 'Dragão do Trovão', vidaMaxima: 250, emoji: '🐉' },
  },
];

export function fasePorNumero(numero: number): FaseCatalogo | undefined {
  return FASES.find((f) => f.numero === numero);
}

// RN12: o divisor 10 é o valor canônico do projeto
export function calcularDano(
  forcaBase: number,
  bonusItens: number,
  maiorDistanciaKm: number,
): number {
  return Math.max(1, Math.floor((forcaBase + bonusItens) * (1 + maiorDistanciaKm / 10)));
}