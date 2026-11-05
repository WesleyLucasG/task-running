export type Genero = 'MASCULINO' | 'FEMININO' | 'NEUTRO';
export type Cabelo = 'CURTO' | 'LONGO' | 'RASPADO';

export const GENEROS: { valor: Genero; rotulo: string }[] = [
  { valor: 'MASCULINO', rotulo: 'Masculino' },
  { valor: 'FEMININO', rotulo: 'Feminino' },
  { valor: 'NEUTRO', rotulo: 'Neutro' },
];

export const CABELOS: { valor: Cabelo; rotulo: string }[] = [
  { valor: 'CURTO', rotulo: 'Curto' },
  { valor: 'LONGO', rotulo: 'Longo' },
  { valor: 'RASPADO', rotulo: 'Raspado' },
];

export const TONS_PELE = ['#FBE0C3', '#F1C27D', '#C68642', '#8D5524', '#5C3A21'];
export const CORES_ROUPA = ['#F97316', '#FACC15', '#22C55E', '#3B82F6', '#A855F7', '#EF4444'];
export const COR_CABELO = '#3B2314';