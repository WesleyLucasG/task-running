import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { cores, espaco, raio } from '../theme';

export function Campo({ rotulo, ...props }: { rotulo: string } & TextInputProps) {
  return (
    <View style={estilos.grupo}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <TextInput
        placeholderTextColor={cores.textoSuave}
        autoCapitalize="none"
        style={estilos.input}
        {...props}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: espaco.xs },
  rotulo: { color: cores.textoSuave, fontSize: 13 },
  input: {
    backgroundColor: cores.fundo,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.md,
    color: cores.texto,
    paddingHorizontal: espaco.md,
    paddingVertical: 12,
    fontSize: 16,
  },
});