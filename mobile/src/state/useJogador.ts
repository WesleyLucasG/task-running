import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Avatar, obterJogador } from '../db/jogo';
import { useAuth } from './AuthContext';
import { ouvirJogadorAlterado } from './sinais';

// Dados do jogador (avatar + moedas) recarregados sempre que a tela ganha foco.
export function useJogador() {
  const { usuario } = useAuth();
  const [dados, setDados] = useState<{ avatar: Avatar; moedas: number } | null>(null);

  const recarregar = useCallback(async () => {
    if (!usuario) return;
    setDados(await obterJogador(usuario.id));
  }, [usuario]);

  useFocusEffect(
    useCallback(() => {
      recarregar().catch(() => {});
    }, [recarregar]),
  );

  useEffect(() => ouvirJogadorAlterado(() => void recarregar().catch(() => {})), [recarregar]);

  return { usuario, avatar: dados?.avatar ?? null, moedas: dados?.moedas ?? 0, recarregar };
}
