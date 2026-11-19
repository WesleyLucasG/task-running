// RF08 — espelho da regra do Backend (backend/.../util/RegraSenha.java), que continua sendo a autoridade final.
// Letras e números seguem as classes Unicode: "é", "ç", "ñ" contam como letra, e não como caractere especial.
export type RequisitoSenha = { id: string; rotulo: string; atendido: boolean };

export function requisitosSenha(senha: string): RequisitoSenha[] {
  return [
    { id: 'tamanho', rotulo: 'Mínimo de 8 caracteres', atendido: [...senha].length >= 8 },
    { id: 'letra', rotulo: 'Pelo menos uma letra', atendido: /\p{L}/u.test(senha) },
    { id: 'numero', rotulo: 'Pelo menos um número', atendido: /\p{Nd}/u.test(senha) },
    { id: 'especial', rotulo: 'Pelo menos um caractere especial', atendido: /[^\p{L}\p{Nd}\s]/u.test(senha) },
  ];
}

export function senhaValida(senha: string): boolean {
  return requisitosSenha(senha).every((r) => r.atendido);
}
