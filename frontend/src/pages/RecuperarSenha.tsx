import { useState, FormEvent, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Zap, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import api, { getApiError } from '../services/api';
import RequisitosSenha from '../components/RequisitosSenha';
import { senhaValida } from '../utils/senha';

const MENSAGEM_GENERICA =
  'Se o e-mail informado estiver cadastrado, você receberá as instruções em instantes. Verifique também a caixa de spam.';

export default function RecuperarSenha() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') ?? '';

  const [step, setStep] = useState<1 | 2>(tokenFromUrl ? 2 : 1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(tokenFromUrl);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      setStep(2);
    }
  }, [tokenFromUrl]);

  // RF08: só libera o envio com senha válida e confirmada (o Backend valida de novo)
  const senhaOk = senhaValida(novaSenha);
  const confirmacaoOk = confirmarSenha.length > 0 && confirmarSenha === novaSenha;
  const podeRedefinir = senhaOk && confirmacaoOk && token.trim().length > 0 && !loading;

  const handleStep1 = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      // Resposta genérica (não revela se o e-mail existe). "tokenTeste" só vem em desenvolvimento.
      const recoveryToken = res.data?.tokenTeste || '';
      toast.success(res.data?.mensagem || MENSAGEM_GENERICA, { duration: 8000 });
      if (recoveryToken) {
        setToken(recoveryToken);
        toast.info(`Token de teste (desenvolvimento): ${recoveryToken}`, { duration: 10000 });
      }
      setStep(2);
    } catch (err) {
      // Ex.: 503 quando o provedor de e-mail falhou — nunca apresentar como enviado
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e: FormEvent) => {
    e.preventDefault();
    if (!senhaOk) {
      toast.error('A senha ainda não atende a todos os requisitos.');
      return;
    }
    if (!confirmacaoOk) {
      toast.error('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token: token.trim(), novaSenha });
      setDone(true);
      toast.success('Senha redefinida com sucesso!');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl mb-4">
            <Zap size={32} className="text-black" />
          </div>
          <h1 className="text-3xl font-bold text-white">
            Task<span className="text-emerald-400">Running</span>
          </h1>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Senha redefinida!</h2>
              <p className="text-gray-400 mb-6">Sua senha foi alterada com sucesso.</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Ir para o login
              </Link>
            </div>
          ) : (
            <>
              {/* Step indicator */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 1 ? 'bg-emerald-500 text-black' : 'bg-emerald-500/20 text-emerald-400'}`}>1</div>
                <div className={`flex-1 h-0.5 ${step === 2 ? 'bg-emerald-500' : 'bg-gray-700'}`} />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 2 ? 'bg-emerald-500 text-black' : 'bg-gray-700 text-gray-500'}`}>2</div>
              </div>

              {step === 1 ? (
                <>
                  <h2 className="text-xl font-semibold text-white mb-2">Recuperar senha</h2>
                  <p className="text-gray-400 text-sm mb-6">Informe seu e-mail para receber o link de recuperação (válido por 15 minutos).</p>
                  <form onSubmit={handleStep1} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">E-mail</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        required
                        className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 size={18} className="animate-spin" />}
                      {loading ? 'Enviando...' : 'Enviar link'}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-white mb-2">Nova senha</h2>
                  <p className="text-gray-400 text-sm mb-6">
                    {tokenFromUrl
                      ? 'Defina sua nova senha.'
                      : 'Cole o código recebido por e-mail e defina uma nova senha.'}
                  </p>
                  <form onSubmit={handleStep2} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Código de recuperação</label>
                      <input
                        type="text"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Código recebido por e-mail"
                        required
                        className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Nova senha</label>
                      <input
                        type="password"
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        placeholder="Crie uma senha forte"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        aria-invalid={novaSenha.length > 0 && !senhaOk}
                        className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Confirmar nova senha</label>
                      <input
                        type="password"
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                        placeholder="Repita a nova senha"
                        required
                        autoComplete="new-password"
                        aria-invalid={confirmarSenha.length > 0 && !confirmacaoOk}
                        className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                      />
                      <RequisitosSenha senha={novaSenha} confirmacao={confirmarSenha} />
                    </div>
                    <button
                      type="submit"
                      disabled={!podeRedefinir}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 size={18} className="animate-spin" />}
                      {loading ? 'Salvando...' : 'Redefinir senha'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-full text-gray-400 hover:text-white py-2 flex items-center justify-center gap-2 transition-colors"
                    >
                      <ArrowLeft size={16} /> Pedir novo link
                    </button>
                  </form>
                </>
              )}
            </>
          )}

          <p className="text-center text-gray-400 mt-6">
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors inline-flex items-center gap-1">
              <ArrowLeft size={14} /> Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
