import { StyleSheet, Text, View } from 'react-native';
import { cores, fontes } from '../theme';

// Moldura dourada do logo "TR" do Figma.
// PENDENTE: quando o PNG do brasão estiver em assets/images/logo-tr.png,
// trocar o conteúdo interno por <Image source={require('../../assets/images/logo-tr.png')} />.
export function LogoTR({ tamanho = 120 }: { tamanho?: number }) {
  return (
    <View style={[estilos.moldura, { width: tamanho, height: tamanho }]}>
      <View style={estilos.interno}>
        <Text style={[estilos.sigla, { fontSize: tamanho * 0.28 }]}>TR</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  moldura: { borderWidth: 4, borderColor: cores.dourado, padding: 6, backgroundColor: cores.fundo },
  interno: {
    flex: 1,
    borderWidth: 2,
    borderColor: cores.douradoEscuro,
    backgroundColor: '#1D3A6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sigla: {
    fontFamily: fontes.pixel,
    color: cores.laranja,
    textShadowColor: cores.douradoClaro,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
});
