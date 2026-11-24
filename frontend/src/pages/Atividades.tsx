import { useState, useEffect, useCallback } from 'react';
import {
  MapPin, Clock, Flame, TrendingUp, Ruler, Loader2, AlertCircle, ChevronRight, Activity,
} from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api, { getApiError } from '../services/api';

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

const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

interface AtividadeResumo {
  id: number;
  tipoAtividade: string;
  status: string;
  dataInicio: string;
  dataFim: string | null;
  duracaoSegundos: number;
  distanciaMetros: number;
  calorias: number;
  paceMedio: number;
}

interface PontoGps {
  id: number;
  latitude: number;
  longitude: number;
  altitude: number;
  timestamp: string;
}

interface AtividadeDetalhe extends AtividadeResumo {
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function Atividades() {
  const [lista, setLista] = useState<AtividadeResumo[]>([]);
  const [loadingLista, setLoadingLista] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detalhe, setDetalhe] = useState<AtividadeDetalhe | null>(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);
  const [erroLista, setErroLista] = useState<string | null>(null);

  const fetchLista = useCallback(async () => {
    setLoadingLista(true);
    setErroLista(null);
    try {
      const { data } = await api.get('/api/atividades', { params: { pagina: 0, tamanho: 50 } });
      const items: AtividadeResumo[] = data?.content ?? (Array.isArray(data) ? data : []);
      setLista(items);
      if (items.length > 0 && selectedId === null) {
        setSelectedId(items[0].id);
      }
    } catch (err) {
      setErroLista(getApiError(err));
    } finally {
      setLoadingLista(false);
    }
  }, [selectedId]);

  useEffect(() => { fetchLista(); }, []);

  useEffect(() => {
    if (selectedId === null) return;
    setLoadingDetalhe(true);
    setDetalhe(null);
    api.get(`/api/atividades/${selectedId}`)
      .then(({ data }) => setDetalhe(data))
      .catch(() => {})
      .finally(() => setLoadingDetalhe(false));
  }, [selectedId]);

  const positions: [number, number][] =
    detalhe?.pontosGps?.map((p) => [p.latitude, p.longitude]) ?? [];
  const center: [number, number] =
    positions.length > 0
      ? positions[Math.floor(positions.length / 2)]
      : [-23.5505, -46.6333];

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-11 h-11 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center shrink-0">
          <Activity size={20} className="text-brand-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-widest uppercase text-white">Atividades</h1>
          <p className="text-slate-500 text-xs tracking-widest uppercase mt-0.5">
            {lista.length} {lista.length === 1 ? 'corrida registrada' : 'corridas registradas'}
          </p>
        </div>
      </div>

      {erroLista && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 mb-5">
          <AlertCircle size={18} />
          <p className="text-sm">{erroLista}</p>
        </div>
      )}

      {loadingLista ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-navy-800 border border-navy-600 rounded-xl" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-navy-800 border border-navy-600 flex items-center justify-center mx-auto mb-4">
            <Activity size={28} className="text-navy-500" />
          </div>
          <p className="text-slate-500 font-black tracking-widest uppercase text-sm">Nenhuma atividade</p>
          <p className="text-slate-600 text-xs mt-2">Registre corridas no aplicativo mobile</p>
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-[300px_1fr] gap-5 items-start">

          {/* Lista de atividades */}
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {lista.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className={`w-full text-left rounded-xl border p-4 transition-all ${
                  selectedId === a.id
                    ? 'border-brand-500/50 bg-brand-500/5'
                    : 'border-navy-600 bg-navy-800 hover:border-navy-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded border ${
                    a.status === 'CONCLUIDA'
                      ? 'bg-brand-500/10 border-brand-500/20 text-brand-400'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  }`}>
                    {a.tipoAtividade}
                  </span>
                  <ChevronRight size={13} className={selectedId === a.id ? 'text-brand-500' : 'text-slate-600'} />
                </div>
                <div className="flex gap-3 text-xs">
                  <div className="flex items-center gap-1 text-white font-black tabular-nums">
                    <Ruler size={11} className="text-brand-500" />
                    {(a.distanciaMetros / 1000).toFixed(2)} km
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 font-bold">
                    <Clock size={11} className="text-slate-500" />
                    {formatDuration(a.duracaoSegundos)}
                  </div>
                </div>
                <p className="text-slate-600 text-[10px] mt-1.5 font-bold">{formatDate(a.dataInicio)}</p>
              </button>
            ))}
          </div>

          {/* Detalhe da atividade selecionada */}
          <div className="mt-4 lg:mt-0">
            {loadingDetalhe ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="text-brand-500 animate-spin" />
              </div>
            ) : detalhe ? (
              <div className="space-y-4">
                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: Ruler, color: 'text-brand-500', label: 'Distância', value: `${(detalhe.distanciaMetros / 1000).toFixed(2)}`, unit: 'km' },
                    { icon: Clock, color: 'text-blue-400', label: 'Duração', value: formatDuration(detalhe.duracaoSegundos), unit: '' },
                    { icon: TrendingUp, color: 'text-purple-400', label: 'Pace médio', value: formatPace(detalhe.paceMedio), unit: '' },
                    { icon: Flame, color: 'text-amber-400', label: 'Calorias', value: `${detalhe.calorias}`, unit: 'kcal' },
                  ].map(({ icon: Icon, color, label, value, unit }) => (
                    <div key={label} className="bg-navy-800 rounded-xl p-4 border border-navy-600">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon size={14} className={color} />
                        <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">{label}</span>
                      </div>
                      <p className="text-xl font-black text-white tabular-nums">
                        {value}
                        {unit && <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Info row */}
                <div className="bg-navy-800 rounded-xl p-4 border border-navy-600 flex flex-wrap gap-5">
                  <div>
                    <p className="text-[10px] font-black tracking-widest uppercase text-slate-500 mb-1">Tipo</p>
                    <span className="inline-flex items-center gap-1.5 bg-brand-500/10 text-brand-400 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-lg border border-brand-500/20">
                      {detalhe.tipoAtividade}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black tracking-widest uppercase text-slate-500 mb-1">Status</p>
                    <span className={`inline-flex items-center text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-lg border ${
                      detalhe.status === 'CONCLUIDA'
                        ? 'bg-game-green/10 text-game-green border-green-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {detalhe.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black tracking-widest uppercase text-slate-500 mb-1">Início</p>
                    <p className="text-white text-sm font-bold">{new Date(detalhe.dataInicio).toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black tracking-widest uppercase text-slate-500 mb-1">Pontos GPS</p>
                    <p className="text-white text-sm font-bold tabular-nums">{detalhe.pontosGps?.length ?? 0}</p>
                  </div>
                </div>

                {/* Mapa */}
                <div className="bg-navy-800 rounded-xl border border-navy-600 overflow-hidden">
                  <div className="px-4 py-3 border-b border-navy-600 flex items-center gap-2">
                    <MapPin size={16} className="text-brand-500" />
                    <h3 className="text-xs font-black tracking-widest uppercase text-white">Trajeto GPS</h3>
                  </div>
                  {positions.length > 0 ? (
                    <MapContainer
                      center={center}
                      zoom={15}
                      style={{ height: '380px', width: '100%' }}
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
                      <Marker position={positions[0]} icon={startIcon}>
                        <Popup>Início</Popup>
                      </Marker>
                      {positions.length > 1 && (
                        <Marker position={positions[positions.length - 1]} icon={endIcon}>
                          <Popup>Fim</Popup>
                        </Marker>
                      )}
                    </MapContainer>
                  ) : (
                    <div className="h-48 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin size={32} className="mx-auto mb-3 text-navy-600" />
                        <p className="text-slate-500 text-sm font-bold tracking-widest uppercase">Nenhum ponto GPS</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

        </div>
      )}
    </div>
  );
}
