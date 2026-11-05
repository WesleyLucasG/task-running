import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ColorValue } from 'react-native';
import { cores } from '../../theme';

const icone =
  (nome: keyof typeof Ionicons.glyphMap) =>
  ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={nome} color={color as string} size={size} />
  );

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cores.laranja,
        tabBarInactiveTintColor: cores.textoSuave,
        tabBarStyle: { backgroundColor: cores.superficie, borderTopColor: cores.borda },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Mapa', tabBarIcon: icone('map') }} />
      <Tabs.Screen name="corrida" options={{ title: 'Corrida', tabBarIcon: icone('walk') }} />
      <Tabs.Screen name="hidratacao" options={{ title: 'Água', tabBarIcon: icone('water') }} />
      <Tabs.Screen name="inventario" options={{ title: 'Inventário', tabBarIcon: icone('bag') }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: icone('person') }} />
    </Tabs>
  );
}