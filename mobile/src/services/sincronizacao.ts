import AsyncStorage from '@react-native-async-storage/async-storage';
import { listarPendentesSync, marcarSincronizada } from '../db/atividades';
import { registrarEvento } from '../db/auditoria';

// Esta lista faz o papel do banco do backend (que ainda não existe)
const CHAVE_SERVIDOR = 'tr:servidor-simulado:processados';

let emAndamento = false;

export type ResultadoSync = { enviadas: number; jaProcessadas: number; falhas: number };

// Simula o endpoint de sincronização do Spring Boot
async function enviarParaServidor(identificadorLocal: string): Promise<'CRIADA' | 'JA_PROCESSADA'> {
  await new Promise((r) => setTimeout(r, 300)); // latência de rede simulada
  const bruto = await AsyncStorage.getItem(CHAVE_SERVIDOR);
  const processados: string[] = bruto ? JSON.parse(bruto) : [];
  if (processados.includes(identificadorLocal)) return 'JA_PROCESSADA'; // RN04: idempotência
  await AsyncStorage.setItem(CHAVE_SERVIDOR, JSON.stringify([...processados, identificadorLocal]));
  return 'CRIADA';
}

export async function sincronizarPendentes(usuarioId: string): Promise<ResultadoSync> {
  const resultado: ResultadoSync = { enviadas: 0, jaProcessadas: 0, falhas: 0 };
  if (emAndamento) return resultado; // evita duas sincronizações ao mesmo tempo
  emAndamento = true;

  try {
    const pendentes = await listarPendentesSync(usuarioId);
    for (const atividade of pendentes) {
      try {
        const resposta = await enviarParaServidor(atividade.id);
        await marcarSincronizada(atividade.id);
        if (resposta === 'CRIADA') resultado.enviadas += 1;
        else resultado.jaProcessadas += 1;
      } catch {
        resultado.falhas += 1; // continua pendente e tenta na próxima conexão (UC09)
      }
    }
    if (resultado.enviadas + resultado.jaProcessadas > 0) {
      await registrarEvento('SINCRONIZACAO_OFFLINE', 'SUCESSO', { usuarioId }); // RNF19
    }
  } finally {
    emAndamento = false;
  }
  return resultado;
}