import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Ruler, Clock, Loader2 } from 'lucide-react';
import api from '../services/api';

try {
  delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
} catch {
  // already set
}

interface PontoGps {
  id: number;
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface AtividadeDetalhe {
  id: number;
  distanciaMetros: number;
  duracaoSegundos: number;
  tipoAtividade: string;
  dataInicio: string;
  pontosGps: PontoGps[];
}

function formatDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

export default function LastRunMap() {
  const [atividade, setAtividade] = useState<AtividadeDetalhe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const listRes = await api.get('/api/atividades', { params: { pagina: 0, tamanho: 1 } });
        const content: { id: number }[] = listRes.data?.content ?? (Array.isArray(listRes.data) ? listRes.data : []);
        if (content.length > 0) {
          const detRes = await api.get(`/api/atividades/${content[0].id}`);
          setAtividade(detRes.data);
        }
      } catch {
        // fail silently — map is optional
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #090f1a 0%, #0d1525 100%)',
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-navy-600 overflow-hidden" style={cardStyle}>
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-game-cyan/50 to-transparent" />
        <div className="flex items-center justify-center h-48">
          <Loader2 size={24} className="text-game-cyan animate-spin" />
        </div>
      </div>
    );
  }

  if (!atividade) {
    return (
      <div className="rounded-2xl border border-navy-600 overflow-hidden" style={cardStyle}>
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-game-cyan/50 to-transparent" />
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-game-cyan/15 border border-cyan-500/20 flex items-center justify-center">
              <MapPin size={14} className="text-game-cyan" />
            </div>
            <span className="text-xs font-black tracking-widest uppercase text-white">Última Corrida</span>
          </div>
          <div className="h-32 flex flex-col items-center justify-center gap-2">
            <MapPin size={28} className="text-navy-600" />
            <p className="text-slate-600 text-xs font-bold tracking-widest uppercase">Sem corridas ainda</p>
            <p className="text-slate-700 text-[10px]">Registre atividades no mobile</p>
          </div>
        </div>
      </div>
    );
  }

  const positions: [number, number][] =
    atividade.pontosGps?.map((p) => [p.latitude, p.longitude]) ?? [];
  const center: [number, number] =
    positions.length > 0
      ? positions[Math.floor(positions.length / 2)]
      : [-23.5505, -46.6333];

  return (
    <div className="rounded-2xl border border-navy-600 overflow-hidden" style={cardStyle}>
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-game-cyan/50 to-transparent" />
      <div className="p-4 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-game-cyan/15 border border-cyan-500/20 flex items-center justify-center">
            <MapPin size={14} className="text-game-cyan" />
          </div>
          <span className="text-xs font-black tracking-widest uppercase text-white">Última Corrida</span>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <Ruler size={12} className="text-game-cyan" />
            <span className="text-game-cyan font-black text-sm tabular-nums">
              {(atividade.distanciaMetros / 1000).toFixed(2)}
            </span>
            <span className="text-slate-500 text-[10px]">km</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-slate-400" />
            <span className="text-slate-300 font-black text-sm">
              {formatDuration(atividade.duracaoSegundos)}
            </span>
          </div>
        </div>
      </div>
      <div className="h-[220px] relative">
        {positions.length > 0 ? (
          <MapContainer
            center={center}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polyline
              positions={positions}
              pathOptions={{ color: '#f97316', weight: 3, opacity: 0.9 }}
            />
            {positions.length > 0 && (
              <Marker position={positions[0]}>
                <Popup>Início</Popup>
              </Marker>
            )}
            {positions.length > 1 && (
              <Marker position={positions[positions.length - 1]}>
                <Popup>Fim</Popup>
              </Marker>
            )}
          </MapContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-slate-600 text-xs font-bold tracking-widest uppercase">
              Sem dados GPS
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
