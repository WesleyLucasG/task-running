// Aviso simples de "dados do jogador mudaram" (moedas, itens), para o cabeçalho
// e outras telas recarregarem na hora, sem esperar trocar de tela.
type Ouvinte = () => void;
const ouvintes = new Set<Ouvinte>();

export function avisarJogadorAlterado(): void {
  ouvintes.forEach((o) => o());
}

export function ouvirJogadorAlterado(o: Ouvinte): () => void {
  ouvintes.add(o);
  return () => {
    ouvintes.delete(o);
  };
}
