import { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Clock,
  Flame,
  TrendingUp,
  Ruler,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api, { getApiError } from '../services/api';

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface PontoGps {
  id: number;
  latitude: number;
  longitude: number;
  altitude: number;
  timestamp: string;
}

interface Atividade {
  id: number;
  identificadorLocal: string;
  tipoAtividade: string;
  status: string;
  dataInicio: string;
  dataFim: string;
  duracaoSegundos: number;
  distanciaMetros: number;
  calorias: number;
  paceMedio: number;
  pontosGps: PontoGps[];
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}min`;
  return `${m}min ${s.toString().padStart(2, '0')}s`;
}

function formatPace(pace: number): string {
  if (!pace || pace === 0) return '--';
  const min = Math.floor(pace);
  const sec = Math.round((pace - min) * 60);
  return `${min}:${sec.toString().padStart(2, '0')}/km`;
}

export default function Atividades() {
  const [idInput, setIdInput] = useState('1');
  const [atividade, setAtividade] = useState<Atividade | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarAtividade = async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setAtividade(null);
    try {
      const { data } = await api.get(`/api/atividades/${id}`);
      setAtividade(data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarAtividade('1');
  }, []);

  const positions: [number, number][] = atividade?.pontosGps?.map((p) => [p.latitude, p.longitude]) || [];
  const center: [number, number] = positions.length > 0 ? positions[Math.floor(positions.length / 2)] : [-23.5505, -46.6333];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-widest uppercase text-white">Atividades & Mapa</h1>
        <p className="text-slate-500 mt-1 text-sm">Consulte e analise seus treinos sincronizados</p>
      </div>

      {/* Search */}
      <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
        <div className="flex gap-3">
          <input
            type="number"
            value={idInput}
            onChange={(e) => setIdInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && buscarAtividade(idInput)}
            placeholder="ID da atividade..."
            min="1"
            className="flex-1 bg-navy-700 border border-navy-600 text-white placeholder-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/40 transition-colors font-medium"
          />
          <button
            onClick={() => buscarAtividade(idInput)}
            disabled={loading}
            className="bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-white font-bold tracking-widest uppercase text-xs px-5 py-3 rounded-xl transition-colors flex items-center gap-2 shadow-md shadow-orange-500/20"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            Buscar
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
          <AlertCircle size={20} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 size={40} className="text-brand-500 animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-bold tracking-widest uppercase">Carregando...</p>
          </div>
        </div>
      )}

      {/* Activity data */}
      {atividade && !loading && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Ruler, color: 'text-brand-500', label: 'Distância', value: `${(atividade.distanciaMetros / 1000).toFixed(2)}`, unit: 'km' },
              { icon: Clock, color: 'text-blue-400', label: 'Duração', value: formatDuration(atividade.duracaoSegundos), unit: '' },
              { icon: TrendingUp, color: 'text-purple-400', label: 'Pace médio', value: formatPace(atividade.paceMedio), unit: '' },
              { icon: Flame, color: 'text-amber-400', label: 'Calorias', value: `${atividade.calorias}`, unit: 'kcal' },
            ].map(({ icon: Icon, color, label, value, unit }) => (
              <div key={label} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={15} className={color} />
                  <span className="text-xs font-bold tracking-widest uppercase text-slate-500">{label}</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {value}
                  {unit && <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>}
                </p>
              </div>
            ))}
          </div>

          {/* Info row */}
          <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600 flex flex-wrap gap-6">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-1">Tipo</p>
              <span className="inline-flex items-center gap-1.5 bg-brand-500/10 text-brand-400 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-lg border border-brand-500/20">
                {atividade.tipoAtividade}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-1">Status</p>
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-lg border ${
                atividade.status === 'CONCLUIDA'
                  ? 'bg-brand-500/10 text-brand-400 border-brand-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {atividade.status}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-1">Início</p>
              <p className="text-white text-sm font-medium">{new Date(atividade.dataInicio).toLocaleString('pt-BR')}</p>
            </div>
            {atividade.dataFim && (
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-1">Fim</p>
                <p className="text-white text-sm font-medium">{new Date(atividade.dataFim).toLocaleString('pt-BR')}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-1">Pontos GPS</p>
              <p className="text-white text-sm font-medium">{atividade.pontosGps?.length || 0} pontos</p>
            </div>
          </div>

          {/* Map */}
          <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
            <div className="px-5 py-4 border-b border-navy-600 flex items-center gap-2">
              <MapPin size={18} className="text-brand-500" />
              <h3 className="text-sm font-bold tracking-widest uppercase text-white">Trajeto GPS</h3>
            </div>
            {positions.length > 0 ? (
              <MapContainer
                center={center}
                zoom={15}
                style={{ height: '400px', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Polyline
                  positions={positions}
                  pathOptions={{ color: '#f97316', weight: 4, opacity: 0.9 }}
                />
                {positions.length > 0 && (
                  <Marker position={positions[0]} icon={startIcon}>
                    <Popup>Início</Popup>
                  </Marker>
                )}
                {positions.length > 1 && (
                  <Marker position={positions[positions.length - 1]} icon={endIcon}>
                    <Popup>Fim</Popup>
                  </Marker>
                )}
              </MapContainer>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <MapPin size={40} className="mx-auto mb-3 text-navy-600" />
                  <p className="text-slate-500 text-sm font-bold tracking-widest uppercase">Nenhum ponto GPS disponível</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
