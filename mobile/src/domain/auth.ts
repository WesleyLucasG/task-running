import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
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

const CHAVE_USUARIOS = 'tr:usuarios';
const CHAVE_SESSAO = 'tr:sessao';

function hash(texto: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, texto);
}

async function lerUsuarios(): Promise<UsuarioSalvo[]> {
  const bruto = await AsyncStorage.getItem(CHAVE_USUARIOS);
  return bruto ? JSON.parse(bruto) : [];
}

// Remove os campos sensíveis antes de entregar o usuário para a tela
function publico({ senhaHash, cpfHash, ...usuario }: UsuarioSalvo): Usuario {
  return usuario;
}

export async function cadastrar(d: DadosCadastro): Promise<Usuario> {
  const nome = d.nome.trim();
  const email = d.email.trim().toLowerCase();
  const peso = Number(d.peso.replace(',', '.'));

  if (nome.length < 3) throw new Error('Informe seu nome completo.');
  if (!validarEmail(email)) throw new Error('E-mail inválido.');
  if (!validarCpf(d.cpf)) throw new Error('CPF inválido.');
  if (!Number.isFinite(peso) || peso < 20 || peso > 300) {
    throw new Error('Informe um peso válido em kg.');
  }
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

  await AsyncStorage.setItem(CHAVE_USUARIOS, JSON.stringify([...usuarios, novo]));
  await AsyncStorage.setItem(CHAVE_SESSAO, novo.id);
  return publico(novo);
}

export async function entrar(emailBruto: string, senha: string): Promise<Usuario> {
  const email = emailBruto.trim().toLowerCase();
  const usuarios = await lerUsuarios();
  const senhaHash = await hash(senha);
  const achado = usuarios.find((u) => u.email === email && u.senhaHash === senhaHash);

  if (!achado) throw new Error('E-mail ou senha incorretos.');

  await AsyncStorage.setItem(CHAVE_SESSAO, achado.id);
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