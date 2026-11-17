// Tokens visuais extraídos do protótipo Figma (Task Running).
// Paleta: azul-marinho de fundo, laranja como ação principal, dourado como destaque.
export const cores = {
  fundo: '#0F172A',
  fundoProfundo: '#0B1120',
  superficie: '#1E293B',
  superficieAlta: '#273449',
  borda: '#334155',
  bordaClara: '#64748B',
  laranja: '#F97316',
  laranjaEscuro: '#9A3412',
  dourado: '#EAB308',
  douradoClaro: '#FACC15',
  douradoEscuro: '#854D0E',
  texto: '#F8FAFC',
  textoSuave: '#94A3B8',
  textoApagado: '#64748B',
  sombra: '#020617',
  erro: '#EF4444',
  sucesso: '#22C55E',
} as const;

export const espaco = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

// O Figma usa cantos retos (estilo pixel art)
export const raio = { sm: 2, md: 2, lg: 4, pilula: 999 } as const;

export const fontes = {
  pixel: 'PressStart2P_400Regular', // títulos e CTAs principais
  mono: 'SpaceMono_400Regular', // rótulos em caixa alta ("NOME DO AVENTUREIRO")
  monoNegrito: 'SpaceMono_700Bold',
  texto: 'DMSans_400Regular', // corpo de texto
  textoMedio: 'DMSans_500Medium',
  textoNegrito: 'DMSans_700Bold',
} as const;

// Deslocamento da "sombra dura" usada em botões e cartões do Figma
export const SOMBRA_PIXEL = 4;
