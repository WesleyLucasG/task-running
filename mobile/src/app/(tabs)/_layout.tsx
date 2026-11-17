import { Tabs } from 'expo-router';
import { BarraAbas } from '../../components/BarraAbas';

// Abas conforme o Figma: HOME, MAP, INVENTORY, SHOP.
// Corrida, Hidratação e Perfil são telas da pilha, abertas pela Home e pelo menu lateral.
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BarraAbas {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="mapa" />
      <Tabs.Screen name="inventario" />
      <Tabs.Screen name="loja" />
    </Tabs>
  );
}
