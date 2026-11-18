import * as Crypto from 'expo-crypto';
import { Atividade, listarParaSincronizar, listarPontos, marcarSincronizada } from '../db/atividades';
import { registrarEvento } from '../db/auditoria';
import { atualizarRegistro, encerrarRegistro, obterRegistro } from '../db/sincronizacaoLocal';
import {
  atrasoTentativaMs,
  dataHoraLocal,
  LOTE_MAXIMO_PONTOS,
  pontoParaApi,
  textoCanonico,
  umPontoPorSegundo,
} from '../domain/sincronizacao';
import { api, apiConfigurada, ErroApi } from './api';

// UC09 / RN04 / RN05 / RN16 — sincronização real com o backend.
//  - Atividade EM_ANDAMENTO: envia só os pontos novos (delta) e confere o hash devolvido.
//  - Atividade CONCLUÍDA pendente: envia o restante e finaliza; o servidor é idempotente pelo UUID.
//  - Só marca como sincronizada depois da confirmação do servidor.
//  - Falhas: espera progressiva (5 s → 10 min) registrada no SincronizacaoLocal.

type EstadoServidor = { existe: boolean; status: string | null; quantidadePontos: number; hashPontos: string };

export type ResultadoSync = { enviadas: number; parciais: number; falhas: number; aguardando: number };

let emAndamento = false;

const sha256 = (texto: string) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, texto);

export async function sincronizarPendentes(usuarioId: string): Promise<ResultadoSync> {
  const resultado: ResultadoSync = { enviadas: 0, parciais: 0, falhas: 0, aguardando: 0 };
  if (emAndamento) return resultado; // nunca duas rodadas ao mesmo tempo (evita requisições duplicadas)
  emAndamento = true;
  try {
    const atividades = await listarParaSincronizar(usuarioId);
    for (const atividade of atividades) {
      if (!apiConfigurada()) {
        // Modo local (sem backend configurado): não há servidor para confirmar.
        // A atividade concluída é dada como registrada no próprio aparelho.
        if (atividade.status === 'CONCLUIDA') {
          await marcarSincronizada(atividade.id);
          await encerrarRegistro(atividade.id);
        }
        continue;
      }
      const r = await sincronizarUma(atividade);
      if (r === 'CONCLUIDA') resultado.enviadas++;
      else if (r === 'PARCIAL') resultado.parciais++;
      else if (r === 'SEM_CONEXAO') resultado.aguardando++;
      else if (r === 'FALHA') resultado.falhas++;
    }
    if (resultado.enviadas > 0) {
      await registrarEvento('SINCRONIZACAO_OFFLINE', 'SUCESSO', { usuarioId }); // RNF19
    }
  } finally {
    emAndamento = false;
  }
  return resultado;
}

type Saida = 'CONCLUIDA' | 'PARCIAL' | 'SEM_CONEXAO' | 'FALHA' | 'ESPERANDO';

async function sincronizarUma(atividade: Atividade): Promise<Saida> {
  const registro = await obterRegistro(atividade.id);
  if (registro.proximaTentativaEm > Date.now()) return 'ESPERANDO'; // espera progressiva

  await atualizarRegistro(atividade.id, { estado: 'SINCRONIZANDO' });
  try {
    // ordenados por tempo e com um ponto por segundo (mesma contagem do servidor)
    const pontos = umPontoPorSegundo(await listarPontos(atividade.id));
    let enviados = Math.min(registro.pontosEnviados, pontos.length);
    const dataInicio = dataHoraLocal(new Date(atividade.dataInicio).getTime());

    // Envia o delta em lotes enquanto a atividade estiver em andamento
    if (atividade.status === 'EM_ANDAMENTO') {
      while (enviados < pontos.length) {
        const lote = pontos.slice(enviados, enviados + LOTE_MAXIMO_PONTOS);
        const estado = await api<EstadoServidor>('/api/atividades/sincronizacao/pontos', {
          metodo: 'POST',
          corpo: { identificadorLocal: atividade.id, tipoAtividade: atividade.tipo, dataInicio, pontos: lote.map(pontoParaApi) },
        });
        enviados = await conferir(atividade.id, pontos, enviados + lote.length, estado);
      }
      await atualizarRegistro(atividade.id, { estado: 'PENDENTE', tentativas: 0, proximaTentativaEm: 0, ultimoErro: null });
      return 'PARCIAL';
    }

    // Concluída: manda o que falta e finaliza (RN04: reenvio é seguro)
    const restantes = pontos.slice(enviados);
    const fim = atividade.dataFim ? new Date(atividade.dataFim).getTime() : Date.now();
    await api('/api/atividades/sincronizar', {
      metodo: 'POST',
      corpo: {
        identificadorLocal: atividade.id,
        tipoAtividade: atividade.tipo,
        dataInicio,
        dataFim: dataHoraLocal(fim),
        duracaoSegundos: atividade.duracaoSegundos,
        pontosGps: restantes.map(pontoParaApi),
      },
    });
    await marcarSincronizada(atividade.id); // só depois da confirmação do servidor
    await encerrarRegistro(atividade.id); // RN16: fim do ciclo de vida do registro
    return 'CONCLUIDA';
  } catch (e) {
    if (e instanceof ErroApi && e.semConexao) {
      await atualizarRegistro(atividade.id, { estado: 'AGUARDANDO_CONEXAO', ultimoErro: e.message });
      return 'SEM_CONEXAO';
    }
    const tentativas = registro.tentativas + 1;
    await atualizarRegistro(atividade.id, {
      estado: 'FALHA_TEMPORARIA',
      tentativas,
      proximaTentativaEm: Date.now() + atrasoTentativaMs(tentativas),
      ultimoErro: e instanceof Error ? e.message : String(e),
    });
    return 'FALHA';
  }
}

/**
 * Compara o hash do servidor com o hash local dos mesmos pontos. Se bater, avança o ponteiro;
 * se divergir (ex.: arredondamento), volta a zero — o próximo envio reenvia tudo e o servidor
 * descarta os repetidos pelo timestamp, então nada é duplicado.
 */
async function conferir(
  atividadeId: string,
  pontos: Awaited<ReturnType<typeof listarPontos>>,
  enviadosAgora: number,
  estado: EstadoServidor,
): Promise<number> {
  const hashLocal = await sha256(textoCanonico(pontos.slice(0, estado.quantidadePontos)));
  if (estado.quantidadePontos === enviadosAgora && hashLocal === estado.hashPontos) {
    await atualizarRegistro(atividadeId, { pontosEnviados: enviadosAgora, hashEnviado: estado.hashPontos });
    return enviadosAgora;
  }
  await atualizarRegistro(atividadeId, { pontosEnviados: 0, hashEnviado: null, ultimoErro: 'Hash divergente: reenvio completo.' });
  throw new Error('Hash divergente entre aparelho e servidor.');
}
