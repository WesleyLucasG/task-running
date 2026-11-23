import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Package, Sword, Shield, Zap, Star, Coins, ChevronRight, Loader2, Lock } from 'lucide-react';
import api, { getApiError } from '../services/api';

interface ItemCatalogo {
  itemId: number;
  nomeItem: string;
  tipoItem: string;
  descricao: string;
  raridade: string;
  urlImagem: string | null;
  slot: string;
}

interface InventarioItemResponse {
  inventarioId: number;
  itemId: number;
  nomeItem: string;
  tipoItem: string;
  raridade: string;
  urlImagem: string | null;
  equipado: boolean;
  slot: string;
}

interface EstadoJogo {
  nomeHeroi: string;
  faseAtualNumero: number;
  faseAtualNome: string;
  situacao: string;
  distanciaPercorridaMetros: number;
  metaDistanciaMetros: number;
  chefeNome: string;
  chefeVidaAtual: number;
  chefeVidaMaxima: number;
  bausPendentes: number;
  inventario: InventarioItemResponse[];
  moedas: number;
  xp: number;
  nivel: number;
}

const raridadeCor: Record<string, string> = {
  COMUM: 'text-slate-400 border-slate-500/30 bg-slate-500/10',
  INCOMUM: 'text-game-green border-green-500/30 bg-green-500/10',
  RARO: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  EPICO: 'text-game-purple border-purple-500/30 bg-purple-500/10',
  LENDARIO: 'text-game-yellow border-amber-500/30 bg-amber-500/10',
};

const tipoIcon: Record<string, typeof Sword> = {
  ARMA: Sword,
  ARMADURA: Shield,
  ACESSORIO: Zap,
};

function RaridadeBadge({ raridade }: { raridade: string }) {
  const cor = raridadeCor[raridade] ?? raridadeCor.COMUM;
  return (
    <span className={`inline-block text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded border ${cor}`}>
      {raridade}
    </span>
  );
}

export default function Inventario() {
  const [estado, setEstado] = useState<EstadoJogo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEstado = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/jogo/estado');
      setEstado(data);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEstado(); }, [fetchEstado]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 bg-navy-800 border border-navy-600 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 bg-navy-800 border border-navy-600 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const inventario = estado?.inventario ?? [];
  const equipados = inventario.filter((i) => i.equipado);
  const naEquipados = inventario.filter((i) => !i.equipado);

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-game-purple/15 border border-purple-500/30 flex items-center justify-center shrink-0">
          <Package size={22} className="text-game-purple" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-widest uppercase text-white">
            Inventário
          </h1>
          <p className="text-slate-500 text-xs tracking-widest uppercase mt-0.5">
            {inventario.length} {inventario.length === 1 ? 'item' : 'itens'} coletados
          </p>
        </div>
        {estado && (
          <div className="ml-auto flex items-center gap-2 bg-game-yellow/10 border border-amber-500/20 px-3 py-2 rounded-xl">
            <Coins size={15} className="text-game-yellow" />
            <span className="text-game-yellow font-black text-sm tabular-nums">
              {estado.moedas?.toLocaleString('pt-BR') || 0}
            </span>
          </div>
        )}
      </div>

      {/* Fase / progresso atual */}
      {estado && (
        <div
          className="rounded-2xl border border-navy-600 overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #090f1a 0%, #0d1525 100%)' }}
        >
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-brand-500 to-transparent" />
          <div className="p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-[10px] font-black tracking-widest uppercase text-brand-500/70 mb-1">
                  Fase {estado.faseAtualNumero}
                </p>
                <h2 className="text-lg font-black uppercase tracking-wider text-white leading-tight">
                  {estado.faseAtualNome}
                </h2>
                <p className="text-slate-500 text-xs mt-0.5">{estado.chefeNome} • Chefe</p>
              </div>
              <span className={`text-[10px] font-black tracking-widest uppercase px-2 py-1 rounded border ${
                estado.situacao === 'ATUAL'
                  ? 'bg-brand-500/15 border-brand-500/30 text-brand-400'
                  : estado.situacao === 'CONCLUIDA'
                  ? 'bg-game-green/15 border-green-500/30 text-game-green'
                  : 'bg-slate-500/10 border-slate-500/20 text-slate-500'
              }`}>
                {estado.situacao === 'ATUAL' ? 'Explorando' : estado.situacao === 'CONCLUIDA' ? 'Concluída' : 'Bloqueada'}
              </span>
            </div>

            {/* Progresso da fase */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-500 font-bold tracking-widest uppercase">Distância</span>
                <span className="text-slate-400 font-bold tabular-nums">
                  {(estado.distanciaPercorridaMetros / 1000).toFixed(2)} / {(estado.metaDistanciaMetros / 1000).toFixed(1)} km
                </span>
              </div>
              <div className="h-2.5 bg-navy-700 rounded-full overflow-hidden border border-navy-600 relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-700 relative"
                  style={{ width: `${Math.min((estado.distanciaPercorridaMetros / estado.metaDistanciaMetros) * 100, 100)}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 rounded-full" />
                </div>
              </div>
            </div>

            {/* Vida do chefe */}
            {estado.chefeVidaMaxima > 0 && (
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500 font-bold tracking-widest uppercase">Chefe HP</span>
                  <span className="text-game-red font-bold tabular-nums">
                    {estado.chefeVidaAtual} / {estado.chefeVidaMaxima}
                  </span>
                </div>
                <div className="h-2 bg-navy-700 rounded-full overflow-hidden border border-navy-600">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-700"
                    style={{ width: `${Math.min((estado.chefeVidaAtual / estado.chefeVidaMaxima) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Baús pendentes */}
            {estado.bausPendentes > 0 && (
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="mt-4 w-full flex items-center justify-between bg-game-yellow/10 hover:bg-game-yellow/15 border border-amber-500/30 hover:border-amber-500/50 px-4 py-3 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-game-yellow animate-pulse" />
                  <span className="text-game-yellow font-black text-xs tracking-widest uppercase">
                    {estado.bausPendentes} {estado.bausPendentes === 1 ? 'Baú disponível' : 'Baús disponíveis'}
                  </span>
                </div>
                <ChevronRight size={15} className="text-game-yellow group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Itens equipados */}
      {equipados.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-5 bg-game-purple rounded-full" />
            <span className="text-xs font-black tracking-widest uppercase text-slate-300">Equipados</span>
            <div className="flex-1 h-px bg-navy-600" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {equipados.map((item) => {
              const Icon = tipoIcon[item.tipoItem] ?? Package;
              return (
                <div
                  key={item.inventarioId}
                  className="bg-navy-800 rounded-xl border border-game-purple/30 p-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-game-purple/5 rounded-bl-full" />
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-game-purple shadow-sm shadow-purple-500/50" />
                  <div className="w-10 h-10 rounded-lg bg-game-purple/15 border border-purple-500/20 flex items-center justify-center mb-3">
                    <Icon size={18} className="text-game-purple" />
                  </div>
                  <h3 className="text-white font-black text-xs uppercase tracking-wide leading-tight mb-1.5">
                    {item.nomeItem}
                  </h3>
                  <RaridadeBadge raridade={item.raridade} />
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-game-purple font-bold uppercase tracking-widest">
                    <Zap size={10} />
                    Equipado
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Outros itens */}
      {naEquipados.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-5 bg-slate-600 rounded-full" />
            <span className="text-xs font-black tracking-widest uppercase text-slate-300">Outros Itens</span>
            <div className="flex-1 h-px bg-navy-600" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {naEquipados.map((item) => {
              const Icon = tipoIcon[item.tipoItem] ?? Package;
              return (
                <div
                  key={item.inventarioId}
                  className="bg-navy-800 rounded-xl border border-navy-600 hover:border-navy-500 p-4 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-navy-700 border border-navy-600 flex items-center justify-center mb-3">
                    <Icon size={18} className="text-slate-500" />
                  </div>
                  <h3 className="text-white font-black text-xs uppercase tracking-wide leading-tight mb-1.5">
                    {item.nomeItem}
                  </h3>
                  <RaridadeBadge raridade={item.raridade} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Inventário vazio */}
      {inventario.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-navy-800 border border-navy-600 flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-navy-500" />
          </div>
          <p className="text-slate-500 font-black tracking-widest uppercase text-sm">Inventário vazio</p>
          <p className="text-slate-600 text-xs mt-2">Complete fases para ganhar itens e recompensas</p>
        </div>
      )}
    </div>
  );
}
