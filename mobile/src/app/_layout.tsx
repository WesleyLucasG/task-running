import NetInfo from '@react-native-community/netinfo';
import { PressStart2P_400Regular, useFonts } from '@expo-google-fonts/press-start-2p';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { sincronizarPendentes } from '../services/sincronizacao';
import { AuthProvider, useAuth } from '../state/AuthContext';
import { cores } from '../theme';

SplashScreen.preventAutoHideAsync();

function Rotas() {
  const { usuario, carregando } = useAuth();
  const [fontesOk, erroFonte] = useFonts({ PressStart2P_400Regular });
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

  if (!pronto) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }}>
      <Stack.Protected guard={!!usuario}>
        <Stack.Screen name="(tabs)" />
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