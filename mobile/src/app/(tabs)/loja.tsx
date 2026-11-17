import { StyleSheet, Text, View } from 'react-native';
import { CabecalhoJogo } from '../../components/CabecalhoJogo';
import { cores, espaco, fontes } from '../../theme';

// Passo 14 do plano: "Loja Mística" do Figma. Placeholder até a implementação.
export default function Loja() {
  return (
    <View style={estilos.raiz}>
      <CabecalhoJogo titulo="LOJA MÍSTICA" />
      <View style={estilos.centro}>
        <Text style={estilos.titulo}>EM BREVE</Text>
        <Text style={estilos.texto}>A Loja Mística será aberta em uma próxima etapa.</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: espaco.md, padding: espaco.lg },
  titulo: { fontFamily: fontes.pixel, color: cores.laranja, fontSize: 16 },
  texto: { fontFamily: fontes.texto, color: cores.textoSuave, fontSize: 14, textAlign: 'center' },
});
