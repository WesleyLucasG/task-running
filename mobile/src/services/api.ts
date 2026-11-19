import * as SecureStore from 'expo-secure-store';

// Endereço da API (Spring Boot). Definido em mobile/.env.local:
//   EXPO_PUBLIC_API_URL=https://sua-api-na-nuvem.com      (produção: HTTPS obrigatório, RNF22)
//   EXPO_PUBLIC_API_URL=http://192.168.0.10:8080         (desenvolvimento na rede local)
// Sem essa variável o app funciona em "modo local" (dados só no aparelho).
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
export const apiConfigurada = () => API_URL.length > 0;

const CHAVE_ACESSO = 'tr.token.acesso';
const CHAVE_REFRESH = 'tr.token.refresh';
// O Render gratuito "dorme" sem uso e leva de 30 a 60 s para acordar: com 15 s a 1ª ação do dia falhava
const TEMPO_LIMITE_MS = 60000;

export class ErroApi extends Error {
  constructor(
    message: string,
    public status: number, // 0 = sem conexão / tempo esgotado
  ) {
    super(message);
  }
  get semConexao() {
    return this.status === 0;
  }
}

export type Tokens = { token: string; refreshToken: string | null };

// RNF07 + armazenamento seguro: tokens só no SecureStore (Keystore do Android)
export async function salvarTokens(t: Tokens): Promise<void> {
  await SecureStore.setItemAsync(CHAVE_ACESSO, t.token);
  if (t.refreshToken) await SecureStore.setItemAsync(CHAVE_REFRESH, t.refreshToken);
}

export async function lerTokens(): Promise<Tokens | null> {
  const token = await SecureStore.getItemAsync(CHAVE_ACESSO);
  if (!token) return null;
  return { token, refreshToken: await SecureStore.getItemAsync(CHAVE_REFRESH) };
}

export async function apagarTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(CHAVE_ACESSO);
  await SecureStore.deleteItemAsync(CHAVE_REFRESH);
}

type Opcoes = { metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; corpo?: unknown; autenticado?: boolean };

async function chamar(caminho: string, op: Opcoes, token?: string): Promise<Response> {
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
  try {
    return await fetch(`${API_URL}${caminho}`, {
      method: op.metodo ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(op.corpo !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: op.corpo !== undefined ? JSON.stringify(op.corpo) : undefined,
      signal: controle.signal,
    });
  } catch {
    throw new ErroApi(
      controle.signal.aborted
        ? 'O servidor demorou para responder (pode estar iniciando). Tente novamente em instantes.'
        : 'Sem conexão com o servidor. Verifique sua internet.',
      0,
    );
  } finally {
    clearTimeout(timer);
  }
}

// Acorda o servidor ao abrir o app (sem esperar a resposta), para o login não pegar a partida a frio
export function acordarServidor(): void {
  if (!apiConfigurada()) return;
  chamar('/api/saude', {}).catch(() => {});
}

// Mensagem padronizada do backend (ErrorResponseDTO.message / errors[].message), RNF25
async function erroDaResposta(r: Response): Promise<ErroApi> {
  let mensagem = 'Erro inesperado no servidor.';
  try {
    const corpo = await r.json();
    const detalhe = Array.isArray(corpo?.errors) && corpo.errors.length ? corpo.errors[0].message : null;
    mensagem = detalhe ?? corpo?.message ?? mensagem;
  } catch {
    if (r.status === 401 || r.status === 403) mensagem = 'Sessão expirada. Faça login novamente.';
  }
  return new ErroApi(mensagem, r.status);
}

// Uma única renovação por vez, mesmo com várias requisições recebendo 401 juntas
let renovando: Promise<string | null> | null = null;
let aoPerderSessao: (() => void) | null = null;
export function quandoSessaoExpirar(fn: () => void) {
  aoPerderSessao = fn;
}

async function renovarToken(): Promise<string | null> {
  if (!renovando) {
    renovando = (async () => {
      const atuais = await lerTokens();
      if (!atuais?.refreshToken) return null;
      const r = await chamar('/auth/refresh', { metodo: 'POST', corpo: { refreshToken: atuais.refreshToken } });
      if (!r.ok) return null;
      const novos = (await r.json()) as Tokens;
      await salvarTokens(novos);
      return novos.token;
    })().finally(() => {
      renovando = null;
    });
  }
  return renovando;
}

export async function api<T>(caminho: string, op: Opcoes = {}): Promise<T> {
  if (!apiConfigurada()) throw new ErroApi('API não configurada (EXPO_PUBLIC_API_URL).', 0);
  const autenticado = op.autenticado ?? true;
  let token = autenticado ? (await lerTokens())?.token : undefined;
  let r = await chamar(caminho, op, token);

  if (autenticado && (r.status === 401 || r.status === 403)) {
    token = (await renovarToken()) ?? undefined;
    if (!token) {
      await apagarTokens();
      aoPerderSessao?.();
      throw new ErroApi('Sessão expirada. Faça login novamente.', 401);
    }
    r = await chamar(caminho, op, token);
  }
  if (!r.ok) throw await erroDaResposta(r);
  if (r.status === 204) return undefined as T;
  const texto = await r.text();
  return (texto ? JSON.parse(texto) : undefined) as T;
}
