export interface AparenciaDTO {
  genero: string;
  cabelo: string;
  corCabelo: string;
  corPele: string;
  corRoupa: string;
  detalheRoupa: string;
}

function isFeminino(g: string) { return g?.toUpperCase() === 'FEMININO'; }

function HairTop({ cab, cabelo, espetado, semCabelo, longo }: {
  cab: string; cabelo: string; espetado: boolean; semCabelo: boolean; longo: boolean;
}) {
  if (semCabelo) return null;
  return (
    <>
      {/* Topo plano */}
      <rect x="6" y="2" width="20" height="5" rx="2" fill={cab} />
      {/* Cabelo espetado */}
      {espetado && (
        <>
          <rect x="8"  y="-1" width="2" height="5" fill={cab} />
          <rect x="12" y="-2" width="2" height="6" fill={cab} />
          <rect x="16" y="-2" width="2" height="6" fill={cab} />
          <rect x="20" y="-1" width="2" height="5" fill={cab} />
        </>
      )}
      {/* Laterais: longo + rabo_de_cavalo + coque */}
      {longo && (
        <>
          <rect x="3" y="6" width="4" height="16" rx="2" fill={cab} />
          <rect x="25" y="6" width="4" height="16" rx="2" fill={cab} />
        </>
      )}
      {/* Rabo de cavalo */}
      {cabelo === 'RABO_DE_CAVALO' && (
        <rect x="26" y="12" width="4" height="10" rx="2" fill={cab} />
      )}
      {/* Coque */}
      {cabelo === 'COQUE' && (
        <ellipse cx="16" cy="2" rx="5" ry="4" fill={cab} />
      )}
    </>
  );
}

function FemBody({ rou, pele }: { rou: string; pele: string }) {
  return (
    <>
      {/* Pescoço */}
      <rect x="13" y="23" width="6" height="4" fill={pele} />
      {/* Torso */}
      <rect x="10" y="27" width="12" height="7" rx="1" fill={rou} />
      {/* Saia (mais larga) */}
      <rect x="5" y="33" width="22" height="9" rx="3" fill={rou} />
      {/* Braços */}
      <rect x="2" y="27" width="8" height="8" rx="3" fill={rou} />
      <rect x="22" y="27" width="8" height="8" rx="3" fill={rou} />
      {/* Mãos */}
      <rect x="2" y="34" width="6" height="5" rx="2" fill={pele} />
      <rect x="24" y="34" width="6" height="5" rx="2" fill={pele} />
      {/* Sapatos embaixo da saia */}
      <rect x="8"  y="41" width="6" height="3" rx="1" fill="#1a1a2e" />
      <rect x="18" y="41" width="6" height="3" rx="1" fill="#1a1a2e" />
    </>
  );
}

function MascBody({ rou, pele }: { rou: string; pele: string }) {
  return (
    <>
      {/* Pescoço */}
      <rect x="13" y="23" width="6" height="4" fill={pele} />
      {/* Torso largo */}
      <rect x="5" y="27" width="22" height="11" rx="2" fill={rou} />
      {/* Braços */}
      <rect x="0" y="27" width="6" height="9" rx="2" fill={rou} />
      <rect x="26" y="27" width="6" height="9" rx="2" fill={rou} />
      {/* Mãos */}
      <rect x="1"  y="34" width="5" height="5" rx="2" fill={pele} />
      <rect x="26" y="34" width="5" height="5" rx="2" fill={pele} />
      {/* Calças */}
      <rect x="6"  y="38" width="8" height="6" rx="1" fill="#2d3748" />
      <rect x="18" y="38" width="8" height="6" rx="1" fill="#2d3748" />
    </>
  );
}

export default function AvatarPixel({
  aparencia,
  size = 48,
}: {
  aparencia: AparenciaDTO | null;
  size?: number;
}) {
  if (!aparencia) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center text-3xl"
      >
        🧙
      </div>
    );
  }

  const pele = aparencia.corPele || '#c68642';
  const cab  = aparencia.corCabelo || '#3d2b1f';
  const rou  = aparencia.corRoupa || '#3b82f6';
  const fem  = isFeminino(aparencia.genero);
  const cabelo = aparencia.cabelo || 'CURTO';
  const semCabelo = cabelo === 'RASPADO';
  const longo     = ['LONGO', 'RABO_DE_CAVALO', 'COQUE'].includes(cabelo);
  const espetado  = cabelo === 'ESPETADO';

  const h = Math.round(size * (44 / 32));

  return (
    <svg
      viewBox="0 0 32 44"
      width={size}
      height={h}
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', display: 'block' }}
    >
      {/* ── CABELO ATRÁS DA CABEÇA ── */}
      <HairTop cab={cab} cabelo={cabelo} espetado={espetado} semCabelo={semCabelo} longo={longo} />

      {/* ── CABEÇA ── */}
      <rect x="5" y="5" width="22" height="18" rx="3" fill={pele} />

      {/* ── CÍLIOS (só feminino) ── */}
      {fem && (
        <>
          <rect x="9"  y="9" width="6" height="1" fill="#111" />
          <rect x="17" y="9" width="6" height="1" fill="#111" />
          <rect x="9"  y="8" width="1" height="2" fill="#111" />
          <rect x="14" y="8" width="1" height="2" fill="#111" />
          <rect x="17" y="8" width="1" height="2" fill="#111" />
          <rect x="22" y="8" width="1" height="2" fill="#111" />
        </>
      )}

      {/* ── OLHOS ── */}
      <rect x="10" y="11" width="4" height={fem ? 4 : 3} rx="1" fill="#1a1a2e" />
      <rect x="18" y="11" width="4" height={fem ? 4 : 3} rx="1" fill="#1a1a2e" />
      {/* Brilho nos olhos */}
      <rect x="11" y="11" width="1" height="1" fill="#fff" />
      <rect x="19" y="11" width="1" height="1" fill="#fff" />

      {/* ── BOCHECHA (feminino) ── */}
      {fem && (
        <>
          <rect x="7"  y="16" width="3" height="2" rx="1" fill={pele} opacity="0" />
        </>
      )}

      {/* ── BOCA ── */}
      <rect x="12" y="17" width="8" height="2" rx="1" fill={fem ? '#e06080' : '#a04030'} />
      {fem && <rect x="13" y="17" width="6" height="1" rx="0" fill="#f090a8" />}

      {/* ── CORPO ── */}
      {fem
        ? <FemBody rou={rou} pele={pele} />
        : <MascBody rou={rou} pele={pele} />
      }
    </svg>
  );
}
