import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { cores, espaco, fontes } from '../theme';

type Props = {
  rotulo: string;
  icone?: keyof typeof Ionicons.glyphMap; // ícone dentro do campo (tela de login)
  iconeRotulo?: keyof typeof Ionicons.glyphMap; // ícone ao lado do rótulo (cadastro)
  ajuda?: string;
  erro?: string;
  senha?: boolean; // mostra o "olho" para exibir/ocultar
} & TextInputProps;

export function Campo({ rotulo, icone, iconeRotulo, ajuda, erro, senha, style, onFocus, onBlur, ...props }: Props) {
  const [foco, setFoco] = useState(false);
  const [visivel, setVisivel] = useState(false);
  const corBorda = erro ? cores.erro : foco ? cores.laranja : cores.borda;

  return (
    <View style={estilos.grupo}>
      <View style={estilos.linhaRotulo}>
        {iconeRotulo && <Ionicons name={iconeRotulo} size={14} color={cores.texto} />}
        <Text style={[estilos.rotulo, icone && { color: cores.dourado }]}>{rotulo.toUpperCase()}</Text>
      </View>
      <View style={[estilos.caixa, { borderColor: corBorda }]}>
        {icone && <Ionicons name={icone} size={20} color={cores.laranja} />}
        <TextInput
          placeholderTextColor={cores.textoApagado}
          autoCapitalize="none"
          secureTextEntry={senha && !visivel}
          onFocus={(e) => {
            setFoco(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFoco(false);
            onBlur?.(e);
          }}
          style={[estilos.input, style]}
          {...props}
        />
        {senha && (
          <Pressable
            onPress={() => setVisivel((v) => !v)}
            hitSlop={10}
            accessibilityLabel={visivel ? 'Ocultar senha' : 'Mostrar senha'}>
            <Ionicons name={visivel ? 'eye-off-outline' : 'eye-outline'} size={20} color={cores.textoSuave} />
          </Pressable>
        )}
      </View>
      {!!erro && <Text style={estilos.erro}>{erro}</Text>}
      {!erro && !!ajuda && <Text style={estilos.ajuda}>{ajuda}</Text>}
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: espaco.sm },
  linhaRotulo: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  rotulo: { fontFamily: fontes.mono, color: cores.texto, fontSize: 13, letterSpacing: 1.5 },
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    backgroundColor: cores.superficie,
    borderWidth: 2,
    paddingHorizontal: espaco.md,
    minHeight: 48,
  },
  input: { flex: 1, color: cores.texto, fontFamily: fontes.texto, fontSize: 15, paddingVertical: 10 },
  ajuda: { fontFamily: fontes.texto, color: cores.textoSuave, fontSize: 11 },
  erro: { fontFamily: fontes.texto, color: cores.erro, fontSize: 12 },
});
