// Formatação das metas diárias/semanais (os VALORES vêm do servidor; aqui só a apresentação).
// Função pura, testável no Node (testes/metas.test.mjs).

export type MetaVisivel = {
  progresso: number;
  alvo: number;
  unidade: string;
  concluida: boolean;
};

const numero = (n: number, casas = 0) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

/** "1,4 km / 2 km", "800 / 1.225 ml", "7 / 10 monstros". */
export function textoProgresso(m: MetaVisivel): string {
  if (m.unidade === 'm') {
    const casas = (v: number) => (v % 1000 === 0 ? 0 : 1);
    return `${numero(m.progresso / 1000, casas(m.progresso))} km / ${numero(m.alvo / 1000, casas(m.alvo))} km`;
  }
  return `${numero(m.progresso)} / ${numero(m.alvo)} ${m.unidade}`;
}

export function percentual(m: MetaVisivel): number {
  if (m.alvo <= 0) return m.concluida ? 100 : 0;
  return Math.max(0, Math.min(100, Math.floor((m.progresso / m.alvo) * 100)));
}

/** "renova em 5 h 12 min" / "renova em 2 d 4 h" / "renova em 45 s". */
export function textoRenovacao(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const min = Math.floor((s % 3600) / 60);
  if (d > 0) return `renova em ${d} d ${h} h`;
  if (h > 0) return `renova em ${h} h ${min} min`;
  if (min > 0) return `renova em ${min} min`;
  return `renova em ${s} s`;
}
