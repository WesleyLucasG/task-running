import { StyleSheet, Text } from 'react-native';
import { cores, espaco, fontes } from '../theme';
import { Tela } from './Tela';

export function EmConstrucao({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <Tela>
      <Text style={estilos.titulo}>{titulo}</Text>
      <Text style={estilos.texto}>{descricao}</Text>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  titulo: { fontFamily: fontes.pixel, color: cores.laranja, fontSize: 16, marginTop: espaco.md },
  texto: { color: cores.textoSuave, fontSize: 15 },
});