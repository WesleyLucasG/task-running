import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { registrarConfronto } from '../db/fases';
import { recompensarMonstroDerrotado } from '../db/loot';
import type { ItemCatalogo } from '../domain/loja';
import type { RaridadeBauDrop } from '../domain/recompensas';
import { ContextoIdle, obterContextoIdle } from '../db/heroi';
import { Estado, Evento, novaVolta, passo } from '../domain/idle';
import { useAuth } from './AuthContext';
import { EXTRAS_FORA_DO_MVP } from '../config/escopo';
import { avisarJogadorAlterado } from './sinais';

const TICK_MS = 100;
const MAX_LOG = 4;
const DURACAO_EFEITO = 1400;

// Efeitos visuais de recompensa desenhados na cena (moeda subindo, baú caindo)
export type EfeitoLoot = { id: number; tipo: 'MOEDA' | 'BAU'; pos: number; criadoEm: number; valor?: number; bau?: RaridadeBauDrop };
export type BauEncontrado = { id: string; tipo: RaridadeBauDrop };
let proximoEfeito = 1;

// Liga o motor idle à tela: carrega o contexto do banco, avança a simulação
// a cada 100 ms enquanto a tela está em foco e persiste o resultado dos confrontos.
// O estado "verdadeiro" fica numa ref (fora do ciclo de render) para que cada
// evento seja tratado exatamente uma vez; o useState só serve para redesenhar.
export function useEsteira() {
  const { usuario } = useAuth();
  const [info, setInfo] = useState<ContextoIdle | null>(null);
  const [estado, setEstado] = useState<Estado | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [focado, setFocado] = useState(false);
  const estadoRef = useRef<Estado | null>(null);
  const [efeitos, setEfeitos] = useState<EfeitoLoot[]>([]);
  const [bausEncontrados, setBausEncontrados] = useState<BauEncontrado[]>([]);
  const [lendario, setLendario] = useState<ItemCatalogo | null>(null);

  const adicionarEfeito = useCallback((e: Omit<EfeitoLoot, 'id' | 'criadoEm'>) => {
    const agora = estadoRef.current?.tempo ?? 0;
    setEfeitos((lista) => [
      ...lista.filter((x) => agora - x.criadoEm < DURACAO_EFEITO),
      { ...e, id: proximoEfeito++, criadoEm: agora },
    ]);
  }, []);

  const registrar = useCallback((linha: string) => setLog((l) => [linha, ...l].slice(0, MAX_LOG)), []);

  const definirEstado = useCallback((e: Estado) => {
    estadoRef.current = e;
    setEstado(e);
  }, []);

  const recarregar = useCallback(async () => {
    if (!usuario) return null;
    const novo = await obterContextoIdle(usuario.id);
    setInfo(novo);
    return novo;
  }, [usuario]);

  // Recarrega ao ganhar foco (pode ter corrido, equipado item ou distribuído pontos)
  useFocusEffect(
    useCallback(() => {
      setFocado(true);
      recarregar()
        .then((novo) => {
          if (!novo) return;
          if (!estadoRef.current) {
            definirEstado(novaVolta(novo.contexto));
            registrar(`Um ${novo.fase?.monstro.nome ?? 'monstro'} apareceu!`);
          }
        })
        .catch(() => {});
      return () => setFocado(false);
    }, [recarregar, definirEstado, registrar]),
  );

  const tratarEventos = useCallback(
    (eventos: Evento[], ctx: ContextoIdle) => {
      if (!usuario) return;
      const chefe = ctx.fase?.chefe.nome ?? 'O chefe';
      const monstro = ctx.fase?.monstro.nome ?? 'Monstro';
      for (const ev of eventos) {
        if (ev.tipo === 'MONSTRO_DERROTADO' && !EXTRAS_FORA_DO_MVP) {
          registrar(`${monstro} derrotado!`);
        }
        if (ev.tipo === 'MONSTRO_DERROTADO' && EXTRAS_FORA_DO_MVP) {
          // D19: moedas sempre + 20% de chance de baú (sem XP: RF18)
          recompensarMonstroDerrotado(usuario.id, ctx.contexto.fase)
            .then((r) => {
              adicionarEfeito({ tipo: 'MOEDA', pos: ev.pos, valor: r.moedas });
              avisarJogadorAlterado();
              if (r.bau) {
                const bau = r.bau;
                adicionarEfeito({ tipo: 'BAU', pos: ev.pos, bau: bau.tipo });
                setBausEncontrados((b) => [...b, bau]);
                registrar(`${monstro} deixou um baú ${bau.tipo.toLowerCase()}!`);
              } else {
                registrar(`${monstro} derrotado! +${r.moedas} moeda${r.moedas > 1 ? 's' : ''}`);
              }
            })
            .catch((e) => registrar(e instanceof Error ? e.message : String(e)));
        }
        if (ev.tipo === 'HEROI_DERROTADO') registrar('Seu herói caiu! Recomeçando a fase com vida cheia.');
        if (ev.tipo === 'CHEFE_SELADO') registrar(`Hermes: ${ev.motivo}`);
        if (ev.tipo === 'CONFRONTO_FIM') {
          registrarConfronto(usuario.id, ev.dano)
            .then(async (r) => {
              if (r.derrotado) {
                registrar(`${chefe} foi derrotado! Baú Ouro recebido.`);
                if (r.itemLendario) {
                  registrar(`ITEM LENDÁRIO: ${r.itemLendario.nome}!`);
                  setLendario(r.itemLendario);
                }
                avisarJogadorAlterado();
                if (r.proximaFase) registrar(`Nova terra liberada: ${r.proximaFase}`);
              } else {
                registrar(`${chefe} sofreu ${r.dano} de dano (${r.vidaRestante}/${r.vidaMaxima}).`);
                if (ev.causa === 'ENERGIA') registrar('Energia Divina esgotada. Corra para recarregar!');
              }
              const novo = await recarregar();
              if (novo && r.derrotado) definirEstado(novaVolta(novo.contexto));
            })
            .catch((e) => registrar(e instanceof Error ? e.message : String(e)));
        }
      }
    },
    [usuario, recarregar, registrar, definirEstado, adicionarEfeito],
  );

  // Laço da simulação (só com a tela em foco)
  useEffect(() => {
    if (!focado || !info) return;
    const id = setInterval(() => {
      const atual = estadoRef.current;
      if (!atual) return;
      const r = passo(atual, TICK_MS, info.contexto);
      definirEstado(r.estado);
      if (r.eventos.length) tratarEventos(r.eventos, info);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [focado, info, definirEstado, tratarEventos]);

  const removerBau = useCallback((id: string) => setBausEncontrados((b) => b.filter((x) => x.id !== id)), []);
  const fecharLendario = useCallback(() => setLendario(null), []);

  return { info, estado, log, efeitos, bausEncontrados, removerBau, lendario, fecharLendario };
}
