// RF11 / RF29: aparência do avatar (separada dos atributos de combate).
export type Genero = 'MASCULINO' | 'FEMININO' | 'NEUTRO';

// 3 estilos masculinos + 3 femininos. CURTO, LONGO e RASPADO são os valores antigos (compatíveis).
export type Cabelo = 'CURTO' | 'ESPETADO' | 'RASPADO' | 'LONGO' | 'RABO_DE_CAVALO' | 'COQUE';
export type DetalheRoupa = 'SIMPLES' | 'FAIXA' | 'CAPA';

export const GENEROS: { valor: Genero; rotulo: string }[] = [
  { valor: 'MASCULINO', rotulo: 'Masculino' },
  { valor: 'FEMININO', rotulo: 'Feminino' },
  { valor: 'NEUTRO', rotulo: 'Neutro' },
];

export const CABELOS_MASCULINOS: { valor: Cabelo; rotulo: string }[] = [
  { valor: 'CURTO', rotulo: 'Curto' },
  { valor: 'ESPETADO', rotulo: 'Espetado' },
  { valor: 'RASPADO', rotulo: 'Raspado' },
];
export const CABELOS_FEMININOS: { valor: Cabelo; rotulo: string }[] = [
  { valor: 'LONGO', rotulo: 'Longo' },
  { valor: 'RABO_DE_CAVALO', rotulo: 'Rabo de cavalo' },
  { valor: 'COQUE', rotulo: 'Coque' },
];
export const CABELOS = [...CABELOS_MASCULINOS, ...CABELOS_FEMININOS];

/** Estilos oferecidos para o gênero escolhido (neutro vê os seis). */
export function cabelosDoGenero(g: Genero) {
  if (g === 'MASCULINO') return CABELOS_MASCULINOS;
  if (g === 'FEMININO') return CABELOS_FEMININOS;
  return CABELOS;
}

export const DETALHES_ROUPA: { valor: DetalheRoupa; rotulo: string }[] = [
  { valor: 'SIMPLES', rotulo: 'Simples' },
  { valor: 'FAIXA', rotulo: 'Faixa dourada' },
  { valor: 'CAPA', rotulo: 'Capa' },
];

export const TONS_PELE = ['#FBE0C3', '#F1C27D', '#C68642', '#8D5524', '#5C3A21'];
export const CORES_ROUPA = ['#F97316', '#FACC15', '#22C55E', '#3B82F6', '#A855F7', '#EF4444'];
// Preto, castanho escuro, castanho, ruivo, loiro e grisalho
export const CORES_CABELO = ['#1F1B18', '#3B2314', '#7A4A21', '#A33A2A', '#E3B862', '#B8B8B8'];
export const COR_CABELO = CORES_CABELO[1]; // padrão

/** Escurece uma cor #RRGGBB (sombras do pixel art). */
export function escurecer(hex: string, fator = 0.65): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * fator)));
  const r = c((n >> 16) & 255);
  const g = c((n >> 8) & 255);
  const b = c(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
