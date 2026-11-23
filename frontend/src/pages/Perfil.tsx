import { useState, useEffect, useCallback, FormEvent } from 'react';
import { toast } from 'sonner';
import {
  Save, Pencil, X, Bell, BellOff, Trash2, Loader2, AlertTriangle, Info,
  Droplets, Coins, Star, Zap, Shield,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { getApiError } from '../services/api';

interface PerfilData {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  peso: number;
  metaAguaMl: number;
}

interface Hidratacao {
  metaDiariaMl: number;
  consumidoHojeMl: number;
  porcentagemConcluida: number;
  lembreteAtivo: boolean;
}

interface Carteira {
  moedas: number;
  experienciaXp: number;
  nivel: number;
}

function getTitle(nivel: number): string {
  if (nivel >= 20) return 'LENDÁRIO';
  if (nivel >= 10) return 'CORREDOR DAS SOMBRAS';
  if (nivel >= 5) return 'CORREDOR DAS RUÍNAS';
  return 'CORREDOR INICIANTE';
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-1 h-5 bg-brand-500 rounded-full" />
      <span className="text-xs font-bold tracking-widest uppercase text-slate-300">{children}</span>
      <div className="flex-1 h-px bg-navy-600" />
    </div>
  );
}

export default function PerfilPage() {
  const [perfil, setPerfil] = useState<PerfilData | null>(null);
  const [hidratacao, setHidratacao] = useState<Hidratacao | null>(null);
  const [carteira, setCarteira] = useState<Carteira | null>(null);
  const [avatarEquipado, setAvatarEquipado] = useState<Avatar | null>(null);
  const [loadingPerfil, setLoadingPerfil] = useState(true);
  const [loadingHidratacao, setLoadingHidratacao] = useState(true);
  const [loadingCarteira, setLoadingCarteira] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [nome, setNome] = useState('');
  const [peso, setPeso] = useState('');
  const [savingPerfil, setSavingPerfil] = useState(false);
  const [avatarEquipado] = useState<null>(null);
  const [togglingLembrete, setTogglingLembrete] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const fetchPerfil = useCallback(async () => {
    setLoadingPerfil(true);
    try {
      const res = await api.get('/api/perfil');
      setPerfil(res.data);
      setNome(res.data.nome ?? '');
      setPeso(String(res.data.peso ?? ''));
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoadingPerfil(false);
    }
  }, []);

  const fetchHidratacao = useCallback(async () => {
    setLoadingHidratacao(true);
    try {
      const res = await api.get('/api/hidratacao');
      setHidratacao(res.data);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoadingHidratacao(false);
    }
  }, []);

  useEffect(() => {
    fetchPerfil();
    fetchHidratacao();
    api.get('/api/gamificacao/carteira').then((r) => setCarteira(r.data)).catch(() => {});
  }, [fetchPerfil, fetchHidratacao]);

  const handleEnterEdit = () => {
    if (perfil) { setNome(perfil.nome ?? ''); setPeso(String(perfil.peso ?? '')); }
    setEditMode(true);
  };

  const handleSavePerfil = async (e: FormEvent) => {
    e.preventDefault();
    setSavingPerfil(true);
    try {
      await api.put('/api/perfil', { nome, peso: parseFloat(peso) });
      toast.success('Perfil atualizado!');
      setEditMode(false);
      await fetchPerfil();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSavingPerfil(false);
    }
  };

  const handleToggleLembrete = async () => {
    if (!hidratacao) return;
    setTogglingLembrete(true);
    const novoValor = !hidratacao.lembreteAtivo;
    try {
      await api.patch('/api/hidratacao/lembrete', { lembreteAtivo: novoValor });
      setHidratacao((prev) => (prev ? { ...prev, lembreteAtivo: novoValor } : prev));
      toast.success(novoValor ? 'Lembrete ativado!' : 'Lembrete desativado!');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setTogglingLembrete(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/api/perfil');
      logout();
      toast.success('Conta desativada.');
      navigate('/login');
    } catch (err) {
      toast.error(getApiError(err));
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const novaMetaAgua = peso ? (parseFloat(peso) * 35).toFixed(0) : null;
  const pesoChanged = perfil && !isNaN(parseFloat(peso)) && parseFloat(peso) !== perfil.peso;
  const nivel = carteira?.nivel || 1;
  const xpForNextLevel = nivel * 1000;
  const xpProgress = carteira ? Math.min((carteira.experienciaXp / xpForNextLevel) * 100, 100) : 0;
  const title = getTitle(nivel);

  const inputClass =
    'w-full bg-navy-700 border border-navy-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/40 transition-colors font-medium';
  const labelClass = 'block text-xs font-bold tracking-widest uppercase text-slate-400 mb-2';

  return (
    <div className="space-y-5 max-w-2xl">

      {/* ── PROFILE BANNER ── */}
      <div
        className="rounded-2xl border border-navy-600 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f1724 0%, #141e2e 50%, #1a2740 100%)' }}
      >
        <div className="h-1 w-full bg-gradient-to-r from-brand-600 via-brand-500 to-amber-400" />

        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            {/* Avatar */}
            <div className="relative shrink-0 self-start">
              <div className="w-20 h-20 rounded-2xl bg-navy-700 border-2 border-brand-500/60 overflow-hidden shadow-xl shadow-orange-500/20">
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-3xl">🧙</span>
                </div>
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 bg-brand-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg leading-none shadow-md">
                {nivel}
              </div>
            </div>

            {/* Name + title + XP */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 bg-brand-500/15 border border-brand-500/30 text-brand-400 text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-md">
                  <Shield size={10} />
                  {title}
                </span>
              </div>
              {loadingPerfil ? (
                <div className="h-7 w-40 bg-navy-700 rounded-lg animate-pulse mb-1" />
              ) : (
                <h1 className="text-2xl font-bold uppercase tracking-wider text-white truncate leading-tight">
                  {perfil?.nome?.split(' ')[0] || 'Atleta'}
                </h1>
              )}
              <p className="text-xs text-slate-500 truncate mb-3">{perfil?.email}</p>

              {/* XP bar */}
              <div>
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

            {/* Coins badge */}
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl self-start sm:self-auto">
              <Coins size={16} className="text-amber-400" />
              <span className="text-amber-400 font-bold text-base tabular-nums">
                {carteira?.moedas?.toLocaleString('pt-BR') || 0}
              </span>
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
            { icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', label: 'Peso', value: loadingPerfil ? '—' : perfil?.peso ? `${perfil.peso} kg` : '—' },
            { icon: Droplets, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', label: 'Meta Água', value: loadingPerfil ? '—' : perfil?.metaAguaMl ? `${(perfil.metaAguaMl / 1000).toFixed(1)}L` : '—' },
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

      {/* ── DADOS PESSOAIS ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-brand-500 rounded-full" />
            <span className="text-xs font-bold tracking-widest uppercase text-slate-300">Dados pessoais</span>
            <div className="flex-1 h-px bg-navy-600" />
          </div>
          {!editMode && !loadingPerfil && (
            <button
              onClick={handleEnterEdit}
              className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-brand-500 hover:text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 px-3 py-1.5 rounded-lg transition-all ml-4 shrink-0"
            >
              <Pencil size={12} />
              Editar
            </button>
          )}
        </div>

        <div className="bg-navy-800 rounded-2xl border border-navy-600 p-5">
          {loadingPerfil ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="h-3 bg-navy-600 rounded w-24 mb-1.5" />
                  <div className="h-11 bg-navy-700 rounded-xl" />
                </div>
              ))}
            </div>
          ) : !editMode ? (
            <div className="space-y-4">
              {[
                { label: 'Nome completo', value: perfil?.nome ?? '' },
                { label: 'E-mail', value: perfil?.email ?? '' },
                { label: 'CPF', value: perfil?.cpf ?? '' },
                { label: 'Peso', value: perfil?.peso ? `${perfil.peso} kg` : '' },
                { label: 'Meta diária de água', value: perfil?.metaAguaMl ? `${perfil.metaAguaMl} ml · ${(perfil.metaAguaMl / 1000).toFixed(2)} L` : '' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-1">{label}</p>
                  <p className="text-white font-semibold py-2.5 px-4 bg-navy-700 rounded-xl border border-navy-600 truncate">{value || '—'}</p>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSavePerfil} className="space-y-4">
              <div>
                <label className={labelClass}>Nome completo</label>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>E-mail</label>
                <input type="email" value={perfil?.email ?? ''} disabled className="w-full bg-navy-700/50 border border-navy-600 text-slate-500 rounded-xl px-4 py-3 cursor-not-allowed" />
              </div>
              <div>
                <label className={labelClass}>CPF</label>
                <input type="text" value={perfil?.cpf ?? ''} disabled className="w-full bg-navy-700/50 border border-navy-600 text-slate-500 rounded-xl px-4 py-3 cursor-not-allowed" />
              </div>
              <div>
                <label className={labelClass}>Peso (kg)</label>
                <input type="number" value={peso} onChange={(e) => setPeso(e.target.value)} min="30" max="300" step="0.1" required className={inputClass} />
              </div>

              {pesoChanged && novaMetaAgua && (
                <div className="flex items-start gap-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <Droplets size={16} className="text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-blue-300 text-sm">
                    Meta de hidratação será recalculada para <span className="font-bold text-blue-200">{novaMetaAgua} ml</span>.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={savingPerfil} className="flex items-center gap-2 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-white font-bold tracking-widest uppercase text-xs py-2.5 px-5 rounded-xl transition-colors shadow-md shadow-orange-500/20">
                  {savingPerfil ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {savingPerfil ? 'Salvando...' : 'Salvar'}
                </button>
                <button type="button" onClick={() => setEditMode(false)} disabled={savingPerfil} className="flex items-center gap-2 bg-navy-700 hover:bg-navy-600 text-slate-300 font-bold tracking-widest uppercase text-xs py-2.5 px-5 rounded-xl transition-colors">
                  <X size={16} />
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── NOTIFICAÇÕES ── */}
      <div>
        <SectionHeader>Notificações</SectionHeader>
        <div className="bg-navy-800 rounded-2xl border border-navy-600 p-5">
          {loadingHidratacao ? (
            <div className="h-14 bg-navy-700 rounded-xl animate-pulse" />
          ) : (
            <div className="flex items-center justify-between p-4 bg-navy-700 rounded-xl border border-navy-600">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                  hidratacao?.lembreteAtivo
                    ? 'bg-blue-500/10 border-blue-500/20'
                    : 'bg-navy-600 border-navy-500'
                }`}>
                  {hidratacao?.lembreteAtivo
                    ? <Bell size={17} className="text-blue-400" />
                    : <BellOff size={17} className="text-slate-500" />
                  }
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Lembrete de hidratação</p>
                  <p className="text-slate-500 text-xs">
                    {hidratacao?.lembreteAtivo ? 'Ativo — alertas para beber água' : 'Desativado'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleLembrete}
                disabled={togglingLembrete}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  hidratacao?.lembreteAtivo ? 'bg-brand-500' : 'bg-navy-600'
                } ${togglingLembrete ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    hidratacao?.lembreteAtivo ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── ZONA DE PERIGO ── */}
      <div>
        <SectionHeader>Zona de Perigo</SectionHeader>
        <div className="bg-navy-800 rounded-2xl border border-red-900/40 p-5">
          <div className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-xl mb-4">
            <Info size={15} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-slate-400 text-sm">
              Desativar sua conta encerrará sua sessão imediatamente. Pode ser revertida ao criar uma nova conta com o mesmo CPF.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-bold tracking-widest uppercase text-xs py-2.5 px-5 rounded-xl transition-all"
          >
            <Trash2 size={16} />
            Desativar conta
          </button>
        </div>
      </div>

      {/* ── MODAL DELETE ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-navy-800 border border-navy-600 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
                <h3 className="text-white font-bold tracking-widest uppercase text-sm">Desativar conta</h3>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <p className="text-slate-400 mb-6 text-sm">Tem certeza que deseja desativar sua conta? Sua sessão será encerrada imediatamente.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 bg-navy-700 hover:bg-navy-600 text-white font-bold tracking-wide uppercase text-xs py-2.5 rounded-xl transition-colors">
                Cancelar
              </button>
              <button onClick={handleDeleteAccount} disabled={deleting} className="flex-1 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-bold tracking-wide uppercase text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                {deleting && <Loader2 size={14} className="animate-spin" />}
                {deleting ? 'Desativando...' : 'Sim, desativar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
