import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import api, { getApiError } from '../services/api';

export default function Register() {
  const [form, setForm] = useState({ nome: '', email: '', cpf: '', senha: '', peso: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', {
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        cpf: form.cpf,
        peso: parseFloat(form.peso),
      });
      toast.success('Conta criada! Faça seu login.');
      navigate('/login');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-navy-700 border border-navy-600 text-white placeholder-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/40 transition-colors font-medium';
  const labelClass = 'block text-xs font-bold tracking-widest uppercase text-slate-400 mb-2';

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-500/4 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-600/4 rounded-full blur-3xl" />
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
          <p className="text-slate-500 mt-2 tracking-widest text-xs uppercase">Comece sua jornada · Nível 1</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 border border-navy-600 shadow-2xl"
          style={{ background: 'linear-gradient(145deg, #0f1724 0%, #141e2e 100%)' }}
        >
          <div className="h-0.5 w-16 bg-gradient-to-r from-brand-500 to-amber-400 rounded-full mb-6" />
          <h2 className="text-xl font-bold tracking-widest uppercase text-white mb-6">
            Criar Conta
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Nome completo</label>
              <input
                type="text"
                value={form.nome}
                onChange={set('nome')}
                placeholder="Seu nome de herói"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="seu@email.com"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>CPF</label>
              <input
                type="text"
                value={form.cpf}
                onChange={(e) => setForm((prev) => ({ ...prev, cpf: formatCPF(e.target.value) }))}
                placeholder="000.000.000-00"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Peso (kg)</label>
              <input
                type="number"
                value={form.peso}
                onChange={set('peso')}
                placeholder="70"
                min="30"
                max="300"
                step="0.1"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.senha}
                  onChange={set('senha')}
                  placeholder="Mínimo 8 caracteres com letras e números"
                  required
                  minLength={8}
                  className={`${inputClass} pr-12`}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold tracking-widest uppercase py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2 shadow-lg shadow-orange-500/20"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-slate-500 mt-6 text-sm">
            Já tem conta?{' '}
            <Link to="/login" className="text-brand-500 hover:text-brand-400 font-bold tracking-wide transition-colors">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
