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

// Balanceamento v1.1 (final): 10/15/20/25/30 monstros comuns por fase, sempre o monstro da fase.
// O espaçamento entre eles não mudou (12 unidades), então o ritmo máximo de abates continua o mesmo
// medido para os limites do servidor (RegrasMonstro); a fase só fica mais longa.
export const QUANTIDADE_MONSTROS = [10, 15, 20, 25, 30];
const PRIMEIRO_MONSTRO = 14;
const ESPACAMENTO = 12;
const DISTANCIA_CHEFE = 10; // do último monstro até o chefe

const indiceFase = (fase: number) => Math.min(QUANTIDADE_MONSTROS.length - 1, Math.max(0, Math.floor(fase) - 1));
export function quantidadeMonstros(fase: number): number {
  return QUANTIDADE_MONSTROS[indiceFase(fase)];
}
export function posicoesMonstros(fase: number): number[] {
  return Array.from({ length: quantidadeMonstros(fase) }, (_, i) => PRIMEIRO_MONSTRO + i * ESPACAMENTO);
}
export function posicaoChefe(fase: number): number {
  return PRIMEIRO_MONSTRO + (quantidadeMonstros(fase) - 1) * ESPACAMENTO + DISTANCIA_CHEFE;
}
const ALCANCE = 5; // distância em que a luta começa
const VELOCIDADE = 7; // unidades por segundo
const PAUSA_MS = 1600; // tempo das mensagens de morte, selo e recuo

export type Pontos = { forca: number; vitalidade: number; velocidade: number };

export type BaseHeroi = {
  forcaBase: number; // cresce com o nível (RF19), vem do servidor
  vidaMaxima: number; // vida do nível (sem itens), vem do servidor
  agilidade?: number; // agilidade do nível (D42), vem do servidor
  bonusForca: number; // itens equipados (RF26)
  bonusVida: number;
  bonusArmadura?: number;
  bonusAgilidade?: number;
  pontos: Pontos; // só no modo local (sem servidor); no modo API é sempre zero
  // Modo API: valores já calculados pelo servidor (RegrasAvatar). Quando vêm, o app NÃO recalcula.
  servidor?: { intervaloAtaqueMs: number; reducaoDano: number };
};

// reducaoDano: fração (0 a REDUCAO_MAXIMA) do golpe recebido que a armadura absorve
export type StatsHeroi = { dano: number; vidaMax: number; intervaloMs: number; reducaoDano: number; armadura: number; agilidade: number };

export const PONTOS_POR_KM = 2;
export const DANO_POR_PONTO_FORCA = 2;
export const VIDA_POR_PONTO_VITALIDADE = 10;

// Fórmulas iguais às do servidor (RegrasAvatar.intervaloAtaqueMs / reducaoDano). No modo API o app usa
// os números que o servidor manda; estas funções ficam para o modo local e para os testes.
export const INTERVALO_BASE_MS = 1000;
export const INTERVALO_MINIMO_MS = 700; // teto de 30% de redução: ataques nunca ficam descontrolados
export const REDUCAO_MAXIMA = 0.6; // a armadura nunca absorve mais de 60% de um golpe
const CONSTANTE_ARMADURA = 40; // armadura 40 = 50% de redução (antes do teto)

export function intervaloAtaque(agilidadeTotal: number): number {
  return Math.max(INTERVALO_MINIMO_MS, Math.round(INTERVALO_BASE_MS / (1 + Math.max(0, agilidadeTotal) * 0.01)));
}
export function reducaoPorArmadura(armadura: number): number {
  const a = Math.max(0, armadura);
  return Math.min(REDUCAO_MAXIMA, a / (a + CONSTANTE_ARMADURA));
}
/** Golpe recebido depois da armadura: nunca negativo nem zero (mínimo 1). */
export function danoRecebido(golpe: number, reducao: number): number {
  return Math.max(1, Math.round(golpe * (1 - Math.min(REDUCAO_MAXIMA, Math.max(0, reducao)))));
}

export function calcularStatsHeroi(b: BaseHeroi): StatsHeroi {
  const armadura = b.bonusArmadura ?? 0;
  const agilidade = (b.agilidade ?? 0) + (b.bonusAgilidade ?? 0) + b.pontos.velocidade * 5;
  return {
    dano: b.forcaBase + b.bonusForca + b.pontos.forca * DANO_POR_PONTO_FORCA,
    vidaMax: b.vidaMaxima + b.bonusVida + b.pontos.vitalidade * VIDA_POR_PONTO_VITALIDADE,
    intervaloMs: b.servidor?.intervaloAtaqueMs ?? intervaloAtaque(agilidade),
    reducaoDano: b.servidor?.reducaoDano ?? reducaoPorArmadura(armadura),
    armadura,
    agilidade,
  };
}

export function pontosGanhos(distanciaTotalMetros: number): number {
  return Math.floor((Math.max(0, distanciaTotalMetros) / 1000) * PONTOS_POR_KM);
}

// Balanceamento final (vida e dano dos monstros comuns e dano do chefe por fase). Ver a simulação em
// testes/simular-balanceamento.mjs e o relatório em PROGRESSO.md (D45).
export const VIDA_MONSTRO = [18, 30, 45, 62, 78];
export const DANO_MONSTRO = [2, 3, 4, 5, 5];
export const INTERVALO_MONSTRO_MS = [1200, 1200, 1200, 1200, 1200];
export const DANO_CHEFE = [3, 5, 7, 9, 12];

export function statsMonstro(fase: number) {
  const i = indiceFase(fase);
  return { vidaMax: VIDA_MONSTRO[i], dano: DANO_MONSTRO[i], intervaloMs: INTERVALO_MONSTRO_MS[i] };
}

export function statsChefe(fase: number) {
  return { dano: DANO_CHEFE[indiceFase(fase)], intervaloMs: 1500 };
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
  vidaMaxConhecida: number; // para aplicar ganho/perda de vida máxima (nível, item) durante a volta
};

export type Evento =
  | { tipo: 'MONSTRO_DERROTADO'; pos: number }
  | { tipo: 'HEROI_DERROTADO' }
  | { tipo: 'CHEFE_SELADO'; motivo: string }
  | { tipo: 'CONFRONTO_FIM'; dano: number; derrotado: boolean; causa: 'VITORIA' | 'ENERGIA' | 'MORTE' };

function gerarMonstros(fase: number, primeiroId: number): Inimigo[] {
  const s = statsMonstro(fase);
  return posicoesMonstros(fase).map((pos, i) => ({
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
    // Cada volta (inclusive depois de uma morte) tem monstros com ids novos: o app gera um id de abate
    // por evento MONSTRO_DERROTADO, então nada da tentativa anterior é pago de novo
    proximoId: id + quantidadeMonstros(ctx.fase) + 1,
    vidaMaxConhecida: ctx.heroi.vidaMax,
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

  // A vida máxima mudou (subiu de nível, equipou ou retirou item): o ganho entra na vida atual e,
  // se diminuiu, a vida atual nunca fica acima da nova máxima
  const vidaMaxAnterior = e.vidaMaxConhecida ?? ctx.heroi.vidaMax;
  if (ctx.heroi.vidaMax > vidaMaxAnterior) e.vida += ctx.heroi.vidaMax - vidaMaxAnterior;
  e.vidaMaxConhecida = ctx.heroi.vidaMax;
  e.vida = Math.min(e.vida, ctx.heroi.vidaMax);

  const alvo = e.inimigos.find((i) => i.vida > 0);
  const posChefe = posicaoChefe(ctx.fase);

  // Fim da fase: hora do chefe
  if (!alvo && e.pos >= posChefe - ALCANCE - 0.01 && !e.confrontoAtivo) {
    if (!ctx.chefe.podeEnfrentar || ctx.chefe.vidaAtual <= 0 || ctx.chefe.limiteDano <= 0) {
      e.modo = 'SELADO';
      e.pausa = PAUSA_MS * 1.5;
      eventos.push({ tipo: 'CHEFE_SELADO', motivo: ctx.chefe.motivo ?? 'O chefe está selado.' });
      return { estado: e, eventos };
    }
    const s = statsChefe(ctx.fase);
    e.inimigos.push({
      id: e.proximoId++,
      pos: posChefe,
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
  const limite = inimigo ? inimigo.pos - ALCANCE : posChefe - ALCANCE;

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
    const golpe = danoRecebido(variar(inimigo.dano, aleatorio), ctx.heroi.reducaoDano); // armadura
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

// Barra da fase: proporção de monstros comuns derrotados NESTA tentativa (2 de 10 = 20%). Com todos
// derrotados a barra fica cheia (etapa do chefe). Morreu: a volta recomeça e a barra volta a zero.
export function progressoDaVolta(e: Estado): number {
  const comuns = e.inimigos.filter((i) => !i.chefe);
  if (!comuns.length) return 0;
  return comuns.filter((i) => i.vida <= 0).length / comuns.length;
}
export function abatidosNaVolta(e: Estado): { abatidos: number; total: number } {
  const comuns = e.inimigos.filter((i) => !i.chefe);
  return { abatidos: comuns.filter((i) => i.vida <= 0).length, total: comuns.length };
}
