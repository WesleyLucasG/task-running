import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Botao } from '../../components/Botao';
import { SpriteHermes } from '../../components/Hermes';
import { Pontos } from '../../components/Intro';
import { cores, espaco, fontes } from '../../theme';

// PROVISÓRIO: o "Onboarding 1" do Figma (3:59) ainda não pôde ser consultado.
// Segue o mesmo padrão visual dos capítulos II e III; trocar pelo layout original quando houver cota.
export default function Capitulo1() {
  return (
    <SafeAreaView style={estilos.raiz}>
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <Text style={estilos.capitulo}>CAPÍTULO I</Text>
        <Text style={estilos.titulo}>O CHAMADO{'\n'}DE HERMES</Text>
        <View style={estilos.sublinhado} />

        <View style={estilos.palco}>
          <SpriteHermes pose="acenando" altura={220} />
        </View>

        <View style={estilos.quadro}>
          <Text style={estilos.texto}>
            Saudações, herói! Eu sou <Text style={estilos.enfase}>Hermes</Text>, mensageiro do Olimpo. No Task
            Running, cada passo que você dá no mundo real vira progresso no reino: experiência, moedas, itens e
            batalhas contra os chefes de cada fase.
          </Text>
        </View>
      </ScrollView>

      <View style={estilos.rodape}>
        <Botao titulo="PRÓXIMO" iconeDireita="arrow-forward" onPress={() => router.push('/intro/capitulo-2')} />
        <Pontos total={3} atual={0} />
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.md, gap: espaco.md },
  capitulo: { fontFamily: fontes.mono, color: cores.laranja, fontSize: 12, letterSpacing: 2, marginTop: espaco.lg },
  titulo: { fontFamily: fontes.pixel, color: cores.texto, fontSize: 20, lineHeight: 30 },
  sublinhado: { width: 56, height: 4, backgroundColor: cores.laranja },
  palco: { alignItems: 'center', paddingVertical: espaco.lg },
  quadro: { padding: espaco.md, backgroundColor: cores.superficie, borderWidth: 2, borderColor: cores.borda },
  texto: { fontFamily: fontes.texto, color: cores.texto, fontSize: 15, lineHeight: 23 },
  enfase: { fontFamily: fontes.textoNegrito, color: cores.laranja },
  rodape: { padding: espaco.md, gap: espaco.md, borderTopWidth: 2, borderTopColor: cores.borda },
});
