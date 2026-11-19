import { Check, X } from 'lucide-react';
import { requisitosSenha, senhaValida } from '../utils/senha';

type Props = {
  senha: string;
  confirmacao?: string; // quando informado, também mostra se as senhas coincidem
};

// Checklist RF08 atualizado a cada tecla. Cores neutras para servir tanto ao cadastro quanto à redefinição.
export default function RequisitosSenha({ senha, confirmacao }: Props) {
  const requisitos = requisitosSenha(senha);
  const valida = senhaValida(senha);

  return (
    <div className="mt-2 text-sm" aria-live="polite">
      <p className="text-slate-400 mb-1.5 font-medium">
        Sua senha deve conter:
        {senha.length > 0 && (
          <span className={`ml-2 text-xs font-bold ${valida ? 'text-emerald-400' : 'text-amber-400'}`}>
            {valida ? 'Senha válida' : 'Senha ainda não é válida'}
          </span>
        )}
      </p>
      <ul className="space-y-1">
        {requisitos.map((r) => (
          <li
            key={r.id}
            className={`flex items-center gap-2 transition-colors ${r.atendido ? 'text-emerald-400' : 'text-slate-500'}`}
          >
            {r.atendido ? <Check size={14} aria-hidden /> : <X size={14} aria-hidden />}
            <span>{r.rotulo}</span>
            <span className="sr-only">{r.atendido ? '(atendido)' : '(pendente)'}</span>
          </li>
        ))}
      </ul>
      {confirmacao !== undefined && confirmacao.length > 0 && confirmacao !== senha && (
        <p className="mt-2 text-red-400 flex items-center gap-2" role="alert">
          <X size={14} aria-hidden /> As senhas não coincidem.
        </p>
      )}
      {confirmacao !== undefined && confirmacao.length > 0 && confirmacao === senha && (
        <p className="mt-2 text-emerald-400 flex items-center gap-2">
          <Check size={14} aria-hidden /> As senhas coincidem.
        </p>
      )}
    </div>
  );
}
