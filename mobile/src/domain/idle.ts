// Motor da "esteira" idle (inspirada em RPGs idle de corredor lateral).
// Lógica pura, sem React: a tela chama `passo()` em intervalos fixos e desenha o estado.
//
// Regras (decisão D15 do PROGRESSO.md):
// - O herói anda sozinho da esquerda para a direita e luta com os monstros da fase.
// - Morreu: volta ao início da fase com vida cheia.
// - Chegou ao fim: encontra o chefe. Ele só pode ser enfrentado se o documento permitir
//   (meta de distância RF21 + atividade recente). Caso contrário o chefe está "selado"
//   e a volta recomeça.
// - O dano total contra o chefe em cada confronto é limitado pela fórmula RN12
//   ("Energia Divina"); a vida do chefe é persistida pela tela (RN15).
// Importante: este arquivo só usa `import type` para poder ser testado com Node puro.

export const COMPRIMENTO_FASE = 100;
export const POSICOES_MONSTROS = [14, 26, 38, 50, 62, 74, 86];
export const POSICAO_CHEFE = 96;
const ALCANCE = 5; // distância em que a luta começa
const VELOCIDADE = 7; // unidades por segundo
const PAUSA_MS = 1600; // tempo das mensagens de morte, selo e recuo

export type Pontos = { forca: number; vitalidade: number; velocidade: number };

export type BaseHeroi = {
  forcaBase: number; // cresce com o nível (RF19)
  vidaMaxima: number;
  bonusForca: number; // itens equipados (RF26)
  bonusVida: number;
  pontos: Pontos;
};

export type StatsHeroi = { dano: number; vidaMax: number; intervaloMs: number };

export const PONTOS_POR_KM = 2;
export const DANO_POR_PONTO_FORCA = 2;
export const VIDA_POR_PONTO_VITALIDADE = 10;

export function calcularStatsHeroi(b: BaseHeroi): StatsHeroi {
  return {
    dano: b.forcaBase + b.bonusForca + b.pontos.forca * DANO_POR_PONTO_FORCA,
    vidaMax: b.vidaMaxima + b.bonusVida + b.pontos.vitalidade * VIDA_POR_PONTO_VITALIDADE,
    intervaloMs: Math.max(350, Math.round(1000 / (1 + b.pontos.velocidade * 0.05))),
  };
}

export function pontosGanhos(distanciaTotalMetros: number): number {
  return Math.floor((Math.max(0, distanciaTotalMetros) / 1000) * PONTOS_POR_KM);
}

// Tabela A aprovada (vida e dano dos monstros comuns por fase). Simulação com este motor:
// fase 1 vencível no nível 1, fase 2 no 2, fase 3 no 4, fase 4 no 7 (ou 5 com itens comuns),
// fase 5 no 10 (ou 8 com itens raros).
export const VIDA_MONSTRO = [25, 40, 58, 80, 105];
export const DANO_MONSTRO = [4, 6, 8, 11, 14];

export function statsMonstro(fase: number) {
  const i = Math.min(VIDA_MONSTRO.length - 1, Math.max(0, Math.floor(fase) - 1));
  return { vidaMax: VIDA_MONSTRO[i], dano: DANO_MONSTRO[i], intervaloMs: 1200 };
}

export function statsChefe(fase: number) {
  return { dano: Math.round(7 * Math.pow(1.5, fase - 1)), intervaloMs: 1500 };
}

export type ContextoChefe = {
  podeEnfrentar: boolean; // RF21 + atividade recente (motivoBloqueio === null)
  motivo: string | null;
  vidaAtual: number; // RN15: persistida no banco
  vidaMax: number;
  limiteDano: number; // RN12: dano máximo neste confronto ("Energia Divina")
};

export type Contexto = { fase: number; heroi: StatsHeroi; chefe: ContextoChefe };

export type Inimigo = {
  id: number;
  pos: number;
  vida: number;
  vidaMax: number;
  dano: number;
  intervaloMs: number;
  recarga: number;
  chefe: boolean;
};

export type Modo = 'ANDANDO' | 'LUTANDO' | 'MORTO' | 'SELADO' | 'RECUO' | 'VITORIA';

export type TextoFlutuante = { id: number; alvo: number | 'heroi'; valor: number; criadoEm: number };

export type Estado = {
  tempo: number;
  pos: number;
  vida: number;
  recarga: number;
  modo: Modo;
  pausa: number;
  inimigos: Inimigo[];
  danoNoConfronto: number;
  confrontoAtivo: boolean;
  ultimoGolpe: number; // instante do último golpe do herói (para animar a investida)
  textos: TextoFlutuante[];
  proximoId: number;
};

export type Evento =
  | { tipo: 'MONSTRO_DERROTADO'; pos: number }
  | { tipo: 'HEROI_DERROTADO' }
  | { tipo: 'CHEFE_SELADO'; motivo: string }
  | { tipo: 'CONFRONTO_FIM'; dano: number; derrotado: boolean; causa: 'VITORIA' | 'ENERGIA' | 'MORTE' };

function gerarMonstros(fase: number, primeiroId: number): Inimigo[] {
  const s = statsMonstro(fase);
  return POSICOES_MONSTROS.map((pos, i) => ({
    id: primeiroId + i,
    pos,
    vida: s.vidaMax,
    vidaMax: s.vidaMax,
    dano: s.dano,
    intervaloMs: s.intervaloMs,
    recarga: s.intervaloMs / 2,
    chefe: false,
  }));
}

export function novaVolta(ctx: Contexto, anterior?: Estado): Estado {
  const id = anterior?.proximoId ?? 1;
  return {
    tempo: anterior?.tempo ?? 0,
    pos: 0,
    vida: ctx.heroi.vidaMax,
    recarga: 0,
    modo: 'ANDANDO',
    pausa: 0,
    inimigos: gerarMonstros(ctx.fase, id),
    danoNoConfronto: 0,
    confrontoAtivo: false,
    ultimoGolpe: -9999,
    textos: [],
    proximoId: id + POSICOES_MONSTROS.length + 1,
  };
}

// Variação de ±15% no golpe para a luta não ficar mecânica
function variar(valor: number, aleatorio: () => number) {
  return Math.max(1, Math.round(valor * (0.85 + aleatorio() * 0.3)));
}

export function passo(
  e0: Estado,
  dtMs: number,
  ctx: Contexto,
  aleatorio: () => number = Math.random,
): { estado: Estado; eventos: Evento[] } {
  const e: Estado = { ...e0, inimigos: e0.inimigos.map((i) => ({ ...i })), textos: [...e0.textos] };
  const eventos: Evento[] = [];
  e.tempo += dtMs;
  e.textos = e.textos.filter((t) => e.tempo - t.criadoEm < 900);

  const texto = (alvo: number | 'heroi', valor: number) => {
    e.textos.push({ id: e.proximoId++, alvo, valor, criadoEm: e.tempo });
  };

  // Pausas (morte, selo, recuo): ao terminar, a volta recomeça
  if (e.modo === 'MORTO' || e.modo === 'SELADO' || e.modo === 'RECUO') {
    e.pausa -= dtMs;
    if (e.pausa <= 0) return { estado: { ...novaVolta(ctx, e), textos: e.textos }, eventos };
    return { estado: e, eventos };
  }
  if (e.modo === 'VITORIA') return { estado: e, eventos };

  // A vida máxima pode ter mudado (item equipado, ponto distribuído)
  e.vida = Math.min(e.vida, ctx.heroi.vidaMax);

  const alvo = e.inimigos.find((i) => i.vida > 0);

  // Fim da fase: hora do chefe
  if (!alvo && e.pos >= POSICAO_CHEFE - ALCANCE - 0.01 && !e.confrontoAtivo) {
    if (!ctx.chefe.podeEnfrentar || ctx.chefe.vidaAtual <= 0 || ctx.chefe.limiteDano <= 0) {
      e.modo = 'SELADO';
      e.pausa = PAUSA_MS * 1.5;
      eventos.push({ tipo: 'CHEFE_SELADO', motivo: ctx.chefe.motivo ?? 'O chefe está selado.' });
      return { estado: e, eventos };
    }
    const s = statsChefe(ctx.fase);
    e.inimigos.push({
      id: e.proximoId++,
      pos: POSICAO_CHEFE,
      vida: ctx.chefe.vidaAtual,
      vidaMax: ctx.chefe.vidaMax,
      dano: s.dano,
      intervaloMs: s.intervaloMs,
      recarga: s.intervaloMs,
      chefe: true,
    });
    e.confrontoAtivo = true;
    e.danoNoConfronto = 0;
    return { estado: e, eventos };
  }

  const inimigo = e.inimigos.find((i) => i.vida > 0);
  const limite = inimigo ? inimigo.pos - ALCANCE : POSICAO_CHEFE - ALCANCE;

  if (e.pos < limite) {
    e.modo = 'ANDANDO';
    e.pos = Math.min(limite, e.pos + (VELOCIDADE * dtMs) / 1000);
    e.recarga = Math.max(0, e.recarga - dtMs);
    return { estado: e, eventos };
  }
  if (!inimigo) return { estado: e, eventos };

  // Luta: cada lado golpeia quando a recarga zera
  e.modo = 'LUTANDO';
  e.recarga -= dtMs;
  if (e.recarga <= 0) {
    e.recarga += ctx.heroi.intervaloMs;
    let golpe = variar(ctx.heroi.dano, aleatorio);
    if (inimigo.chefe) golpe = Math.min(golpe, ctx.chefe.limiteDano - e.danoNoConfronto); // RN12
    golpe = Math.min(golpe, inimigo.vida);
    inimigo.vida -= golpe;
    e.ultimoGolpe = e.tempo;
    texto(inimigo.id, golpe);
    if (inimigo.chefe) e.danoNoConfronto += golpe;

    if (inimigo.vida <= 0) {
      if (inimigo.chefe) {
        e.modo = 'VITORIA';
        eventos.push({ tipo: 'CONFRONTO_FIM', dano: e.danoNoConfronto, derrotado: true, causa: 'VITORIA' });
      } else {
        eventos.push({ tipo: 'MONSTRO_DERROTADO', pos: inimigo.pos });
      }
      return { estado: e, eventos };
    }
    if (inimigo.chefe && e.danoNoConfronto >= ctx.chefe.limiteDano) {
      // Energia Divina esgotada: o herói recua e precisa de nova atividade física
      e.modo = 'RECUO';
      e.pausa = PAUSA_MS;
      eventos.push({ tipo: 'CONFRONTO_FIM', dano: e.danoNoConfronto, derrotado: false, causa: 'ENERGIA' });
      return { estado: e, eventos };
    }
  }

  inimigo.recarga -= dtMs;
  if (inimigo.recarga <= 0) {
    inimigo.recarga += inimigo.intervaloMs;
    const golpe = variar(inimigo.dano, aleatorio);
    e.vida = Math.max(0, e.vida - golpe);
    texto('heroi', golpe);
    if (e.vida <= 0) {
      e.modo = 'MORTO';
      e.pausa = PAUSA_MS;
      eventos.push({ tipo: 'HEROI_DERROTADO' });
      if (inimigo.chefe) {
        eventos.push({ tipo: 'CONFRONTO_FIM', dano: e.danoNoConfronto, derrotado: false, causa: 'MORTE' });
      }
    }
  }
  return { estado: e, eventos };
}

export function progressoDaVolta(e: Estado): number {
  return Math.min(1, e.pos / (POSICAO_CHEFE - ALCANCE));
}
