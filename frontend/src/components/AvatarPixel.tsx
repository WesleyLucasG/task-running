export interface AparenciaDTO {
  genero: string;
  cabelo: string;
  corCabelo: string;
  corPele: string;
  corRoupa: string;
  detalheRoupa: string;
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
  const cab = aparencia.corCabelo || '#3d2b1f';
  const rou = aparencia.corRoupa || '#3b82f6';
  const fem = aparencia.genero === 'FEMININO';
  const semCabelo = aparencia.cabelo === 'RASPADO';
  const longo = ['LONGO', 'RABO_DE_CAVALO', 'COQUE'].includes(aparencia.cabelo);
  const espetado = aparencia.cabelo === 'ESPETADO';

  const h = Math.round(size * (42 / 32));

  return (
    <svg
      viewBox="0 0 32 42"
      width={size}
      height={h}
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', display: 'block' }}
    >
      {/* Espetado spikes */}
      {espetado && (
        <>
          <rect x="7"  y="0" width="2" height="5" fill={cab} />
          <rect x="11" y="-1" width="2" height="6" fill={cab} />
          <rect x="15" y="-1" width="2" height="6" fill={cab} />
          <rect x="19" y="0" width="2" height="5" fill={cab} />
          <rect x="23" y="1" width="2" height="4" fill={cab} />
        </>
      )}
      {/* Topo do cabelo */}
      {!semCabelo && <rect x="6" y="2" width="20" height="5" rx="2" fill={cab} />}
      {/* Laterais do cabelo longo */}
      {longo && (
        <>
          <rect x="3" y="6" width="4" height="14" rx="2" fill={cab} />
          <rect x="25" y="6" width="4" height="14" rx="2" fill={cab} />
        </>
      )}
      {/* Cabeça */}
      <rect x="5" y="5" width="22" height="18" rx="3" fill={pele} />
      {/* Olhos */}
      <rect x="10" y="11" width="3" height="3" rx="1" fill="#1a1a2e" />
      <rect x="19" y="11" width="3" height="3" rx="1" fill="#1a1a2e" />
      {/* Boca */}
      <rect x="12" y="17" width="8" height="2" rx="1" fill={fem ? '#e07090' : '#a04030'} />
      {/* Pescoço */}
      <rect x="13" y="23" width="6" height="4" fill={pele} />
      {/* Corpo */}
      <rect
        x={fem ? 8 : 5}
        y="27"
        width={fem ? 16 : 22}
        height="11"
        rx="2"
        fill={rou}
      />
      {/* Braços */}
      <rect x="0"  y="27" width="6" height="9" rx="2" fill={rou} />
      <rect x="26" y="27" width="6" height="9" rx="2" fill={rou} />
      {/* Mãos */}
      <rect x="1"  y="34" width="5" height="5" rx="2" fill={pele} />
      <rect x="26" y="34" width="5" height="5" rx="2" fill={pele} />
      {/* Pernas */}
      <rect x="8"  y="38" width="7" height="4" rx="1" fill="#2d3748" />
      <rect x="17" y="38" width="7" height="4" rx="1" fill="#2d3748" />
    </svg>
  );
}
