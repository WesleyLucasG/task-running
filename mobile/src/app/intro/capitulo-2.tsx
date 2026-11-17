import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Botao } from '../../components/Botao';
import { SpriteHermes } from '../../components/Hermes';
import { CartaoRegra, Pontos } from '../../components/Intro';
import { cores, espaco, fontes } from '../../theme';

// Figma "Onboarding 2" (3:131). Textos dos cartões ajustados às regras implementadas
// (RF18, RF21, RF26, RN12) — ver decisão D12 no PROGRESSO.md.
export default function Capitulo2() {
  return (
    <SafeAreaView style={estilos.raiz}>
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <Text style={estilos.capitulo}>CAPÍTULO II</Text>
        <Text style={estilos.titulo}>COMBATE{'\n'}AUTOMÁTICO</Text>
        <View style={estilos.sublinhado} />

        <View style={estilos.palco}>
          <SpriteHermes pose="disparada" altura={170} />
        </View>

        <View style={estilos.comoFunciona}>
          <View style={estilos.linhaComo}>
            <Ionicons name="information-circle-outline" size={18} color={cores.laranja} />
            <Text style={estilos.tituloComo}>Como Funciona?</Text>
          </View>
          <Text style={estilos.textoComo}>
            Seu herói nunca descansa! Enquanto você vive sua vida, ele evolui com cada quilômetro que você
            percorre.
          </Text>
        </View>

        <CartaoRegra icone="flash-outline" titulo="ATAQUE CONTÍNUO" corBorda={cores.laranja}>
          Seu golpe contra o chefe cresce com sua Força, seus equipamentos e sua maior distância das últimas 24h.
        </CartaoRegra>
        <CartaoRegra icone="shield-outline" titulo="DEFESA ATIVA" corBorda={cores.dourado}>
          Itens equipados aumentam seus atributos e mudam o visual do herói.
        </CartaoRegra>
        <CartaoRegra icone="trophy-outline" titulo="SAQUE AUTOMÁTICO" corBorda={cores.dourado}>
          XP e moedas são creditados assim que cada atividade termina. Verifique seu inventário!
        </CartaoRegra>

        <View style={estilos.status}>
          <Text style={estilos.statusEsq}>PRÓXIMA BATALHA</Text>
          <Text style={estilos.statusDir}>SINCRONIZANDO ...</Text>
        </View>
      </ScrollView>

      <View style={estilos.rodape}>
        <View style={estilos.botoes}>
          <Botao
            titulo="VOLTAR"
            variante="escuro"
            iconeEsquerda="arrow-back"
            onPress={() => router.back()}
            estilo={{ flex: 1 }}
          />
          <Botao
            titulo="ENTENDIDO"
            iconeDireita="arrow-forward"
            onPress={() => router.push('/intro/capitulo-3')}
            estilo={{ flex: 1.4 }}
          />
        </View>
        <Pontos total={3} atual={1} />
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
  palco: { alignItems: 'center', paddingVertical: espaco.md },
  comoFunciona: {
    padding: espaco.md,
    gap: espaco.sm,
    backgroundColor: cores.superficie,
    borderWidth: 3,
    borderColor: cores.borda,
  },
  linhaComo: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  tituloComo: { fontFamily: fontes.textoNegrito, color: cores.laranja, fontSize: 16 },
  textoComo: { fontFamily: fontes.texto, color: cores.texto, fontSize: 15, lineHeight: 23 },
  status: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: espaco.sm,
    borderBottomWidth: 3,
    borderBottomColor: cores.borda,
  },
  statusEsq: { fontFamily: fontes.mono, color: cores.textoSuave, fontSize: 10, letterSpacing: 1 },
  statusDir: { fontFamily: fontes.mono, color: cores.laranja, fontSize: 10, letterSpacing: 1 },
  rodape: { padding: espaco.md, gap: espaco.md },
  botoes: { flexDirection: 'row', gap: espaco.md },
});
