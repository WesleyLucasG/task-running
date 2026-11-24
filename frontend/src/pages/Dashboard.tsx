import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Droplets, Coins, Star, Plus, Loader2, Flame, Zap, Sword, ChevronRight, Trophy, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { getApiError } from '../services/api';
import AvatarPixel, { AparenciaDTO } from '../components/AvatarPixel';
import LastRunMap from '../components/LastRunMap';

interface Perfil { id: number; nome: string; email: string; peso: number; metaAguaMl: number; }
interface CarteiraDTO { moedas: number; experienciaXp: number; nivel: number; }
interface AtributosDTO { nivel: number; experiencia: number; xpNoNivel: number; xpParaProximoNivel: number; }
interface FaseDTO { numero: number; situacao: string; distanciaAcumuladaMetros: number; chefeLiberado: boolean; vidaAtualChefe: number; }
interface ChefeAtualDTO { faseNumero: number; podeAtacar: boolean; motivoBloqueio: string | null; danoEstimado: number; }
interface EstadoJogo {
  carteira: CarteiraDTO;
  atributos: AtributosDTO;
  aparencia: AparenciaDTO;
  fases: FaseDTO[];
  chefeAtual: ChefeAtualDTO | null;
  bausPendentes: number;
}
interface Hidratacao { metaDiariaMl: number; consumidoHojeMl: number; porcentagemConcluida: number; }

const FASE_NOMES: Record<number, string> = {
  1: 'Bosque de Hermes', 2: 'Montanhas de Prata', 3: 'Deserto de Hélio',
  4: 'Ruínas de Atenas', 5: 'Abismo de Poseidon',
};
const FASE_METAS: Record<number, number> = { 1: 2000, 2: 4000, 3: 6000, 4: 8000, 5: 10000 };
const CHEFE_NOMES: Record<number, string> = {
  1: 'Ciclope', 2: 'Harpia Rainha', 3: 'Minotauro', 4: 'Medusa', 5: 'Hidra',
};
const CHEFE_VIDA_MAX: Record<number, number> = { 1: 30, 2: 70, 3: 120, 4: 180, 5: 250 };

function getTitle(nivel: number): string {
  if (nivel >= 20) return 'LENDÁRIO';
  if (nivel >= 10) return 'CORREDOR DAS SOMBRAS';
  if (nivel >= 5) return 'CORREDOR DAS RUÍNAS';
  return 'CORREDOR INICIANTE';
}

function StatBadge({ icon: Icon, value, color, bg }: { icon: typeof Coins; value: string | number; color: string; bg: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${bg}`}>
      <Icon size={13} className={color} />
      <span className={`${color} font-black text-sm tabular-nums`}>{value}</span>
    </div>
  );
}

export default function Dashboard() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carteiraLegacy, setCarteiraLegacy] = useState<CarteiraDTO | null>(null);
  const [hidratacao, setHidratacao] = useState<Hidratacao | null>(null);
  const [jogoEstado, setJogoEstado] = useState<EstadoJogo | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingWater, setAddingWater] = useState(false);
  const [customMl, setCustomMl] = useState('');
  const navigate = useNavigate();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      api.get('/api/perfil'),
      api.get('/api/gamificacao/carteira'),
      api.get('/api/hidratacao'),
      api.get('/api/jogo/estado'),
    ]);
    const [p, c, h, j] = results;
    if (p.status === 'fulfilled') setPerfil(p.value.data);
    else toast.error(getApiError(p.reason));
    if (c.status === 'fulfilled') setCarteiraLegacy(c.value.data);
    if (h.status === 'fulfilled') setHidratacao(h.value.data);
    if (j.status === 'fulfilled') setJogoEstado(j.value.data);
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

  // Derivar dados corretos do DTO aninhado
  const carteira = jogoEstado?.carteira ?? carteiraLegacy;
  const nivel = carteira?.nivel ?? 1;
  const xp = carteira?.experienciaXp ?? 0;
  const moedas = carteira?.moedas ?? 0;
  const xpForNextLevel = nivel * 1000;
  const xpProgress = Math.min((xp / xpForNextLevel) * 100, 100);
  const waterProgress = hidratacao ? Math.min(hidratacao.porcentagemConcluida, 100) : 0;
  const title = getTitle(nivel);

  const faseAtual = jogoEstado?.fases?.find((f) => f.situacao === 'ATUAL') ?? jogoEstado?.fases?.[0] ?? null;
  const faseNum = faseAtual?.numero ?? 1;
  const faseNome = FASE_NOMES[faseNum] ?? `Fase ${faseNum}`;
  const faseMeta = FASE_METAS[faseNum] ?? 2000;
  const chefeNome = CHEFE_NOMES[faseNum] ?? 'Chefe';
  const chefeVidaMax = CHEFE_VIDA_MAX[faseNum] ?? 30;
  const distancia = faseAtual?.distanciaAcumuladaMetros ?? 0;
  const chefeVida = faseAtual?.vidaAtualChefe ?? chefeVidaMax;
  const bausPendentes = jogoEstado?.bausPendentes ?? 0;
  const situacao = faseAtual?.situacao ?? 'ATUAL';

  const faseProgress = faseMeta > 0 ? Math.min((distancia / faseMeta) * 100, 100) : 0;
  const chefeProgress = chefeVidaMax > 0 ? Math.min((chefeVida / chefeVidaMax) * 100, 100) : 0;

  if (loading) {
    return (
      <div className="max-w-5xl">
        <div className="lg:grid lg:grid-cols-[1fr_280px] gap-5 items-start">
          <div className="space-y-4 animate-pulse">
            <div className="h-44 bg-navy-800 border border-navy-600 rounded-2xl" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-navy-800 border border-navy-600 rounded-xl" />)}
            </div>
            <div className="h-52 bg-navy-800 border border-navy-600 rounded-2xl" />
          </div>
          <div className="hidden lg:block h-64 bg-navy-800 border border-navy-600 rounded-2xl animate-pulse mt-5 lg:mt-0" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="lg:grid lg:grid-cols-[1fr_280px] gap-5 items-start">

        {/* ── COLUNA PRINCIPAL ── */}
        <div className="space-y-5">

          {/* HERO CARD */}
          <div className="rounded-2xl border border-navy-600 overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #090f1a 0%, #0d1525 50%, #111f35 100%)' }}>
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-brand-500 to-transparent" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="p-5 relative">
              <div className="flex items-start gap-4">
                {/* Avatar pixel art */}
                <div className="relative shrink-0">
                  <div className="absolute inset-0 bg-brand-500/30 rounded-2xl blur-lg" />
                  <div className="relative w-16 h-16 rounded-2xl bg-navy-700 border-2 border-brand-500/60 overflow-hidden shadow-lg shadow-orange-500/20 flex items-center justify-center">
                    <AvatarPixel aparencia={jogoEstado?.aparencia ?? null} size={48} />
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 bg-brand-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none shadow-md border border-brand-600">
                    LV{nivel}
                  </div>
                </div>

                {/* Nome + título */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black tracking-widest text-brand-500/80 uppercase mb-0.5">{title}</p>
                  <h1 className="text-xl font-black uppercase tracking-wider text-white truncate leading-tight">
                    {perfil?.nome?.split(' ')[0] || 'Atleta'}
                  </h1>
                  <p className="text-xs text-slate-600 truncate mt-0.5">{perfil?.email}</p>
                </div>

                {/* Badges */}
                <div className="flex flex-col gap-1.5 shrink-0">
                  <StatBadge icon={Coins} value={moedas.toLocaleString('pt-BR')} color="text-game-yellow" bg="bg-amber-500/10 border-amber-500/25" />
                  <StatBadge icon={Star} value={xp.toLocaleString('pt-BR')} color="text-game-purple" bg="bg-purple-500/10 border-purple-500/25" />
                </div>
              </div>

              {/* XP Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-600 font-black tracking-widest uppercase text-[10px]">EXP</span>
                  <span className="text-slate-500 font-bold tabular-nums text-[10px]">
                    {xp.toLocaleString('pt-BR')} / {xpForNextLevel.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="h-3 bg-navy-700 rounded-full overflow-hidden border border-navy-600 relative">
                  <div
                    className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
                    style={{ width: `${xpProgress}%`, background: 'linear-gradient(90deg, #c2410c, #f97316, #fbbf24)' }}
                  >
                    <div className="absolute inset-0 bg-white/20" />
                    <div className="absolute inset-0 bg-scanlines opacity-30" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STATUS DA FASE */}
          {jogoEstado && (
            <div
              className="rounded-2xl border border-navy-600 overflow-hidden relative cursor-pointer hover:border-brand-500/40 transition-colors"
              style={{ background: 'linear-gradient(135deg, #090f1a 0%, #0d1525 100%)' }}
              onClick={() => navigate('/inventario')}
            >
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-game-cyan/50 to-transparent" />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-game-cyan/15 border border-cyan-500/20 flex items-center justify-center">
                      <Sword size={15} className="text-game-cyan" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black tracking-widest uppercase text-game-cyan/70">
                        Fase {faseNum}
                      </p>
                      <p className="text-sm font-black uppercase tracking-wide text-white">{faseNome}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {bausPendentes > 0 && (
                      <span className="bg-game-yellow/15 border border-amber-500/30 text-game-yellow text-[10px] font-black tracking-widest uppercase px-2 py-1 rounded-lg animate-pulse">
                        {bausPendentes} BAÚ
                      </span>
                    )}
                    <span className={`text-[10px] font-black tracking-widest uppercase px-2 py-1 rounded border ${
                      situacao === 'ATUAL'
                        ? 'bg-brand-500/15 border-brand-500/30 text-brand-400'
                        : 'bg-green-500/10 border-green-500/20 text-game-green'
                    }`}>
                      {situacao === 'ATUAL' ? 'Explorando' : 'Concluída'}
                    </span>
                  </div>
                </div>

                {/* Progresso da fase */}
                <div className="mb-2">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-slate-600 font-bold uppercase tracking-widest">Distância</span>
                    <span className="text-slate-400 font-bold tabular-nums">
                      {(distancia / 1000).toFixed(2)} / {(faseMeta / 1000).toFixed(1)} km
                    </span>
                  </div>
                  <div className="h-2 bg-navy-700 rounded-full overflow-hidden border border-navy-600">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-700 to-game-cyan transition-all duration-700"
                      style={{ width: `${faseProgress}%` }}
                    />
                  </div>
                </div>

                {/* HP do chefe */}
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-slate-600 font-bold uppercase tracking-widest">{chefeNome}</span>
                    <span className="text-game-red font-bold tabular-nums">
                      {chefeVida} / {chefeVidaMax} HP
                    </span>
                  </div>
                  <div className="h-2 bg-navy-700 rounded-full overflow-hidden border border-navy-600">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-800 to-game-red transition-all duration-700"
                      style={{ width: `${chefeProgress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end mt-3 gap-1 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                  <span>Ver inventário</span>
                  <ChevronRight size={12} />
                </div>
              </div>
            </div>
          )}

          {/* ATRIBUTOS */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-5 bg-brand-500 rounded-full" />
              <span className="text-xs font-black tracking-widest uppercase text-slate-400">Atributos</span>
              <div className="flex-1 h-px bg-navy-700" />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { icon: Star, color: 'text-game-yellow', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Nível', value: String(nivel) },
                { icon: Coins, color: 'text-game-yellow', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Moedas', value: moedas.toLocaleString('pt-BR') },
                { icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', label: 'Peso', value: perfil?.peso ? `${perfil.peso} kg` : '—' },
                { icon: Droplets, color: 'text-game-cyan', bg: 'bg-cyan-500/10 border-cyan-500/20', label: 'Meta Água', value: perfil?.metaAguaMl ? `${(perfil.metaAguaMl / 1000).toFixed(1)}L` : '—' },
              ].map(({ icon: Icon, color, bg, label, value }) => (
                <div key={label} className="bg-navy-800 border border-navy-700 hover:border-navy-600 rounded-xl p-4 flex items-center gap-3 transition-colors">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${bg} shrink-0`}>
                    <Icon size={16} className={color} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black tracking-widest uppercase text-slate-600 leading-none mb-1">{label}</p>
                    <p className="text-base font-black text-white leading-none truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HIDRATAÇÃO */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-5 bg-game-cyan rounded-full" />
              <span className="text-xs font-black tracking-widest uppercase text-slate-400">Hidratação de Hoje</span>
              <div className="flex-1 h-px bg-navy-700" />
            </div>

            <div className="bg-navy-800 border border-navy-700 rounded-2xl p-5">
              <div className="flex items-center gap-4 mb-5">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border-2 relative overflow-hidden"
                  style={{
                    borderColor: waterProgress >= 100 ? '#f97316' : '#22d3ee',
                    background: waterProgress >= 100 ? 'rgba(249,115,22,.08)' : 'rgba(34,211,238,.08)',
                  }}
                >
                  <Droplets size={20} className={waterProgress >= 100 ? 'text-brand-500' : 'text-game-cyan'} />
                  <div
                    className="absolute bottom-0 left-0 right-0 transition-all duration-700 opacity-20"
                    style={{ height: `${waterProgress}%`, background: waterProgress >= 100 ? '#f97316' : '#22d3ee' }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-2xl font-black text-white tabular-nums">
                      {((hidratacao?.consumidoHojeMl || 0) / 1000).toFixed(2)}
                    </span>
                    <span className="text-slate-500 text-sm font-bold">L</span>
                    <span className="text-slate-600 text-xs ml-1">/ {((hidratacao?.metaDiariaMl || 0) / 1000).toFixed(1)}L</span>
                  </div>
                  <div className="h-2.5 bg-navy-700 rounded-full overflow-hidden border border-navy-600">
                    <div
                      className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
                      style={{
                        width: `${waterProgress}%`,
                        background: waterProgress >= 100
                          ? 'linear-gradient(90deg, #c2410c, #f97316)'
                          : 'linear-gradient(90deg, #0e7490, #22d3ee)',
                      }}
                    >
                      <div className="absolute inset-0 bg-white/20" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">
                    {waterProgress.toFixed(0)}% da meta diária
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {[250, 500].map((ml) => (
                  <button
                    key={ml}
                    onClick={() => addWater(ml)}
                    disabled={addingWater}
                    className="flex items-center gap-1.5 bg-game-cyan/10 hover:bg-game-cyan/20 border border-cyan-500/20 hover:border-cyan-500/40 text-game-cyan font-black tracking-widest uppercase text-[11px] px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
                  >
                    {addingWater ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
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
                    className="flex-1 bg-navy-700 border border-navy-600 text-white placeholder-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-500 transition-colors font-medium"
                  />
                  <button
                    onClick={() => addWater(parseInt(customMl))}
                    disabled={!customMl || addingWater}
                    className="bg-brand-500 hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black tracking-widest uppercase text-[11px] px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-orange-500/20 whitespace-nowrap"
                  >
                    {addingWater ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                    Add
                  </button>
                </div>
              </div>

              {waterProgress >= 100 && (
                <div className="mt-3 flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-xl px-4 py-3">
                  <Flame size={15} className="text-brand-500 shrink-0" />
                  <p className="text-brand-400 text-xs font-black uppercase tracking-widest">Meta diária atingida! Parabéns, herói!</p>
                </div>
              )}
            </div>
          </div>

          {/* AÇÕES RÁPIDAS */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/atividades')}
              className="bg-navy-800 hover:bg-navy-700 border border-navy-700 hover:border-brand-500/30 rounded-2xl p-4 flex items-center gap-3 group transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
                <Activity size={18} className="text-brand-500" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-white font-black text-xs uppercase tracking-widest">Atividades</p>
                <p className="text-slate-600 text-[10px] mt-0.5">Ver corridas</p>
              </div>
              <ChevronRight size={14} className="text-brand-500/50 ml-auto group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/inventario')}
              className="bg-navy-800 hover:bg-navy-700 border border-navy-700 hover:border-game-purple/30 rounded-2xl p-4 flex items-center gap-3 group transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-game-purple/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                <Trophy size={18} className="text-game-purple" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-white font-black text-xs uppercase tracking-widest">Inventário</p>
                <p className="text-slate-600 text-[10px] mt-0.5">Seus itens</p>
              </div>
              <ChevronRight size={14} className="text-game-purple/50 ml-auto group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

        </div>

        {/* ── COLUNA DIREITA — ÚLTIMA CORRIDA ── */}
        <div className="mt-5 lg:mt-0">
          <LastRunMap />
        </div>

      </div>
    </div>
  );
}
