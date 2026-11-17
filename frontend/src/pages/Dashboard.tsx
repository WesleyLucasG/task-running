import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Droplets, Coins, Star, Plus, Loader2, Flame, Zap, ChevronRight, Package } from 'lucide-react';
import api, { getApiError } from '../services/api';

interface Perfil { id: number; nome: string; email: string; cpf: string; peso: number; metaAguaMl: number; }
interface Carteira { moedas: number; experienciaXp: number; nivel: number; }
interface Hidratacao { metaDiariaMl: number; consumidoHojeMl: number; porcentagemConcluida: number; lembreteAtivo: boolean; }
interface Avatar { id: number; nome: string; imagemUrl: string; equipado: boolean; adquirido: boolean; }

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="w-1 h-5 bg-brand-500 rounded-full" />
      <span className="text-xs font-bold tracking-widest uppercase text-slate-300">{children}</span>
      <div className="flex-1 h-px bg-navy-600" />
    </div>
  );
}

function getTitle(nivel: number): string {
  if (nivel >= 20) return 'LENDÁRIO';
  if (nivel >= 10) return 'CORREDOR DAS SOMBRAS';
  if (nivel >= 5) return 'CORREDOR DAS RUÍNAS';
  return 'CORREDOR INICIANTE';
}

export default function Dashboard() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carteira, setCarteira] = useState<Carteira | null>(null);
  const [hidratacao, setHidratacao] = useState<Hidratacao | null>(null);
  const [avatarEquipado, setAvatarEquipado] = useState<Avatar | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingWater, setAddingWater] = useState(false);
  const [customMl, setCustomMl] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      api.get('/api/perfil'),
      api.get('/api/gamificacao/carteira'),
      api.get('/api/hidratacao'),
      api.get('/api/gamificacao/loja'),
    ]);
    const [p, c, h, l] = results;
    if (p.status === 'fulfilled') setPerfil(p.value.data);
    else toast.error(getApiError(p.reason));
    if (c.status === 'fulfilled') setCarteira(c.value.data);
    else toast.error(getApiError(c.reason));
    if (h.status === 'fulfilled') setHidratacao(h.value.data);
    else toast.error(getApiError(h.reason));
    if (l.status === 'fulfilled') {
      const equipado = (l.value.data as Avatar[]).find((a) => a.equipado) ?? null;
      setAvatarEquipado(equipado);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addWater = async (ml: number) => {
    if (!ml || ml <= 0 || isNaN(ml)) return;
    setAddingWater(true);
    try {
      const res = await api.post('/api/hidratacao/registrar', { quantidadeMl: ml });
      setHidratacao(res.data);
      toast.success(`+${ml}ml registrado!`);
      setCustomMl('');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setAddingWater(false);
    }
  };

  const nivel = carteira?.nivel || 1;
  const xpForNextLevel = nivel * 1000;
  const xpProgress = carteira ? Math.min((carteira.experienciaXp / xpForNextLevel) * 100, 100) : 0;
  const waterProgress = hidratacao ? Math.min(hidratacao.porcentagemConcluida, 100) : 0;
  const title = getTitle(nivel);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-36 bg-navy-800 border border-navy-600 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 bg-navy-800 border border-navy-600 rounded-xl" />
          <div className="h-20 bg-navy-800 border border-navy-600 rounded-xl" />
        </div>
        <div className="h-48 bg-navy-800 border border-navy-600 rounded-2xl" />
        <div className="h-28 bg-navy-800 border border-navy-600 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── HERO CARD ── */}
      <div
        className="rounded-2xl border border-navy-600 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f1724 0%, #141e2e 60%, #1a2740 100%)' }}
      >
        {/* Orange top stripe */}
        <div className="h-1 w-full bg-gradient-to-r from-brand-600 via-brand-500 to-amber-400" />

        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-xl bg-navy-700 border-2 border-brand-500/60 overflow-hidden shadow-lg shadow-orange-500/20">
                {avatarEquipado?.imagemUrl ? (
                  <img src={avatarEquipado.imagemUrl} alt={avatarEquipado.nome} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={28} className="text-brand-500/50" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none shadow-md">
                {nivel}
              </div>
            </div>

            {/* Name + title */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold tracking-widest text-brand-500/80 uppercase mb-0.5">{title}</p>
              <h1 className="text-xl font-bold uppercase tracking-wider text-white truncate leading-tight">
                {perfil?.nome?.split(' ')[0] || 'Atleta'}
              </h1>
              <p className="text-xs text-slate-500 truncate mt-0.5">{perfil?.email}</p>
            </div>

            {/* Coins badge */}
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1.5 rounded-lg shrink-0">
              <Coins size={14} className="text-amber-400" />
              <span className="text-amber-400 font-bold text-sm tabular-nums">
                {carteira?.moedas?.toLocaleString('pt-BR') || 0}
              </span>
            </div>
          </div>

          {/* XP Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-500 font-bold tracking-widest uppercase">EXP</span>
              <span className="text-slate-400 font-bold tabular-nums">
                {carteira?.experienciaXp?.toLocaleString('pt-BR') || 0} / {xpForNextLevel.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="h-2 bg-navy-700 rounded-full overflow-hidden border border-navy-600">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-600 to-amber-400 transition-all duration-700"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── ATRIBUTOS ── */}
      <div>
        <SectionHeader>Atributos</SectionHeader>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Nível', value: String(nivel) },
            { icon: Coins, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Moedas', value: (carteira?.moedas || 0).toLocaleString('pt-BR') },
            { icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', label: 'Peso', value: perfil?.peso ? `${perfil.peso} kg` : '—' },
            { icon: Droplets, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', label: 'Meta Água', value: perfil?.metaAguaMl ? `${(perfil.metaAguaMl / 1000).toFixed(1)}L` : '—' },
          ].map(({ icon: Icon, color, bg, label, value }) => (
            <div key={label} className="bg-navy-800 border border-navy-600 rounded-xl p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${bg} shrink-0`}>
                <Icon size={17} className={color} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold tracking-widest uppercase text-slate-500 leading-none mb-1">{label}</p>
                <p className="text-lg font-bold text-white leading-none truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MISSÕES ATIVAS ── */}
      <div>
        <SectionHeader>Missões Ativas</SectionHeader>
        <div className="space-y-2">
          {/* Hydration mission */}
          <div className="bg-navy-800 border border-navy-600 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
                  <Droplets size={16} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Beber meta de água</p>
                  <p className="text-xs text-slate-500">
                    {((hidratacao?.consumidoHojeMl || 0) / 1000).toFixed(2)}L / {((hidratacao?.metaDiariaMl || 0) / 1000).toFixed(1)}L
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-brand-500/10 border border-brand-500/20 px-2 py-1 rounded-lg">
                <span className="text-brand-400 text-xs font-bold">+{Math.round((hidratacao?.metaDiariaMl || 2000) / 20)} XP</span>
              </div>
            </div>
            <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  waterProgress >= 100 ? 'bg-gradient-to-r from-brand-600 to-brand-400' : 'bg-gradient-to-r from-blue-700 to-blue-400'
                }`}
                style={{ width: `${waterProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── HIDRATAÇÃO ── */}
      <div>
        <SectionHeader>Hidratação de Hoje</SectionHeader>
        <div className="bg-navy-800 border border-navy-600 rounded-2xl p-5">
          {/* Progress ring alternative – big percentage */}
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 border-4"
              style={{
                borderColor: waterProgress >= 100 ? '#f97316' : '#1d4ed8',
                background: waterProgress >= 100 ? 'rgba(249,115,22,.1)' : 'rgba(29,78,216,.1)',
              }}
            >
              <span className={`text-sm font-bold tabular-nums ${waterProgress >= 100 ? 'text-brand-500' : 'text-blue-400'}`}>
                {waterProgress.toFixed(0)}%
              </span>
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-lg tabular-nums">
                {((hidratacao?.consumidoHojeMl || 0) / 1000).toFixed(2)}
                <span className="text-slate-500 text-sm font-normal ml-1">L</span>
              </p>
              <p className="text-slate-500 text-xs">
                de {((hidratacao?.metaDiariaMl || 0) / 1000).toFixed(1)}L diários
              </p>
              <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden mt-2 border border-navy-600">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    waterProgress >= 100 ? 'bg-gradient-to-r from-brand-600 to-brand-400' : 'bg-gradient-to-r from-blue-700 to-blue-400'
                  }`}
                  style={{ width: `${waterProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick add */}
          <div className="flex flex-wrap gap-2">
            {[250, 500].map((ml) => (
              <button
                key={ml}
                onClick={() => addWater(ml)}
                disabled={addingWater}
                className="flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 text-blue-400 font-bold tracking-wide uppercase text-xs px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
              >
                {addingWater ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                +{ml}ml
              </button>
            ))}
            <div className="flex items-center gap-2 flex-1 min-w-[180px]">
              <input
                type="number"
                value={customMl}
                onChange={(e) => setCustomMl(e.target.value)}
                placeholder="Personalizado (ml)"
                min="1"
                className="flex-1 bg-navy-700 border border-navy-600 text-white placeholder-slate-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition-colors"
              />
              <button
                onClick={() => addWater(parseInt(customMl))}
                disabled={!customMl || addingWater}
                className="bg-brand-500 hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold tracking-wide uppercase text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-orange-500/20"
              >
                {addingWater ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                Add
              </button>
            </div>
          </div>

          {waterProgress >= 100 && (
            <div className="mt-3 flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-xl px-4 py-3">
              <Flame size={16} className="text-brand-500 shrink-0" />
              <p className="text-brand-400 text-sm font-bold">Meta diária atingida! Parabéns, herói!</p>
            </div>
          )}
        </div>
      </div>

      {/* ── ABRIR ATIVIDADES ── */}
      <button
        onClick={() => window.location.href = '/atividades'}
        className="w-full bg-navy-800 hover:bg-navy-700 border border-navy-600 hover:border-brand-500/40 text-white font-bold tracking-widest uppercase text-sm py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group"
      >
        <span>Ver Atividades & Mapa</span>
        <ChevronRight size={16} className="text-brand-500 group-hover:translate-x-1 transition-transform" />
      </button>

    </div>
  );
}
