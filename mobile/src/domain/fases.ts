export type FaseCatalogo = {
  numero: number;
  nome: string;
  descricao: string;
  metaDistanciaMetros: number;
  chefe: { nome: string; vidaMaxima: number; emoji: string };
  monstro: { nome: string; emoji: string }; // inimigo comum da esteira idle
  cenario: { ceu: string; horizonte: string; chao: string };
};

// Nomes e descrições do "Mapa Mundi" do Figma (D10). Metas e vida dos chefes mantidas.
export const FASES: FaseCatalogo[] = [
  {
    numero: 1,
    nome: 'Bosque de Hermes',
    descricao: 'Um local tranquilo onde novos heróis começam sua jornada.',
    metaDistanciaMetros: 2000,
    chefe: { nome: 'Ciclope', vidaMaxima: 30, emoji: '👹' },
    monstro: { nome: 'Javali', emoji: '🐗' },
    cenario: { ceu: '#1E3A5F', horizonte: '#2F6B4F', chao: '#4D7C0F' },
  },
  {
    numero: 2,
    nome: 'Montanhas de Prata',
    descricao: 'Picos nevados guardados por harpias famintas.',
    metaDistanciaMetros: 4000,
    chefe: { nome: 'Harpia Rainha', vidaMaxima: 70, emoji: '🦅' },
    monstro: { nome: 'Morcego', emoji: '🦇' },
    cenario: { ceu: '#334155', horizonte: '#94A3B8', chao: '#64748B' },
  },
  {
    numero: 3,
    nome: 'Deserto de Hélio',
    descricao: 'Areias escaldantes que testam a resistência de qualquer corredor.',
    metaDistanciaMetros: 6000,
    chefe: { nome: 'Minotauro', vidaMaxima: 120, emoji: '🐂' },
    monstro: { nome: 'Escorpião', emoji: '🦂' },
    cenario: { ceu: '#7C2D12', horizonte: '#C2410C', chao: '#CA8A04' },
  },
  {
    numero: 4,
    nome: 'Ruínas de Atenas',
    descricao: 'Templos antigos repletos de sabedoria e fantasmas do passado.',
    metaDistanciaMetros: 8000,
    chefe: { nome: 'Medusa', vidaMaxima: 180, emoji: '🐍' },
    monstro: { nome: 'Esqueleto', emoji: '💀' },
    cenario: { ceu: '#312E81', horizonte: '#6D28D9', chao: '#78716C' },
  },
  {
    numero: 5,
    nome: 'Abismo de Poseidon',
    descricao: 'Profundezas oceânicas onde a pressão é o menor dos seus problemas.',
    metaDistanciaMetros: 10000,
    chefe: { nome: 'Hidra', vidaMaxima: 250, emoji: '🐉' },
    monstro: { nome: 'Caranguejo', emoji: '🦀' },
    cenario: { ceu: '#082F49', horizonte: '#0E7490', chao: '#155E75' },
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