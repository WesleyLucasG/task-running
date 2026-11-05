import { StyleSheet, Text, View } from 'react-native';
import { cores, espaco, fontes, raio } from '../theme';

export function Estatistica({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={estilos.caixa}>
      <Text style={estilos.valor}>{valor}</Text>
      <Text style={estilos.rotulo}>{rotulo}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: {
    flex: 1,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.md,
    paddingVertical: espaco.md,
    alignItems: 'center',
    gap: espaco.xs,
  },
  valor: { fontFamily: fontes.pixel, color: cores.texto, fontSize: 13 },
  rotulo: { color: cores.textoSuave, fontSize: 11 },
});