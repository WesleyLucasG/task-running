export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

export function mascararCpf(valor: string): string {
  return somenteDigitos(valor)
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

// RF02: formato e dígitos verificadores (algoritmo da Receita Federal)
export function validarCpf(valor: string): boolean {
  const cpf = somenteDigitos(valor);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // 111.111.111-11 etc.

  const digito = (base: string, pesoInicial: number) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * (pesoInicial - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const d1 = digito(cpf.slice(0, 9), 10);
  const d2 = digito(cpf.slice(0, 10), 11);
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}

export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// RF08 — espelho da regra do Backend (RegraSenha.java), que continua sendo a autoridade final.
// Letras e números seguem as classes Unicode: "é", "ç", "ñ" contam como letra, e não como caractere especial.
// Se o motor JS não suportar \p{...}, usa um equivalente: letra = caractere com maiúscula/minúscula.
function criarRegex(unicode: string, alternativo: RegExp): (c: string) => boolean {
  try {
    const r = new RegExp(unicode, 'u');
    return (c) => r.test(c);
  } catch {
    return (c) => alternativo.test(c);
  }
}
const ehLetraUnicode = criarRegex('^\\p{L}$', /^$/);
const ehLetra = (c: string) => ehLetraUnicode(c) || c.toLowerCase() !== c.toUpperCase();
const ehDigito = criarRegex('^\\p{Nd}$', /^[0-9]$/);
const ehEspaco = (c: string) => /\s/.test(c);

export type RequisitoSenha = { id: string; rotulo: string; mensagem: string; atendido: boolean };

export function requisitosSenha(senha: string): RequisitoSenha[] {
  const chars = Array.from(senha);
  return [
    {
      id: 'tamanho',
      rotulo: 'Mínimo de 8 caracteres',
      mensagem: 'A senha precisa ter no mínimo 8 caracteres.',
      atendido: chars.length >= 8,
    },
    {
      id: 'letra',
      rotulo: 'Pelo menos uma letra',
      mensagem: 'A senha precisa ter ao menos uma letra.',
      atendido: chars.some(ehLetra),
    },
    {
      id: 'numero',
      rotulo: 'Pelo menos um número',
      mensagem: 'A senha precisa ter ao menos um número.',
      atendido: chars.some(ehDigito),
    },
    {
      id: 'especial',
      rotulo: 'Pelo menos um caractere especial',
      mensagem: 'A senha precisa ter ao menos um caractere especial.',
      atendido: chars.some((c) => !ehLetra(c) && !ehDigito(c) && !ehEspaco(c)),
    },
  ];
}

export function validarSenha(senha: string): string | null {
  const pendente = requisitosSenha(senha).find((r) => !r.atendido);
  return pendente ? pendente.mensagem : null;
}