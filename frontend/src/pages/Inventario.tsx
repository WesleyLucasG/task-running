import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Package, Sword, Shield, Zap, Star, Coins, Loader2, Lock } from 'lucide-react';
import api, { getApiError } from '../services/api';

interface InventarioItem {
  id: number;
  itemId: number;
  nome: string;
  tipo: string;
  raridade: string;
  bonusForca: number;
  bonusVida: number;
  equipado: boolean;
  valorVenda: number;
  bonusArmadura: number;
  bonusAgilidade: number;
}

interface CarteiraDTO {
  moedas: number;
  experienciaXp: number;
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
  CAPACETE: Star,
  ARMADURA: Shield,
  BOTAS: Zap,
};

function RaridadeBadge({ raridade }: { raridade: string }) {
  const cor = raridadeCor[raridade] ?? raridadeCor.COMUM;
  return (
    <span
      className={`inline-block text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded border ${cor}`}
    >
      {raridade}
    </span>
  );
}

function ItemCard({ item }: { item: InventarioItem }) {
  const Icon = tipoIcon[item.tipo] ?? Package;
  const stats = (
    [
      item.bonusForca > 0 && { label: 'FOR', value: `+${item.bonusForca}`, color: 'text-game-red' },
      item.bonusVida > 0 && { label: 'VID', value: `+${item.bonusVida}`, color: 'text-game-green' },
      item.bonusArmadura > 0 && { label: 'ARM', value: `+${item.bonusArmadura}`, color: 'text-blue-400' },
      item.bonusAgilidade > 0 && { label: 'AGI', value: `+${item.bonusAgilidade}`, color: 'text-game-cyan' },
    ] as (false | { label: string; value: string; color: string })[]
  ).filter(Boolean) as { label: string; value: string; color: string }[];

  return (
    <div
      className={`bg-navy-800 rounded-xl border p-4 relative overflow-hidden transition-colors ${
        item.equipado ? 'border-game-purple/30' : 'border-navy-600 hover:border-navy-500'
      }`}
    >
      {item.equipado && (
        <>
          <div className="absolute top-0 right-0 w-16 h-16 bg-game-purple/5 rounded-bl-full" />
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-game-purple shadow-sm shadow-purple-500/50" />
        </>
      )}
      <div
        className={`w-10 h-10 rounded-lg border flex items-center justify-center mb-3 ${
          item.equipado
            ? 'bg-game-purple/15 border-purple-500/20'
            : 'bg-navy-700 border-navy-600'
        }`}
      >
        <Icon size={18} className={item.equipado ? 'text-game-purple' : 'text-slate-500'} />
      </div>
      <h3 className="text-white font-black text-xs uppercase tracking-wide leading-tight mb-1.5">
        {item.nome}
      </h3>
      <RaridadeBadge raridade={item.raridade} />
      {stats.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {stats.map((s) => (
            <span key={s.label} className={`text-[9px] font-black ${s.color} uppercase tracking-widest`}>
              {s.label} {s.value}
            </span>
          ))}
        </div>
      )}
      {item.equipado && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-game-purple font-bold uppercase tracking-widest">
          <Zap size={10} />
          Equipado
        </div>
      )}
    </div>
  );
}

export default function Inventario() {
  const [itens, setItens] = useState<InventarioItem[]>([]);
  const [carteira, setCarteira] = useState<CarteiraDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, estadoRes] = await Promise.allSettled([
        api.get('/api/jogo/inventario'),
        api.get('/api/jogo/estado'),
      ]);
      if (invRes.status === 'fulfilled') {
        setItens(Array.isArray(invRes.value.data) ? invRes.value.data : []);
      } else {
        toast.error(getApiError(invRes.reason));
      }
      if (estadoRes.status === 'fulfilled') {
        setCarteira(estadoRes.value.data?.carteira ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-16 bg-navy-800 border border-navy-600 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 bg-navy-800 border border-navy-600 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const equipados = itens.filter((i) => i.equipado);
  const naEquipados = itens.filter((i) => !i.equipado);

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-game-purple/15 border border-purple-500/30 flex items-center justify-center shrink-0">
          <Package size={22} className="text-game-purple" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-widest uppercase text-white">Inventário</h1>
          <p className="text-slate-500 text-xs tracking-widest uppercase mt-0.5">
            {itens.length} {itens.length === 1 ? 'item' : 'itens'} coletados
          </p>
        </div>
        {carteira && (
          <div className="ml-auto flex items-center gap-2 bg-game-yellow/10 border border-amber-500/20 px-3 py-2 rounded-xl">
            <Coins size={15} className="text-game-yellow" />
            <span className="text-game-yellow font-black text-sm tabular-nums">
              {carteira.moedas.toLocaleString('pt-BR')}
            </span>
          </div>
        )}
      </div>

      {/* Itens equipados */}
      {equipados.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-5 bg-game-purple rounded-full" />
            <span className="text-xs font-black tracking-widest uppercase text-slate-300">Equipados</span>
            <div className="flex-1 h-px bg-navy-600" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {equipados.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
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
            {naEquipados.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Vazio */}
      {itens.length === 0 && (
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
