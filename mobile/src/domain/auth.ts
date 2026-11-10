import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { registrarEvento } from '../db/auditoria';
import { calcularMetaAgua } from './hidratacao';
import { somenteDigitos, validarCpf, validarEmail, validarSenha } from './validacoes';

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  peso: number;
  metaAguaMl: number;
  criadoEm: string;
};

type UsuarioSalvo = Usuario & { senhaHash: string; cpfHash: string };

export type DadosCadastro = {
  nome: string;
  email: string;
  cpf: string;
  peso: string;
  senha: string;
  confirmarSenha: string;
};

export type DadosPerfil = { nome: string; email: string; peso: string };

type RegistroTentativas = { falhas: number; bloqueadoAte: number };
type TokenRecuperacao = { usuarioId: string; tokenHash: string; expiraEm: number; usado: boolean };

const CHAVE_USUARIOS = 'tr:usuarios';
const CHAVE_SESSAO = 'tr:sessao';
const CHAVE_TENTATIVAS = 'tr:tentativas';
const CHAVE_TOKENS = 'tr:tokens-recuperacao';

const MAX_TENTATIVAS = 5; // RNF13
const BLOQUEIO_MS = 15 * 60 * 1000; // RNF13
const VALIDADE_TOKEN_MS = 15 * 60 * 1000; // RF06

// 32 símbolos, sem I e O para não confundir com 1 e 0
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function hash(texto: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, texto);
}

async function lerJson<T>(chave: string, padrao: T): Promise<T> {
  const bruto = await AsyncStorage.getItem(chave);
  return bruto ? (JSON.parse(bruto) as T) : padrao;
}

function salvarJson(chave: string, valor: unknown) {
  return AsyncStorage.setItem(chave, JSON.stringify(valor));
}

function lerUsuarios() {
  return lerJson<UsuarioSalvo[]>(CHAVE_USUARIOS, []);
}

// Remove os campos sensíveis antes de entregar o usuário para a tela
function publico({ senhaHash, cpfHash, ...usuario }: UsuarioSalvo): Usuario {
  return usuario;
}

function gerarCodigo(tamanho = 8): string {
  const bytes = Crypto.getRandomBytes(tamanho); // aleatório seguro (RNF08)
  let codigo = '';
  for (let i = 0; i < tamanho; i++) codigo += ALFABETO[bytes[i] % ALFABETO.length];
  return codigo;
}

function validarDadosBasicos(nome: string, email: string, peso: number) {
  if (nome.length < 3) throw new Error('Informe seu nome completo.');
  if (!validarEmail(email)) throw new Error('E-mail inválido.');
  if (!Number.isFinite(peso) || peso < 20 || peso > 300) {
    throw new Error('Informe um peso válido em kg.');
  }
}

export async function cadastrar(d: DadosCadastro): Promise<Usuario> {
  const nome = d.nome.trim();
  const email = d.email.trim().toLowerCase();
  const peso = Number(d.peso.replace(',', '.'));

  validarDadosBasicos(nome, email, peso);
  if (!validarCpf(d.cpf)) throw new Error('CPF inválido.');
  const erroSenha = validarSenha(d.senha);
  if (erroSenha) throw new Error(erroSenha);
  if (d.senha !== d.confirmarSenha) throw new Error('As senhas não conferem.');

  const usuarios = await lerUsuarios();
  const cpfHash = await hash(somenteDigitos(d.cpf));

  // RF03: um CPF e um e-mail por conta
  if (usuarios.some((u) => u.email === email || u.cpfHash === cpfHash)) {
    throw new Error('E-mail ou CPF já cadastrado.');
  }

  const novo: UsuarioSalvo = {
    id: Crypto.randomUUID(),
    nome,
    email,
    peso,
    metaAguaMl: calcularMetaAgua(peso),
    criadoEm: new Date().toISOString(),
    senhaHash: await hash(d.senha),
    cpfHash,
  };

  await salvarJson(CHAVE_USUARIOS, [...usuarios, novo]);
  await AsyncStorage.setItem(CHAVE_SESSAO, novo.id);
  await registrarEvento('CADASTRO', 'SUCESSO', { email, usuarioId: novo.id }); // RNF19
  return publico(novo);
}

export async function entrar(emailBruto: string, senha: string): Promise<Usuario> {
  const email = emailBruto.trim().toLowerCase();
  const tentativas = await lerJson<Record<string, RegistroTentativas>>(CHAVE_TENTATIVAS, {});
  let reg = tentativas[email] ?? { falhas: 0, bloqueadoAte: 0 };

  // Bloqueio vencido: zera o contador
  if (reg.bloqueadoAte && reg.bloqueadoAte <= Date.now()) reg = { falhas: 0, bloqueadoAte: 0 };

  // UC02, passo 2: conta bloqueada não chega nem a validar a senha
  if (reg.bloqueadoAte > Date.now()) {
    const minutos = Math.ceil((reg.bloqueadoAte - Date.now()) / 60000);
    await registrarEvento('LOGIN', 'BLOQUEADO', { email });
    throw new Error(`Acesso bloqueado por tentativas inválidas. Tente novamente em ${minutos} min.`);
  }

  const usuarios = await lerUsuarios();
  const senhaHash = await hash(senha);
  const achado = usuarios.find((u) => u.email === email && u.senhaHash === senhaHash);

  if (!achado) {
    reg.falhas += 1;
    const restantes = MAX_TENTATIVAS - reg.falhas;
    const bloqueou = reg.falhas >= MAX_TENTATIVAS;
    if (bloqueou) reg = { falhas: 0, bloqueadoAte: Date.now() + BLOQUEIO_MS };
    tentativas[email] = reg;
    await salvarJson(CHAVE_TENTATIVAS, tentativas);
    await registrarEvento('LOGIN', 'FALHA', { email }); // RNF18

    if (bloqueou) throw new Error('Muitas tentativas inválidas. Acesso bloqueado por 15 minutos.');
    throw new Error(`E-mail ou senha incorretos. Tentativas restantes: ${restantes}.`);
  }

  delete tentativas[email];
  await salvarJson(CHAVE_TENTATIVAS, tentativas);
  await AsyncStorage.setItem(CHAVE_SESSAO, achado.id);
  await registrarEvento('LOGIN', 'SUCESSO', { email, usuarioId: achado.id });
  return publico(achado);
}

export async function carregarSessao(): Promise<Usuario | null> {
  const id = await AsyncStorage.getItem(CHAVE_SESSAO);
  if (!id) return null;
  const achado = (await lerUsuarios()).find((u) => u.id === id);
  return achado ? publico(achado) : null;
}

export async function sair(): Promise<void> {
  await AsyncStorage.removeItem(CHAVE_SESSAO);
}

// UC03: o código só é devolvido porque o envio de e-mail é simulado neste MVP
export async function solicitarRecuperacao(
  emailBruto: string,
): Promise<{ codigoSimulado: string | null }> {
  const email = emailBruto.trim().toLowerCase();
  if (!validarEmail(email)) throw new Error('Informe um e-mail válido.');

  const usuarios = await lerUsuarios();
  const usuario = usuarios.find((u) => u.email === email);

  // RNF09: e-mail não cadastrado não gera token, mas a tela mostra a mesma resposta
  if (!usuario) {
    await registrarEvento('RECUPERACAO_SENHA_SOLICITADA', 'EMAIL_NAO_CADASTRADO', { email });
    return { codigoSimulado: null };
  }

  const agora = Date.now();
  const tokens = (await lerJson<TokenRecuperacao[]>(CHAVE_TOKENS, []))
    .filter((t) => t.expiraEm > agora)
    .map((t) => (t.usuarioId === usuario.id ? { ...t, usado: true } : t)); // só o último vale

  const codigo = gerarCodigo();
  tokens.push({
    usuarioId: usuario.id,
    tokenHash: await hash(codigo), // o código em si nunca é guardado
    expiraEm: agora + VALIDADE_TOKEN_MS, // RF06
    usado: false,
  });
  await salvarJson(CHAVE_TOKENS, tokens);
  await registrarEvento('RECUPERACAO_SENHA_SOLICITADA', 'TOKEN_GERADO', {
    email,
    usuarioId: usuario.id,
  });
  return { codigoSimulado: codigo };
}

export async function redefinirSenha(
  emailBruto: string,
  codigoBruto: string,
  novaSenha: string,
  confirmar: string,
): Promise<void> {
  const email = emailBruto.trim().toLowerCase();
  const codigo = codigoBruto.trim().toUpperCase();

  // UC03: senha fora do padrão não consome o token (RF08)
  const erroSenha = validarSenha(novaSenha);
  if (erroSenha) throw new Error(erroSenha);
  if (novaSenha !== confirmar) throw new Error('As senhas não conferem.');

  const usuarios = await lerUsuarios();
  const indice = usuarios.findIndex((u) => u.email === email);
  const tokens = await lerJson<TokenRecuperacao[]>(CHAVE_TOKENS, []);
  const codigoHash = await hash(codigo);
  const agora = Date.now();

  const token =
    indice >= 0
      ? tokens.find(
          (t) =>
            t.usuarioId === usuarios[indice].id &&
            t.tokenHash === codigoHash &&
            !t.usado &&
            t.expiraEm > agora,
        )
      : undefined;

  if (indice < 0 || !token) {
    await registrarEvento('SENHA_REDEFINIDA', 'CODIGO_INVALIDO', { email });
    throw new Error('Código inválido ou expirado. Solicite um novo.');
  }

  token.usado = true; // RF07: uso único
  usuarios[indice] = { ...usuarios[indice], senhaHash: await hash(novaSenha) };
  await salvarJson(CHAVE_TOKENS, tokens);
  await salvarJson(CHAVE_USUARIOS, usuarios);

  // Senha nova também libera um acesso que estivesse bloqueado
  const tentativas = await lerJson<Record<string, RegistroTentativas>>(CHAVE_TENTATIVAS, {});
  delete tentativas[email];
  await salvarJson(CHAVE_TENTATIVAS, tentativas);

  await registrarEvento('SENHA_REDEFINIDA', 'SUCESSO', { email, usuarioId: usuarios[indice].id });
}

// UC08: o CPF não pode ser alterado nesta versão
export async function atualizarPerfil(usuarioId: string, d: DadosPerfil): Promise<Usuario> {
  const nome = d.nome.trim();
  const email = d.email.trim().toLowerCase();
  const peso = Number(d.peso.replace(',', '.'));
  validarDadosBasicos(nome, email, peso);

  const usuarios = await lerUsuarios();
  const indice = usuarios.findIndex((u) => u.id === usuarioId);
  if (indice < 0) throw new Error('Usuário não encontrado.');
  if (usuarios.some((u) => u.id !== usuarioId && u.email === email)) {
    throw new Error('Este e-mail já está em uso por outra conta.');
  }

  const atualizado: UsuarioSalvo = {
    ...usuarios[indice],
    nome,
    email,
    peso,
    metaAguaMl: calcularMetaAgua(peso), // RN09: peso novo recalcula a meta
  };
  usuarios[indice] = atualizado;
  await salvarJson(CHAVE_USUARIOS, usuarios);
  await registrarEvento('PERFIL_ATUALIZADO', 'SUCESSO', { email, usuarioId });
  return publico(atualizado);
}