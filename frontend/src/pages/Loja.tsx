import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Coins, ShoppingBag, Loader2, CheckCircle, Package } from 'lucide-react';
import api, { getApiError } from '../services/api';

interface Avatar {
  id: number;
  nome: string;
  descricao: string;
  precoMoedas: number;
  imagemUrl: string;
  raridade: 'COMUM' | 'RARO' | 'LENDARIO';
  adquirido: boolean;
  equipado: boolean;
}

interface Carteira {
  moedas: number;
  experienciaXp: number;
  nivel: number;
}

const raridadeConfig = {
  COMUM: { label: 'Comum', className: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  RARO: { label: 'Raro', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  LENDARIO: { label: 'Lendário', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
};

export default function Loja() {
  const [avatares, setAvatares] = useState<Avatar[]>([]);
  const [carteira, setCarteira] = useState<Carteira | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [lojaRes, carteiraRes] = await Promise.all([
        api.get('/api/gamificacao/loja'),
        api.get('/api/gamificacao/carteira'),
      ]);
      setAvatares(lojaRes.data);
      setCarteira(carteiraRes.data);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const comprar = async (avatar: Avatar) => {
    if ((carteira?.moedas || 0) < avatar.precoMoedas) { toast.error('Moedas insuficientes!'); return; }
    setActionLoading(avatar.id);
    try {
      await api.post(`/api/gamificacao/comprar/${avatar.id}`);
      toast.success(`${avatar.nome} adquirido!`);
      await fetchData();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const equipar = async (avatar: Avatar) => {
    setActionLoading(avatar.id);
    try {
      await api.put(`/api/gamificacao/equipar/${avatar.id}`);
      toast.success(`${avatar.nome} equipado!`);
      await fetchData();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-16 bg-navy-800 border border-navy-600 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-navy-800 border border-navy-600 rounded-2xl p-4 animate-pulse">
              <div className="aspect-square bg-navy-700 rounded-xl mb-3" />
              <div className="h-4 bg-navy-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-navy-700 rounded w-full mb-3" />
              <div className="h-9 bg-navy-700 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-widest uppercase text-white">Loja de Avatares</h1>
          <p className="text-slate-500 mt-1 text-sm">Personalize seu herói com avatares exclusivos</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 rounded-xl self-start sm:self-auto">
          <Coins size={18} className="text-amber-400" />
          <span className="text-amber-400 font-bold text-lg">{carteira?.moedas?.toLocaleString('pt-BR') || 0}</span>
          <span className="text-slate-500 text-xs font-bold tracking-widest uppercase">moedas</span>
        </div>
      </div>

      {/* Grid */}
      {avatares.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag size={48} className="text-navy-600 mx-auto mb-3" />
          <p className="text-slate-500 font-bold tracking-widest uppercase text-sm">Nenhum avatar disponível</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {avatares.map((avatar) => {
            const rarity = raridadeConfig[avatar.raridade] || raridadeConfig.COMUM;
            const isLoading = actionLoading === avatar.id;

            return (
              <div
                key={avatar.id}
                className={`bg-navy-800 rounded-2xl border p-4 flex flex-col transition-all ${
                  avatar.equipado
                    ? 'border-brand-500/40 shadow-lg shadow-orange-500/10'
                    : 'border-navy-600 hover:border-navy-500'
                }`}
              >
                {/* Image */}
                <div className="aspect-square rounded-xl overflow-hidden bg-navy-700 border border-navy-600 mb-3 relative">
                  {avatar.imagemUrl ? (
                    <img
                      src={avatar.imagemUrl}
                      alt={avatar.nome}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const sibling = (e.target as HTMLImageElement).nextElementSibling;
                        if (sibling) sibling.removeAttribute('hidden');
                      }}
                    />
                  ) : null}
                  <div hidden={!!avatar.imagemUrl} className="w-full h-full flex items-center justify-center">
                    <Package size={36} className="text-navy-500" />
                  </div>
                  {avatar.equipado && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center shadow-md shadow-orange-500/30">
                      <CheckCircle size={13} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="text-white font-bold text-sm uppercase tracking-wide leading-tight mb-1">{avatar.nome}</h3>
                  <span className={`inline-block text-xs font-bold tracking-widest uppercase px-2 py-0.5 rounded border mb-2 ${rarity.className}`}>
                    {rarity.label}
                  </span>
                  <p className="text-slate-500 text-xs line-clamp-2 mb-3">{avatar.descricao}</p>
                </div>

                {/* Action */}
                {avatar.equipado ? (
                  <div className="flex items-center justify-center gap-1.5 bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold tracking-widest uppercase py-2.5 rounded-xl">
                    <CheckCircle size={14} />
                    Equipado
                  </div>
                ) : avatar.adquirido ? (
                  <button
                    onClick={() => equipar(avatar)}
                    disabled={isLoading}
                    className="w-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 text-blue-400 font-bold tracking-widest uppercase text-xs py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading && <Loader2 size={13} className="animate-spin" />}
                    Equipar
                  </button>
                ) : (
                  <button
                    onClick={() => comprar(avatar)}
                    disabled={isLoading || (carteira?.moedas || 0) < avatar.precoMoedas}
                    className="w-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 font-bold tracking-widest uppercase text-xs py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Coins size={13} />}
                    {avatar.precoMoedas.toLocaleString('pt-BR')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
