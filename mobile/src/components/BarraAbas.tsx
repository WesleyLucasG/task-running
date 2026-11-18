import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EXTRAS_FORA_DO_MVP } from '../config/escopo';
import { cores, fontes } from '../theme';

// Barra inferior do Figma: HOME, MAP, INVENTORY, SHOP com traço laranja na aba ativa.
// Tipo das props da barra derivado do próprio <Tabs> do expo-router (sem import profundo)
type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const ABAS: Record<string, { rotulo: string; icone: keyof typeof Ionicons.glyphMap }> = {
  index: { rotulo: 'HOME', icone: 'home-outline' },
  mapa: { rotulo: 'MAP', icone: 'map-outline' },
  inventario: { rotulo: 'INVENTORY', icone: 'briefcase-outline' },
  loja: { rotulo: 'SHOP', icone: 'cart-outline' },
};

export function BarraAbas({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={[estilos.barra, { paddingBottom: bottom + 6 }]}>
      {state.routes.map((rota, i) => {
        const aba = ABAS[rota.name];
        if (!aba) return null;
        if (rota.name === 'loja' && !EXTRAS_FORA_DO_MVP) return null; // Loja: roadmap (§2.4)
        const ativa = state.index === i;
        const cor = ativa ? cores.laranja : cores.textoSuave;
        return (
          <Pressable
            key={rota.key}
            style={estilos.aba}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativa }}
            onPress={() => {
              const evento = emitter.emit({ type: 'tabPress', target: rota.key, canPreventDefault: true });
              if (!ativa && !evento.defaultPrevented) navigateToTab(rota.key);
            }}>
            <View style={[estilos.traco, ativa && { backgroundColor: cores.laranja }]} />
            <Ionicons name={aba.icone} size={24} color={cor} />
            <Text style={[estilos.rotulo, { color: cor }]}>{aba.rotulo}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    backgroundColor: cores.superficie,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
  },
  aba: { flex: 1, alignItems: 'center', gap: 4, paddingTop: 0 },
  traco: { width: 32, height: 3, marginBottom: 8, backgroundColor: 'transparent' },
  rotulo: { fontFamily: fontes.textoMedio, fontSize: 11, letterSpacing: 0.5 },
});
