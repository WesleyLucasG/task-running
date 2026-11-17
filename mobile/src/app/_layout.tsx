import NetInfo from '@react-native-community/netinfo';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Abertura } from '../components/Abertura';
import { sincronizarPendentes } from '../services/sincronizacao';
import { AuthProvider, useAuth } from '../state/AuthContext';
import { cores } from '../theme';

SplashScreen.preventAutoHideAsync();

function Rotas() {
  const { usuario, carregando, introVista, configurado } = useAuth();
  const [fontesOk, erroFonte] = useFonts({
    PressStart2P_400Regular,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });
  const pronto = !carregando && (fontesOk || !!erroFonte);

  useEffect(() => {
    if (pronto) SplashScreen.hideAsync();
  }, [pronto]);

  // RF16: sincroniza sozinho sempre que houver conexão (e ao abrir o app)
  const usuarioId = usuario?.id;
  useEffect(() => {
    if (!usuarioId) return;
    const cancelar = NetInfo.addEventListener((estado) => {
      if (estado.isConnected && estado.isInternetReachable !== false) {
        sincronizarPendentes(usuarioId).catch(() => {});
      }
    });
    return cancelar;
  }, [usuarioId]);

  // Figma "Abertura": barra "CARREGANDO MUNDO" uma vez por abertura do app
  const [aberturaOk, setAberturaOk] = useState(false);
  const concluirAbertura = useCallback(() => setAberturaOk(true), []);

  if (!pronto) return null;
  if (!aberturaOk) return <Abertura aoConcluir={concluirAbertura} />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }}>
      {/* Conta recém-criada: Permissões → Criação de Personagem (Figma) */}
      <Stack.Protected guard={!!usuario && !configurado}>
        <Stack.Screen name="permissoes" />
        <Stack.Screen name="criar-personagem" />
      </Stack.Protected>
      {/* Primeira vez no aparelho: Onboarding capítulos I a III */}
      <Stack.Protected guard={!usuario && !introVista}>
        <Stack.Screen name="intro/capitulo-1" />
        <Stack.Screen name="intro/capitulo-2" />
        <Stack.Screen name="intro/capitulo-3" />
      </Stack.Protected>
      <Stack.Protected guard={!!usuario && configurado}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="corrida" />
        <Stack.Screen name="hidratacao" />
        <Stack.Screen name="perfil" />
        <Stack.Screen name="atributos" />
        <Stack.Screen name="historico" />
        <Stack.Screen name="atividade/[id]" />
        <Stack.Screen name="editar-perfil" />
      </Stack.Protected>
      <Stack.Protected guard={!usuario}>
        <Stack.Screen name="login" />
        <Stack.Screen name="cadastro" />
        <Stack.Screen name="recuperar-senha" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Rotas />
    </AuthProvider>
  );
}