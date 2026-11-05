import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { cores, espaco, fontes, raio } from '../theme';

type Props = {
  titulo: string;
  onPress: () => void;
  carregando?: boolean;
  variante?: 'primario' | 'contorno';
};

export function Botao({ titulo, onPress, carregando = false, variante = 'primario' }: Props) {
  const primario = variante === 'primario';
  return (
    <Pressable
      onPress={onPress}
      disabled={carregando}
      style={({ pressed }) => [
        estilos.base,
        primario ? estilos.primario : estilos.contorno,
        (pressed || carregando) && { opacity: 0.7 },
      ]}>
      {carregando ? (
        <ActivityIndicator color={cores.texto} />
      ) : (
        <Text style={[estilos.texto, !primario && { color: cores.laranja }]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    paddingVertical: espaco.md,
    borderRadius: raio.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primario: { backgroundColor: cores.laranja },
  contorno: { borderWidth: 2, borderColor: cores.laranja },
  texto: { fontFamily: fontes.pixel, fontSize: 11, color: cores.texto },
});