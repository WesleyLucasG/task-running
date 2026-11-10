import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import * as Auth from '../domain/auth';

type AuthCtx = {
  usuario: Auth.Usuario | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (dados: Auth.DadosCadastro) => Promise<void>;
  atualizarPerfil: (dados: Auth.DadosPerfil) => Promise<void>;
  sair: () => Promise<void>;
};

const Contexto = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Auth.Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    Auth.carregarSessao()
      .then(setUsuario)
      .finally(() => setCarregando(false));
  }, []);

  const valor: AuthCtx = {
    usuario,
    carregando,
    entrar: async (email, senha) => setUsuario(await Auth.entrar(email, senha)),
    cadastrar: async (dados) => setUsuario(await Auth.cadastrar(dados)),
    atualizarPerfil: async (dados) => {
      if (!usuario) return;
      setUsuario(await Auth.atualizarPerfil(usuario.id, dados));
    },
    sair: async () => {
      await Auth.sair();
      setUsuario(null);
    },
  };

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return ctx;
}