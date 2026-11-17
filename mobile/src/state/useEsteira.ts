import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { registrarConfronto } from '../db/fases';
import { ContextoIdle, obterContextoIdle } from '../db/heroi';
import { Estado, Evento, novaVolta, passo } from '../domain/idle';
import { useAuth } from './AuthContext';

const TICK_MS = 100;
const MAX_LOG = 4;

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
        if (ev.tipo === 'MONSTRO_DERROTADO') registrar(`${monstro} derrotado!`);
        if (ev.tipo === 'HEROI_DERROTADO') registrar('Seu herói caiu! Recomeçando a fase com vida cheia.');
        if (ev.tipo === 'CHEFE_SELADO') registrar(`Hermes: ${ev.motivo}`);
        if (ev.tipo === 'CONFRONTO_FIM') {
          registrarConfronto(usuario.id, ev.dano)
            .then(async (r) => {
              if (r.derrotado) {
                registrar(`${chefe} foi derrotado! Baú raro recebido.`);
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
    [usuario, recarregar, registrar, definirEstado],
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

  return { info, estado, log };
}
