import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DadosCadastro, DadosPerfil, Usuario } from '../domain/auth';
import { somenteDigitos, validarCpf, validarEmail, validarSenha } from '../domain/validacoes';
import { api, apagarTokens, lerTokens, salvarTokens } from './api';
import { limparCache } from './jogoRemoto';

// Autenticação real com o backend Spring Boot (UC01, UC02, UC03, UC08).
const CHAVE_USUARIO = 'tr:usuario-remoto'; // cópia do perfil para abrir o app sem internet
const CHAVE_LEMBRAR = 'tr:lembrar';

type PerfilApi = { id: number; nome: string; email: string; cpf: string; peso: number; metaAguaMl: number };
type TokensApi = { token: string; refreshToken: string | null };

// O id local do usuário remoto recebe prefixo para não se misturar com contas do modo local
function paraUsuario(p: PerfilApi): Usuario {
  return {
    id: `srv-${p.id}`,
    nome: p.nome,
    email: p.email ?? '',
    peso: p.peso,
    metaAguaMl: Math.round(p.metaAguaMl ?? 0),
    criadoEm: new Date().toISOString(),
  };
}

async function buscarPerfil(): Promise<Usuario> {
  const u = paraUsuario(await api<PerfilApi>('/api/perfil'));
  await AsyncStorage.setItem(CHAVE_USUARIO, JSON.stringify(u));
  return u;
}

// Login Mobile por CPF + senha (decisão autorizada; RF04 do documento cita e-mail)
export async function entrar(cpf: string, senha: string, lembrar = true): Promise<Usuario> {
  if (!validarCpf(cpf)) throw new Error('Informe um CPF válido.');
  if (!senha) throw new Error('Informe a senha.');
  const tokens = await api<TokensApi>('/auth/login', {
    metodo: 'POST',
    autenticado: false,
    corpo: { cpf: somenteDigitos(cpf), senha },
  });
  await salvarTokens(tokens);
  await limparCache(); // estado do jogo de outra conta não pode aparecer nesta
  await AsyncStorage.setItem(CHAVE_LEMBRAR, lembrar ? '1' : '0');
  return buscarPerfil();
}

export async function cadastrar(d: DadosCadastro): Promise<Usuario> {
  const peso = Number(d.peso.replace(',', '.'));
  if (d.nome.trim().length < 2) throw new Error('Informe o nome.');
  if (!validarEmail(d.email.trim())) throw new Error('Informe um e-mail válido.');
  if (!validarCpf(d.cpf)) throw new Error('CPF inválido.');
  if (!Number.isFinite(peso) || peso < 20 || peso > 300) throw new Error('Informe um peso válido em kg.');
  const erroSenha = validarSenha(d.senha); // RF08
  if (erroSenha) throw new Error(erroSenha);
  if (d.senha !== d.confirmarSenha) throw new Error('As senhas não conferem.');

  await api<void>('/auth/register', {
    metodo: 'POST',
    autenticado: false,
    corpo: { nome: d.nome.trim(), email: d.email.trim().toLowerCase(), senha: d.senha, cpf: somenteDigitos(d.cpf), peso },
  });
  return entrar(d.cpf, d.senha, true);
}

// Abre a sessão salva. Sem internet, usa a última cópia do perfil (o app continua offline, RNF10).
export async function carregarSessao(): Promise<Usuario | null> {
  const tokens = await lerTokens();
  if (!tokens) return null;
  if ((await AsyncStorage.getItem(CHAVE_LEMBRAR)) === '0') {
    await sair();
    return null;
  }
  // Abre na hora com a cópia local e atualiza em segundo plano: o servidor pode levar até 1 min
  // para acordar e a tela de abertura não deve esperar. Token inválido → quandoSessaoExpirar → login.
  const bruto = await AsyncStorage.getItem(CHAVE_USUARIO);
  if (bruto) {
    buscarPerfil().catch(() => {});
    return JSON.parse(bruto) as Usuario;
  }
  try {
    return await buscarPerfil();
  } catch {
    return null;
  }
}

export async function sair(): Promise<void> {
  const tokens = await lerTokens();
  if (tokens?.refreshToken) {
    await api<void>('/auth/logout', { metodo: 'POST', autenticado: false, corpo: { refreshToken: tokens.refreshToken } }).catch(
      () => {},
    );
  }
  await apagarTokens();
  await limparCache();
  await AsyncStorage.multiRemove([CHAVE_USUARIO, CHAVE_LEMBRAR]);
}

// UC03 / RNF09: a resposta é sempre a mesma; o código só vem no corpo em desenvolvimento
export async function solicitarRecuperacao(email: string): Promise<{ codigoSimulado: string | null }> {
  if (!validarEmail(email.trim())) throw new Error('Informe um e-mail válido.');
  const r = await api<{ mensagem: string; tokenTeste?: string }>('/auth/forgot-password', {
    metodo: 'POST',
    autenticado: false,
    corpo: { email: email.trim().toLowerCase() },
  });
  return { codigoSimulado: r?.tokenTeste ?? null };
}

// Etapa 2: confere o código de 6 dígitos no servidor sem consumi-lo
export async function validarCodigo(email: string, codigo: string): Promise<void> {
  await api<void>('/auth/validar-codigo', {
    metodo: 'POST',
    autenticado: false,
    corpo: { email: email.trim().toLowerCase(), codigo: codigo.replace(/\s/g, '') },
  });
}

// Etapa 3: o servidor confere o código de novo antes de gravar a nova senha
export async function redefinirSenha(email: string, codigo: string, novaSenha: string, confirmar: string): Promise<void> {
  const erro = validarSenha(novaSenha); // RF08
  if (erro) throw new Error(erro);
  if (novaSenha !== confirmar) throw new Error('As senhas não conferem.');
  await api<void>('/auth/reset-password', {
    metodo: 'POST',
    autenticado: false,
    corpo: { email: email.trim().toLowerCase(), codigo: codigo.replace(/\s/g, ''), novaSenha },
  });
}

// UC08 / RN09: o backend recalcula a meta de água quando o peso muda
export async function atualizarPerfil(d: DadosPerfil): Promise<Usuario> {
  const peso = Number(d.peso.replace(',', '.'));
  if (!Number.isFinite(peso) || peso < 20 || peso > 300) throw new Error('Informe um peso válido em kg.');
  await api('/api/perfil', { metodo: 'PUT', corpo: { nome: d.nome.trim(), peso } });
  return buscarPerfil();
}

export { somenteDigitos };
