import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Botao } from '../../components/Botao';
import { Hermes } from '../../components/Hermes';
import { CartaoPasso, Pontos } from '../../components/Intro';
import { useAuth } from '../../state/AuthContext';
import { cores, espaco, fontes } from '../../theme';

// Figma "Onboarding 3" (3:285). Ao terminar, a introdução não aparece mais neste aparelho.
export default function Capitulo3() {
  const { concluirIntro } = useAuth();

  const seguir = async (destino: '/cadastro' | '/login') => {
    router.replace(destino);
    await concluirIntro();
  };

  return (
    <SafeAreaView style={estilos.raiz}>
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <View style={estilos.topo}>
          <Pressable style={estilos.voltar} onPress={() => router.back()} accessibilityLabel="Voltar">
            <Ionicons name="chevron-back" size={20} color={cores.texto} />
          </Pressable>
          <Pontos total={3} atual={2} />
          <View style={{ width: 38 }} />
        </View>

        <View style={estilos.cabeca}>
          <Text style={estilos.tituloA}>CORRA PARA O</Text>
          <Text style={estilos.tituloB}>COMBATE</Text>
          <Text style={estilos.descricao}>
            Seus quilômetros no mundo real são convertidos em <Text style={estilos.enfase}>Energia Divina</Text>.
            Use-a para desbloquear confrontos épicos contra monstros mitológicos!
          </Text>
        </View>

        <CartaoPasso icone="footsteps-outline" corIcone={cores.laranja} titulo="1. CORRA NO MUNDO REAL">
          Cada passo gera experiência e recursos para o seu herói.
        </CartaoPasso>
        <CartaoPasso icone="flash-outline" corIcone={cores.dourado} titulo="2. ACUMULE ENERGIA">
          Sincronize seu GPS para encher a barra de progresso da fase.
        </CartaoPasso>
        <CartaoPasso icone="flame-outline" corIcone={cores.laranjaEscuro} titulo="3. DERROTE O BOSS">
          Enfrente o Minotauro ou a Hidra para ganhar baús raros.
        </CartaoPasso>

        <Hermes
          destaque
          pose="apresentando"
          mensagem="O Olimpo espera por você! Quanto mais você corre, mais forte seu avatar se torna. Pronto para o primeiro desafio?"
          estilo={{ marginTop: espaco.md }}
        />

        <View style={estilos.trilha}>
          <View style={estilos.bolinha} />
          <View style={estilos.pontilhado} />
          <Ionicons name="game-controller-outline" size={22} color={cores.laranja} />
          <View style={estilos.pontilhado} />
          <Ionicons name="trophy-outline" size={22} color={cores.dourado} />
        </View>
      </ScrollView>

      <View style={estilos.rodape}>
        <Botao
          titulo="COMEÇAR AVENTURA"
          iconeDireita="arrow-forward"
          onPress={() => seguir('/cadastro')}
        />
        <Pressable onPress={() => seguir('/login')} hitSlop={8}>
          <Text style={estilos.jaTenho}>JÁ POSSUO UMA CONTA</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.md, gap: espaco.md },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: espaco.sm },
  voltar: { borderWidth: 2, borderColor: cores.borda, backgroundColor: cores.superficie, padding: 7 },
  cabeca: { alignItems: 'center', gap: espaco.sm, marginVertical: espaco.lg },
  tituloA: { fontFamily: fontes.pixel, color: cores.laranja, fontSize: 18 },
  tituloB: { fontFamily: fontes.pixel, color: cores.douradoClaro, fontSize: 18 },
  descricao: {
    fontFamily: fontes.texto,
    color: cores.textoSuave,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: espaco.sm,
  },
  enfase: { fontFamily: fontes.textoNegrito, fontStyle: 'italic', color: cores.texto },
  trilha: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm, marginTop: espaco.md },
  bolinha: { width: 22, height: 22, borderRadius: 11, backgroundColor: cores.bordaClara },
  pontilhado: { flex: 1, borderTopWidth: 2, borderStyle: 'dotted', borderColor: cores.bordaClara },
  rodape: { padding: espaco.md, gap: espaco.md, alignItems: 'stretch' },
  jaTenho: { fontFamily: fontes.textoNegrito, color: cores.textoSuave, fontSize: 12, textAlign: 'center' },
});
