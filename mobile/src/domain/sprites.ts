// Pixel art ORIGINAL do Task Running (inimigos, chefes e cenário por fase).
// Cada sprite é uma grade de caracteres + paleta ('.' = transparente). Sem arquivos de imagem:
// leve para o Redmi Note 12 e compatível com o Expo Go. Função pura, testável no Node.

export type Sprite = { grade: string[]; paleta: Record<string, string> };

const javali: Sprite = {
  paleta: { H: '#3B2314', B: '#7A4A21', D: '#4A2E15', P: '#C08A5A', E: '#111111', T: '#F5F0DC' },
  grade: [
    '....HHHHH...',
    '...HBBBBBH..',
    '.PBBBBBBBBB.',
    'PPEBBBBBBBBD',
    'TPBBBBBBBBBD',
    'T.BBBBBBBBBD',
    '..BBDBBBDBBD',
    '..D.D...D.D.',
    '..D.D...D.D.',
  ],
};

const morcego: Sprite = {
  paleta: { W: '#6D28D9', B: '#2E1065', E: '#FDE047', F: '#F5F5F5' },
  grade: [
    'W..........W',
    'WW...BB...WW',
    'WWW.BEEB.WWW',
    'WWWWBBBBWWWW',
    '.WWWBFFBWWW.',
    '..WW.BB.WW..',
    '...W....W...',
  ],
};

const escorpiao: Sprite = {
  paleta: { O: '#C2410C', D: '#7C2D12', S: '#FACC15', E: '#111111' },
  grade: [
    '.......OO...',
    '........O...',
    '.......OS...',
    '......O.....',
    'OO..DOOOO...',
    'O.EOOOOOOOD.',
    'OOOOOOOOOD..',
    '.D.D.D.D.D..',
  ],
};

const esqueleto: Sprite = {
  paleta: { W: '#E5E7EB', G: '#9CA3AF', E: '#111827' },
  grade: [
    '...WWWW...',
    '..WEWWEW..',
    '..WWWWWW..',
    '...WGGW...',
    '....WW....',
    '.WWWWWWW..',
    'W.WGWGW.W.',
    '..WWWWW...',
    '...W..W...',
    '..WW..WW..',
  ],
};

const caranguejo: Sprite = {
  paleta: { R: '#DC2626', D: '#7F1D1D', E: '#111111', W: '#FFFFFF' },
  grade: [
    'R.R......R.R',
    'RR........RR',
    '.R..W..W..R.',
    '..RRERRERR..',
    '.RRRRRRRRRR.',
    'RRRDRRRRDRRR',
    '.R.R.R.R.R..',
  ],
};

const ciclope: Sprite = {
  paleta: { G: '#65A30D', D: '#3F6212', W: '#FFFFFF', E: '#111111', T: '#F5F0DC', B: '#78350F', C: '#A16207' },
  grade: [
    '....GGGGGG......',
    '...GGGGGGGG.....',
    '...GGWWWWGG.....',
    '...GWWEEWWG.....',
    '...GGWWWWGG..CC.',
    '...GGGTTGGG..CC.',
    '....GGGGGG...CC.',
    '..GGGGGGGGGG.CC.',
    '.GGGGGGGGGGGGB..',
    '.GG.GGGGGG.GGB..',
    '.GG.BBBBBB..B...',
    '....GGGGGG......',
    '....GG..GG......',
    '....GG..GG......',
    '...DDD..DDD.....',
  ],
};

const harpia: Sprite = {
  paleta: { F: '#7C3AED', S: '#FCD9B6', H: '#1F2937', Y: '#FACC15', E: '#111111', C: '#FACC15' },
  grade: [
    '......CCCC......',
    '.....HHHHHH.....',
    '.....HSSSSH.....',
    '.....HSESEH.....',
    'FF...HSSSSH...FF',
    'FFF...SSSS...FFF',
    'FFFF.FFFFFF.FFFF',
    '.FFFFFFFFFFFFFF.',
    '..FFFFFFFFFFFF..',
    '....FFFFFFFF....',
    '.....FFFFFF.....',
    '.....FF..FF.....',
    '.....Y....Y.....',
    '....YY....YY....',
  ],
};

const minotauro: Sprite = {
  paleta: { B: '#78350F', D: '#451A03', H: '#F5F0DC', R: '#DC2626', M: '#A8A29E', W: '#92400E', Y: '#FACC15' },
  grade: [
    'H............H..',
    'HH..BBBBBB..HH..',
    '.HHBBBBBBBBHH...',
    '...BRBBBBRB.....',
    '...BBBBBBBB.....',
    '....BYDDYB...MM.',
    '.....BBBB...MMM.',
    '..BBBBBBBBBB.W..',
    '.BBBBBBBBBBBBW..',
    '.BB.BBBBBB.BBW..',
    '.BB.DDDDDD...W..',
    '....BBBBBB......',
    '....BB..BB......',
    '...DDD..DDD.....',
  ],
};

const medusa: Sprite = {
  paleta: { S: '#16A34A', K: '#14532D', F: '#A7F3D0', E: '#FACC15', R: '#7C3AED', Y: '#FACC15' },
  grade: [
    '..S.S..S.S......',
    '.SSSSSSSSSS.....',
    'SKSSSSSSSSKS....',
    '.SSFFFFFFSS.....',
    '..SFEFFEFS......',
    '..SFFFFFFS......',
    '...FFRRFF.......',
    '..RRRYYRRR......',
    '.FRRRRRRRRF.....',
    '.F.RRRRRR.F.....',
    '...RRRRRR.......',
    '..RRRRRRRR......',
    '.RRRRRRRRRR.....',
    '..SSS..SSS......',
  ],
};

const hidra: Sprite = {
  paleta: { B: '#0E7490', D: '#164E63', G: '#67E8F9', E: '#FACC15', R: '#DC2626' },
  grade: [
    'BB.....BB.....BB',
    'BEB...BEBR..BEB.',
    'BBB...BBB...BBB.',
    '.BB....BB...BB..',
    '..BB...BB..BB...',
    '...BB..BB.BB....',
    '....BBBBBBBB....',
    '...BBGGGGGBBB...',
    '..BBGGGGGGGBBB..',
    '..BBGGGGGGGBBB..',
    '...BBBBBBBBBB...',
    '...DD..DD..DD...',
  ],
};

// Cenário (paralaxe da esteira): um elemento típico de cada bioma
const arvore: Sprite = {
  paleta: { F: '#15803D', L: '#22C55E', T: '#78350F' },
  grade: ['..FFF..', '.FLLFF.', 'FLLFFFF', 'FFFFLFF', '.FFFFF.', '...T...', '...T...', '..TTT..'],
};
const pinheiro: Sprite = {
  paleta: { N: '#F8FAFC', P: '#166534', T: '#57534E' },
  grade: ['...N...', '..NPN..', '..PPP..', '.NPPPN.', '.PPPPP.', 'NPPPPPN', '...T...', '...T...'],
};
const cacto: Sprite = {
  paleta: { C: '#4D7C0F', L: '#84CC16' },
  grade: ['..C....', '..CL..C', 'C.CL..C', 'C.CCCCC', 'CCCL...', '..CL...', '..CL...', '..CC...'],
};
const coluna: Sprite = {
  paleta: { M: '#E7E5E4', S: '#A8A29E' },
  grade: ['MMMMMMM', '.SMMMS.', '..MSM..', '..MSM..', '..MSM..', '..MSM..', '.SMMMS.', 'MMMMMMM'],
};
const alga: Sprite = {
  paleta: { A: '#0D9488', L: '#5EEAD4', C: '#F472B6' },
  grade: ['.A...A.', 'A.A.A.L', '.A..A..', 'A.A.LA.', '.L..A..', 'A.A.A.C', '.A..ACC', 'AAA.CCC'],
};

export const SPRITES_FASE: Record<number, { monstro: Sprite; chefe: Sprite; cenario: Sprite }> = {
  1: { monstro: javali, chefe: ciclope, cenario: arvore },
  2: { monstro: morcego, chefe: harpia, cenario: pinheiro },
  3: { monstro: escorpiao, chefe: minotauro, cenario: cacto },
  4: { monstro: esqueleto, chefe: medusa, cenario: coluna },
  5: { monstro: caranguejo, chefe: hidra, cenario: alga },
};

export type Retangulo = [x: number, y: number, w: number, h: number, cor: string];

/** Converte a grade em retângulos, juntando pixels vizinhos da mesma cor na linha (menos Views). */
export function retangulos(s: Sprite, cinza = false): Retangulo[] {
  const saida: Retangulo[] = [];
  s.grade.forEach((linha, y) => {
    let x = 0;
    while (x < linha.length) {
      const ch = linha[x];
      if (ch === '.' || !s.paleta[ch]) {
        x++;
        continue;
      }
      let w = 1;
      while (x + w < linha.length && linha[x + w] === ch) w++;
      saida.push([x, y, w, 1, cinza ? emCinza(s.paleta[ch]) : s.paleta[ch]]);
      x += w;
    }
  });
  return saida;
}

export function largura(s: Sprite): number {
  return Math.max(...s.grade.map((l) => l.length));
}

/** Chefe bloqueado aparece em tons de cinza. */
export function emCinza(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const l = Math.round(0.3 * ((n >> 16) & 255) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255));
  const v = Math.round(l * 0.6 + 30);
  return `#${((1 << 24) | (v << 16) | (v << 8) | v).toString(16).slice(1)}`;
}
