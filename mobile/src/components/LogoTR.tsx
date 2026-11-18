import { Image, StyleSheet, View } from 'react-native';
import { cores } from '../theme';

// Brasão "TR" do Figma: logo sobre quadrado branco dentro da moldura dourada.
export function LogoTR({ tamanho = 120 }: { tamanho?: number }) {
  return (
    <View style={[estilos.moldura, { width: tamanho, height: tamanho }]}>
      <View style={estilos.interno}>
        <Image
          source={require('../../assets/images/logo-tr.png')}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
          accessibilityLabel="Logo Task Running"
        />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  moldura: { borderWidth: 4, borderColor: cores.dourado, padding: 6, backgroundColor: cores.superficie },
  interno: { flex: 1, backgroundColor: '#FFFFFF', padding: 4 },
});
