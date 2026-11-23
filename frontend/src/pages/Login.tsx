import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api, { getApiError } from '../services/api';

export default function Login() {
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { cpf, senha });
      login(data.token);
      toast.success('Bem-vindo de volta, herói!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-100 pointer-events-none" />
      {/* Scanlines */}
      <div className="absolute inset-0 bg-scanlines opacity-10 pointer-events-none" />

      {/* Atmospheric glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-500/6 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-game-cyan/4 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-56 h-56 bg-brand-600/6 rounded-full blur-2xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-5">
            <div className="absolute inset-0 bg-brand-500/40 rounded-2xl blur-xl" />
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-2xl shadow-orange-500/40 bg-white border-2 border-brand-500/30">
              <img src="/logo.jpg" alt="Task Running" className="w-full h-full object-contain" />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-widest uppercase text-white">
            Task<span className="text-brand-500">Running</span>
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-8 h-px bg-brand-500/40" />
            <p className="text-slate-600 tracking-[0.3em] text-[10px] uppercase font-bold">Aventure-se · Evolua · Conquiste</p>
            <div className="w-8 h-px bg-brand-500/40" />
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border border-navy-600 shadow-2xl relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #090f1a 0%, #0d1525 100%)' }}
        >
          {/* Top accent */}
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-brand-500 to-transparent" />

          <div className="p-7">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
                <Zap size={16} className="text-brand-500" />
              </div>
              <h2 className="text-lg font-black tracking-widest uppercase text-white">
                Iniciar Jornada
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black tracking-widest uppercase text-slate-500 mb-2">CPF</label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  required
                  className="w-full bg-navy-700 border border-navy-600 text-white placeholder-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/40 transition-colors font-medium text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-widest uppercase text-slate-500 mb-2">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-navy-700 border border-navy-600 text-white placeholder-slate-700 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/40 transition-colors font-medium text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <Link
                  to="/recuperar-senha"
                  className="text-[10px] font-black tracking-widest uppercase text-brand-500/70 hover:text-brand-500 transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black tracking-widest uppercase py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
                {loading && <Loader2 size={17} className="animate-spin" />}
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-navy-600" />
              <span className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">ou</span>
              <div className="flex-1 h-px bg-navy-600" />
            </div>

            <p className="text-center text-slate-600 text-sm">
              Não tem conta?{' '}
              <Link
                to="/register"
                className="text-brand-500 hover:text-brand-400 font-black tracking-wide transition-colors"
              >
                Cadastre-se
              </Link>
            </p>
          </div>

          {/* Bottom accent */}
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />
        </div>
      </div>
    </div>
  );
}
