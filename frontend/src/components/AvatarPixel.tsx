/**
 * Porta exata do avatar pixel art do mobile (mobile/src/domain/avatarBlocos.ts).
 * Grade 12 × 18. Renderiza as mesmas camadas/cores via SVG rect.
 */
import { useMemo } from 'react';

export interface AparenciaDTO {
  genero: string;
  cabelo: string;
  corCabelo: string;
  corPele: string;
  corRoupa: string;
  detalheRoupa: string;
}

// ─── constants (mobile/src/domain/avatar.ts) ─────────────────────────────────
const OURO       = '#FACC15';
const OURO_ESCURO = '#B45309';
const OLHO       = '#0F172A';
const SANDALIA   = '#92400E';
const COR_CABELO_DEFAULT = '#3B2314';

function escurecer(hex: string, fator = 0.65): string {
  if (!hex || !hex.startsWith('#')) return hex || '#888';
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * fator)));
  const r = c((n >> 16) & 255);
  const g = c((n >> 8) & 255);
  const b = c(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

type Bloco = [x: number, y: number, w: number, h: number, cor: string];

// ─── blocosAvatar (porta de mobile/src/domain/avatarBlocos.ts) ────────────────
function blocosAvatar(
  genero: string,
  cabelo: string,
  corPele: string,
  corRoupa: string,
  corCabelo: string,
  detalheRoupa: string,
): Bloco[] {
  const sombraPele   = escurecer(corPele,   0.8);
  const sombraRoupa  = escurecer(corRoupa);
  const sombraCabelo = escurecer(corCabelo, 0.7);
  const feminino     = genero?.toUpperCase() === 'FEMININO';

  // Normaliza detalheRoupa (backend pode salvar 'FAIXA' ou 'FAIXA_DOURADA')
  const det = (detalheRoupa || 'SIMPLES').replace('FAIXA_DOURADA', 'FAIXA').toUpperCase();

  // ── FUNDO (capa e cabelo traseiro) ────────────────────────────────────────
  const fundo: Bloco[] = [];
  if (det === 'CAPA') {
    fundo.push([1, 7, 10, 7, '#991B1B'], [1, 13, 2, 1, '#7F1D1D'], [9, 13, 2, 1, '#7F1D1D']);
  }
  if (cabelo === 'LONGO')           fundo.push([2, 2, 8, 9, sombraCabelo]);
  if (cabelo === 'RABO_DE_CAVALO')  fundo.push([9, 2, 2, 2, corCabelo], [10, 4, 2, 4, corCabelo], [10, 8, 1, 2, sombraCabelo]);
  if (cabelo === 'COQUE')           fundo.push([4, 0, 4, 2, corCabelo], [5, 0, 2, 1, sombraCabelo]);

  // ── CORPO ─────────────────────────────────────────────────────────────────
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
    [2, 11, 1, 1, OURO],  // braceletes
    [9, 11, 1, 1, OURO],
    // pescoço e cabeça
    [5, 6, 2, 1, sombraPele],
    [3, 2, 6, 5, corPele],
    [4, 4, 1, 1, OLHO],
    [7, 4, 1, 1, OLHO],
    [5, 6, 2, 1, escurecer(corPele, 0.7)],
  ];

  // ── ROUPA ─────────────────────────────────────────────────────────────────
  const roupa: Bloco[] = [
    [3, 7, 6, 5, corRoupa],                            // túnica
    [3, 7, 6, 1, sombraRoupa],
    feminino ? [2, 11, 8, 3, corRoupa] : [3, 11, 6, 2, corRoupa],   // saia / barra
    feminino ? [2, 13, 8, 1, sombraRoupa] : [3, 12, 6, 1, sombraRoupa],
    [2, 7, 1, 1, OURO],                                // ombreiras
    [9, 7, 1, 1, OURO],
    [3, 10, 6, 1, OURO_ESCURO],                        // cinto
  ];
  if (det === 'FAIXA') roupa.push([4, 7, 1, 1, OURO], [5, 8, 1, 1, OURO], [6, 9, 1, 1, OURO], [7, 10, 1, 1, OURO]);
  if (det === 'CAPA')  roupa.push([3, 7, 1, 1, '#B91C1C'], [8, 7, 1, 1, '#B91C1C']);

  // ── CABELO (frente) ───────────────────────────────────────────────────────
  const cabeloBlocos: Bloco[] = [];
  switch (cabelo) {
    case 'CURTO':
      cabeloBlocos.push([3, 1, 6, 2, corCabelo], [3, 3, 1, 1, corCabelo], [8, 3, 1, 1, corCabelo], [4, 1, 3, 1, sombraCabelo]);
      break;
    case 'ESPETADO':
      cabeloBlocos.push([3, 0, 1, 1, corCabelo], [5, 0, 1, 1, corCabelo], [7, 0, 1, 1, corCabelo]);
      cabeloBlocos.push([3, 1, 6, 2, corCabelo], [2, 2, 1, 2, corCabelo], [9, 2, 1, 2, corCabelo], [4, 2, 1, 1, sombraCabelo]);
      break;
    case 'RASPADO':
      cabeloBlocos.push([3, 1, 6, 1, sombraCabelo]);
      break;
    case 'LONGO':
      cabeloBlocos.push([3, 1, 6, 2, corCabelo], [2, 2, 1, 7, corCabelo], [9, 2, 1, 7, corCabelo], [3, 3, 1, 1, corCabelo]);
      break;
    case 'RABO_DE_CAVALO':
      cabeloBlocos.push([3, 1, 6, 2, corCabelo], [3, 3, 1, 1, corCabelo], [9, 3, 1, 1, '#DC2626']);
      break;
    case 'COQUE':
      cabeloBlocos.push([3, 1, 6, 2, corCabelo], [3, 3, 1, 1, corCabelo], [8, 3, 1, 1, corCabelo]);
      break;
  }
  if (feminino) cabeloBlocos.push([4, 1, 4, 1, OURO]); // diadema dourado

  return [...fundo, ...corpo, ...roupa, ...cabeloBlocos];
}

// ─── Componente ──────────────────────────────────────────────────────────────
export default function AvatarPixel({
  aparencia,
  size = 48,
}: {
  aparencia: AparenciaDTO | null;
  size?: number;
}) {
  const blocos = useMemo(() => {
    if (!aparencia) return null;
    return blocosAvatar(
      aparencia.genero      || 'NEUTRO',
      aparencia.cabelo      || 'CURTO',
      aparencia.corPele     || '#C68642',
      aparencia.corRoupa    || '#3B82F6',
      aparencia.corCabelo   || COR_CABELO_DEFAULT,
      aparencia.detalheRoupa || 'SIMPLES',
    );
  }, [aparencia]);

  if (!blocos) {
    return (
      <div
        style={{ width: size, height: Math.round(size * 1.5) }}
        className="flex items-center justify-center text-2xl"
      >
        🧙
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 12 18"
      width={size}
      height={Math.round(size * 1.5)}
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', display: 'block' }}
    >
      {blocos.map(([x, y, w, h, cor], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={cor} />
      ))}
    </svg>
  );
}
