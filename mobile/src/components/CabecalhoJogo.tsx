import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useJogador } from '../state/useJogador';
import { cores, espaco, fontes } from '../theme';
import { MenuLateral } from './MenuLateral';

type Props = { titulo: string; voltar?: boolean };

// Cabeçalho padrão das telas do jogo (Figma): título, pílulas de nível e moedas, menu ☰.
export function CabecalhoJogo({ titulo, voltar = false }: Props) {
  const { avatar, moedas } = useJogador();
  const [menuAberto, setMenuAberto] = useState(false);
  const { top } = useSafeAreaInsets();

  return (
    <View style={[estilos.barra, { paddingTop: top + espaco.sm }]}>
      <View style={estilos.esquerda}>
        {voltar && (
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Voltar">
            <Ionicons name="chevron-back" size={22} color={cores.texto} />
          </Pressable>
        )}
        <Text style={estilos.titulo} numberOfLines={1}>
          {titulo}
        </Text>
      </View>
      <View style={estilos.direita}>
        <Pilula icone="star" valor={`${avatar?.nivel ?? 1}`} rotulo="Nível" />
        <Pilula icone="logo-bitcoin" valor={moedas.toLocaleString('pt-BR')} rotulo="Moedas" />
        <Pressable onPress={() => setMenuAberto(true)} hitSlop={12} accessibilityLabel="Abrir menu">
          <Ionicons name="menu" size={26} color={cores.texto} />
        </Pressable>
      </View>
      <MenuLateral visivel={menuAberto} aoFechar={() => setMenuAberto(false)} />
    </View>
  );
}

function Pilula({ icone, valor, rotulo }: { icone: keyof typeof Ionicons.glyphMap; valor: string; rotulo: string }) {
  return (
    <View style={estilos.pilula} accessibilityLabel={`${rotulo}: ${valor}`}>
      <Ionicons name={icone} size={13} color={cores.douradoEscuro} />
      <Text style={estilos.pilulaTexto}>{valor}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: espaco.md,
    paddingBottom: espaco.md,
    backgroundColor: cores.fundo,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  esquerda: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm, flexShrink: 1 },
  titulo: { fontFamily: fontes.textoNegrito, color: cores.texto, fontSize: 15, flexShrink: 1 },
  direita: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  pilula: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: cores.dourado,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pilulaTexto: { fontFamily: fontes.textoNegrito, color: cores.texto, fontSize: 13 },
});
