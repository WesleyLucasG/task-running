import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cores, espaco, fontes } from '../theme';

export function Cabecalho({ titulo }: { titulo: string }) {
  return (
    <View style={estilos.linha}>
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Ionicons name="arrow-back" size={26} color={cores.laranja} />
      </Pressable>
      <Text style={estilos.titulo}>{titulo}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  titulo: { fontFamily: fontes.pixel, color: cores.laranja, fontSize: 16 },
});