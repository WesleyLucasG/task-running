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

// RF08: mínimo 8 caracteres, com letra, número e caractere especial
export function validarSenha(senha: string): string | null {
  if (senha.length < 8) return 'A senha precisa ter no mínimo 8 caracteres.';
  if (!/[A-Za-z]/.test(senha)) return 'A senha precisa ter ao menos uma letra.';
  if (!/\d/.test(senha)) return 'A senha precisa ter ao menos um número.';
  if (!/[^A-Za-z0-9]/.test(senha)) return 'A senha precisa ter ao menos um caractere especial.';
  return null;
}