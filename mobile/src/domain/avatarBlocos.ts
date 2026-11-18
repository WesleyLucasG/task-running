// Blocos do avatar em pixel art (grade 12 x 18), em camadas: fundo, corpo, roupa, cabelo.
// Função pura: usada pelo componente AvatarPixel e pelo script de pré-visualização.
import { COR_CABELO, escurecer } from './avatar';
import type { Cabelo, DetalheRoupa, Genero } from './avatar';

export type AparenciaAvatar = {
  genero: Genero;
  cabelo: Cabelo;
  corPele: string;
  corRoupa: string;
  corCabelo?: string;
  detalheRoupa?: DetalheRoupa;
};

const OURO = '#FACC15';
const OURO_ESCURO = '#B45309';
const OLHO = '#0F172A';
const SANDALIA = '#92400E';

export type Bloco = [x: number, y: number, w: number, h: number, cor: string];

// Herói em pixel art montado em CAMADAS (fundo → corpo → roupa → cabelo), na grade 12 x 18.
// Inspirado na referência dos guerreiros gregos (túnica, ombreiras douradas, sandálias).
// Combinar camadas evita ter uma imagem para cada combinação de gênero/cabelo/cor.
export function blocosAvatar({
  genero,
  cabelo,
  corPele,
  corRoupa,
  corCabelo = COR_CABELO,
  detalheRoupa = 'SIMPLES',
}: AparenciaAvatar): { fundo: Bloco[]; corpo: Bloco[]; roupa: Bloco[]; cabelo: Bloco[] } {
  const sombraPele = escurecer(corPele, 0.8);
  const sombraRoupa = escurecer(corRoupa);
  const sombraCabelo = escurecer(corCabelo, 0.7);
  const feminino = genero === 'FEMININO';

  const camadaFundo: Bloco[] = [];
  if (detalheRoupa === 'CAPA') camadaFundo.push([1, 7, 10, 7, '#991B1B'], [1, 13, 2, 1, '#7F1D1D'], [9, 13, 2, 1, '#7F1D1D']);
  if (cabelo === 'LONGO') camadaFundo.push([2, 2, 8, 9, sombraCabelo]);
  if (cabelo === 'RABO_DE_CAVALO') camadaFundo.push([9, 2, 2, 2, corCabelo], [10, 4, 2, 4, corCabelo], [10, 8, 1, 2, sombraCabelo]);
  if (cabelo === 'COQUE') camadaFundo.push([4, 0, 4, 2, corCabelo], [5, 0, 2, 1, sombraCabelo]);

  const corpo: Bloco[] = [
    // pernas e sandálias
    [3, 13, 2, 4, corPele],
    [7, 13, 2, 4, corPele],
    [3, 15, 2, 1, sombraPele],
    [7, 15, 2, 1, sombraPele],
    [3, 17, 2, 1, SANDALIA],
    [7, 17, 2, 1, SANDALIA],
    // braços
    [2, 8, 1, 4, corPele],
    [9, 8, 1, 4, corPele],
    [2, 11, 1, 1, OURO], // braceletes
    [9, 11, 1, 1, OURO],
    // pescoço e cabeça
    [5, 6, 2, 1, sombraPele],
    [3, 2, 6, 5, corPele],
    [4, 4, 1, 1, OLHO],
    [7, 4, 1, 1, OLHO],
    [5, 6, 2, 1, escurecer(corPele, 0.7)],
  ];

  const roupa: Bloco[] = [
    [3, 7, 6, 5, corRoupa], // túnica
    [3, 7, 6, 1, sombraRoupa],
    feminino ? [2, 11, 8, 3, corRoupa] : [3, 11, 6, 2, corRoupa], // saia / barra da túnica
    feminino ? [2, 13, 8, 1, sombraRoupa] : [3, 12, 6, 1, sombraRoupa],
    [2, 7, 1, 1, OURO], // ombreiras
    [9, 7, 1, 1, OURO],
    [3, 10, 6, 1, OURO_ESCURO], // cinto
  ];
  if (detalheRoupa === 'FAIXA') roupa.push([4, 7, 1, 1, OURO], [5, 8, 1, 1, OURO], [6, 9, 1, 1, OURO], [7, 10, 1, 1, OURO]);
  if (detalheRoupa === 'CAPA') roupa.push([3, 7, 1, 1, '#B91C1C'], [8, 7, 1, 1, '#B91C1C']);

  const cabeloFrente: Bloco[] = [];
  switch (cabelo) {
    case 'CURTO':
      cabeloFrente.push([3, 1, 6, 2, corCabelo], [3, 3, 1, 1, corCabelo], [8, 3, 1, 1, corCabelo], [4, 1, 3, 1, sombraCabelo]);
      break;
    case 'ESPETADO':
      cabeloFrente.push([3, 0, 1, 1, corCabelo], [5, 0, 1, 1, corCabelo], [7, 0, 1, 1, corCabelo]);
      cabeloFrente.push([3, 1, 6, 2, corCabelo], [2, 2, 1, 2, corCabelo], [9, 2, 1, 2, corCabelo], [4, 2, 1, 1, sombraCabelo]);
      break;
    case 'RASPADO':
      cabeloFrente.push([3, 1, 6, 1, sombraCabelo]);
      break;
    case 'LONGO':
      cabeloFrente.push([3, 1, 6, 2, corCabelo], [2, 2, 1, 7, corCabelo], [9, 2, 1, 7, corCabelo], [3, 3, 1, 1, corCabelo]);
      break;
    case 'RABO_DE_CAVALO':
      cabeloFrente.push([3, 1, 6, 2, corCabelo], [3, 3, 1, 1, corCabelo], [9, 3, 1, 1, '#DC2626']); // laço
      break;
    case 'COQUE':
      cabeloFrente.push([3, 1, 6, 2, corCabelo], [3, 3, 1, 1, corCabelo], [8, 3, 1, 1, corCabelo]);
      break;
  }
  if (feminino) cabeloFrente.push([4, 1, 4, 1, OURO]); // diadema dourado da referência

  return { fundo: camadaFundo, corpo, roupa, cabelo: cabeloFrente };
}
