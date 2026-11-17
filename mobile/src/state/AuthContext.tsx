import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import * as Auth from '../domain/auth';

// Fluxo do Figma: Abertura → Onboarding (1ª vez no aparelho) → Cadastro/Login
// → Permissões → Criação de Personagem (1ª vez da conta) → Home.
const CHAVE_INTRO = 'tr:intro-vista';
const chaveConfig = (usuarioId: string) => `tr:configurado:${usuarioId}`;

type AuthCtx = {
  usuario: Auth.Usuario | null;
  carregando: boolean;
  introVista: boolean;
  configurado: boolean;
  entrar: (email: string, senha: string, lembrar?: boolean) => Promise<void>;
  cadastrar: (dados: Auth.DadosCadastro) => Promise<void>;
  atualizarPerfil: (dados: Auth.DadosPerfil) => Promise<void>;
  sair: () => Promise<void>;
  concluirIntro: () => Promise<void>;
  concluirConfiguracao: () => Promise<void>;
};

const Contexto = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Auth.Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [introVista, setIntroVista] = useState(false);
  const [configurado, setConfigurado] = useState(true);

  const lerConfigurado = useCallback(async (u: Auth.Usuario | null) => {
    setConfigurado(u ? (await AsyncStorage.getItem(chaveConfig(u.id))) === '1' : true);
  }, []);

  // Atualiza usuário e flag de configuração juntos, para o roteamento não "piscar"
  const definirUsuario = useCallback(
    async (u: Auth.Usuario | null) => {
      await lerConfigurado(u);
      setUsuario(u);
    },
    [lerConfigurado],
  );

  useEffect(() => {
    Promise.all([Auth.carregarSessao(), AsyncStorage.getItem(CHAVE_INTRO)])
      .then(async ([u, intro]) => {
        setIntroVista(intro === '1');
        await definirUsuario(u);
      })
      .finally(() => setCarregando(false));
  }, [definirUsuario]);

  const valor: AuthCtx = {
    usuario,
    carregando,
    introVista,
    configurado,
    entrar: async (email, senha, lembrar) => definirUsuario(await Auth.entrar(email, senha, lembrar)),
    cadastrar: async (dados) => definirUsuario(await Auth.cadastrar(dados)),
    atualizarPerfil: async (dados) => {
      if (!usuario) return;
      setUsuario(await Auth.atualizarPerfil(usuario.id, dados));
    },
    sair: async () => {
      await Auth.sair();
      setUsuario(null);
    },
    concluirIntro: async () => {
      await AsyncStorage.setItem(CHAVE_INTRO, '1');
      setIntroVista(true);
    },
    concluirConfiguracao: async () => {
      if (!usuario) return;
      await AsyncStorage.setItem(chaveConfig(usuario.id), '1');
      setConfigurado(true);
    },
  };

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return ctx;
}
