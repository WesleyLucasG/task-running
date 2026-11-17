import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { cores, espaco, fontes } from '../theme';

// Indicador de páginas quadrado do Figma (ativo = barra laranja mais larga)
export function Pontos({ total, atual }: { total: number; atual: number }) {
  return (
    <View style={estilos.pontos} accessibilityLabel={`Passo ${atual + 1} de ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[estilos.ponto, i === atual && estilos.pontoAtivo]} />
      ))}
    </View>
  );
}

// Cartão de regra do Onboarding 2 (borda colorida à esquerda + ícone em moldura)
export function CartaoRegra({
  icone,
  titulo,
  children,
  corBorda,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  titulo: string;
  children: ReactNode;
  corBorda: string;
}) {
  return (
    <View style={[estilos.regra, { borderLeftColor: corBorda }]}>
      <View style={estilos.iconeRegra}>
        <Ionicons name={icone} size={20} color={corBorda === cores.laranja ? cores.texto : cores.laranja} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={estilos.tituloRegra}>{titulo}</Text>
        <Text style={estilos.textoRegra}>{children}</Text>
      </View>
    </View>
  );
}

// Cartão numerado do Onboarding 3 (ícone em quadrado colorido)
export function CartaoPasso({
  icone,
  corIcone,
  titulo,
  children,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  corIcone: string;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <View style={estilos.passo}>
      <View style={[estilos.iconePasso, { backgroundColor: corIcone }]}>
        <Ionicons name={icone} size={22} color={cores.texto} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={estilos.tituloPasso}>{titulo}</Text>
        <Text style={estilos.textoPasso}>{children}</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  pontos: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  ponto: { width: 10, height: 10, backgroundColor: cores.bordaClara },
  pontoAtivo: { width: 24, backgroundColor: cores.laranja },
  regra: {
    flexDirection: 'row',
    gap: espaco.md,
    padding: espaco.md,
    backgroundColor: cores.superficie,
    borderLeftWidth: 4,
  },
  iconeRegra: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: cores.bordaClara,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloRegra: { fontFamily: fontes.textoNegrito, color: cores.texto, fontSize: 14, letterSpacing: 0.5 },
  textoRegra: { fontFamily: fontes.texto, color: cores.textoSuave, fontSize: 13, lineHeight: 19 },
  passo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    padding: espaco.md,
    backgroundColor: cores.superficie,
    borderWidth: 2,
    borderColor: cores.borda,
  },
  iconePasso: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: cores.borda,
  },
  tituloPasso: { fontFamily: fontes.textoNegrito, color: cores.texto, fontSize: 14 },
  textoPasso: { fontFamily: fontes.texto, color: cores.textoSuave, fontSize: 12, lineHeight: 17 },
});
