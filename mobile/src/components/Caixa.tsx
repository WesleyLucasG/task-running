import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { cores, espaco } from '../theme';

// Checkbox quadrado do Figma ("LEMBRAR-ME", "Código de Honra")
export function Caixa({
  marcada,
  aoAlterar,
  children,
  rotuloAcessivel,
}: {
  marcada: boolean;
  aoAlterar: (v: boolean) => void;
  children: ReactNode;
  rotuloAcessivel: string;
}) {
  return (
    <Pressable
      style={estilos.linha}
      onPress={() => aoAlterar(!marcada)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcada }}
      accessibilityLabel={rotuloAcessivel}
      hitSlop={6}>
      <View style={[estilos.quadro, marcada && estilos.marcada]}>
        {marcada && <Ionicons name="checkmark" size={14} color={cores.fundo} />}
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  quadro: {
    width: 18,
    height: 18,
    backgroundColor: cores.texto,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcada: { backgroundColor: cores.laranja },
});
