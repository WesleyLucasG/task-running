import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-500/4 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-600/4 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-56 h-56 bg-brand-600/4 rounded-full blur-2xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-brand-500/30 rounded-2xl blur-xl" />
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-lg shadow-orange-500/40 bg-white">
              <img src="/logo.jpg" alt="Task Running" className="w-full h-full object-contain" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-widest uppercase text-white">
            Task<span className="text-brand-500">Running</span>
          </h1>
          <p className="text-slate-500 mt-2 tracking-widest text-xs uppercase">Aventure-se · Evolua · Conquiste</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 border border-navy-600 shadow-2xl"
          style={{ background: 'linear-gradient(145deg, #0f1724 0%, #141e2e 100%)' }}
        >
          <div className="h-0.5 w-16 bg-gradient-to-r from-brand-500 to-amber-400 rounded-full mb-6" />
          <h2 className="text-xl font-bold tracking-widest uppercase text-white mb-6">
            Iniciar Jornada
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">CPF</label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                required
                className="w-full bg-navy-700 border border-navy-600 text-white placeholder-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/40 transition-colors font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-navy-700 border border-navy-600 text-white placeholder-slate-600 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/40 transition-colors font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link
                to="/recuperar-senha"
                className="text-xs font-bold tracking-widest uppercase text-brand-500 hover:text-brand-400 transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold tracking-widest uppercase py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-slate-500 mt-6 text-sm">
            Não tem conta?{' '}
            <Link
              to="/register"
              className="text-brand-500 hover:text-brand-400 font-bold tracking-wide transition-colors"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
