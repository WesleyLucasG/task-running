import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { initDatabase } from '../database/db';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Inicializa o banco SQLite local
    initDatabase();
    
    // Esconde a tela de carregamento (Splash)
    SplashScreen.hideAsync();
  }, []);

  // Deixa o Expo Router gerenciar as telas da pasta src/app automaticamente
  return <Stack screenOptions={{ headerShown: false }} />;
}