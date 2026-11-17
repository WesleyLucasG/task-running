import { Ionicons } from '@expo/vector-icons';
import { Href, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AvatarPixel } from '../../components/AvatarPixel';
import { BarraProgresso } from '../../components/BarraProgresso';
import { Botao } from '../../components/Botao';
import { CabecalhoJogo } from '../../components/CabecalhoJogo';
import { Hermes } from '../../components/Hermes';
import { xpParaProximoNivel } from '../../domain/jogo';
import { useJogador } from '../../state/useJogador';
import { cores, espaco, fontes } from '../../theme';

// HOME PROVISÓRIA: as 3 versões da Home no Figma ainda não puderam ser consultadas
// (limite do MCP). Esta tela reúne os atalhos do fluxo principal com a identidade
// visual do Figma e será substituída pelo layout original no passo 8.
export default function Home() {
  const { usuario, avatar } = useJogador();
  const xpMeta = avatar ? xpParaProximoNivel(avatar.nivel) : 1;

  return (
    <View style={estilos.raiz}>
      <CabecalhoJogo titulo="HOME" />
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <View style={estilos.cartao}>
          <View style={estilos.palco}>
            {avatar && (
              <AvatarPixel
                genero={avatar.genero}
                cabelo={avatar.cabelo}
                corPele={avatar.corPele}
                corRoupa={avatar.corRoupa}
                tamanho={84}
              />
            )}
          </View>
          <View style={{ flex: 1, gap: espaco.sm }}>
            <Text style={estilos.nome}>{usuario?.nome.toUpperCase()}</Text>
            <Text style={estilos.selo}>LVL {avatar?.nivel ?? 1}</Text>
            <BarraProgresso progresso={(avatar?.experiencia ?? 0) / xpMeta} />
            <Text style={estilos.legenda}>
              {avatar?.experiencia ?? 0} / {xpMeta} XP
            </Text>
          </View>
        </View>

        <Hermes mensagem="Cada quilômetro real fortalece seu herói. Vamos treinar hoje?" />

        <Botao
          titulo="Iniciar Corrida"
          fonte="pixel"
          iconeDireita="chevron-forward"
          onPress={() => router.push('/corrida')}
        />

        <View style={estilos.grade}>
          <Atalho icone="water-outline" rotulo="Hidratação" destino="/hidratacao" />
          <Atalho icone="time-outline" rotulo="Histórico" destino="/historico" />
          <Atalho icone="person-outline" rotulo="Perfil" destino="/perfil" />
        </View>
      </ScrollView>
    </View>
  );
}

function Atalho({ icone, rotulo, destino }: { icone: keyof typeof Ionicons.glyphMap; rotulo: string; destino: Href }) {
  return (
    <Pressable style={estilos.atalho} onPress={() => router.push(destino)}>
      <Ionicons name={icone} size={24} color={cores.laranja} />
      <Text style={estilos.atalhoTexto}>{rotulo.toUpperCase()}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.md, gap: espaco.lg },
  cartao: {
    flexDirection: 'row',
    gap: espaco.md,
    padding: espaco.md,
    backgroundColor: cores.superficie,
    borderWidth: 2,
    borderColor: cores.borda,
  },
  palco: {
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.fundo,
    borderWidth: 2,
    borderColor: cores.borda,
    paddingVertical: espaco.sm,
  },
  nome: { fontFamily: fontes.textoNegrito, color: cores.texto, fontSize: 16 },
  selo: {
    alignSelf: 'flex-start',
    fontFamily: fontes.pixel,
    fontSize: 10,
    color: cores.texto,
    backgroundColor: cores.laranja,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  legenda: { fontFamily: fontes.mono, color: cores.textoSuave, fontSize: 11 },
  grade: { flexDirection: 'row', gap: espaco.sm },
  atalho: {
    flex: 1,
    alignItems: 'center',
    gap: espaco.sm,
    paddingVertical: espaco.md,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  atalhoTexto: { fontFamily: fontes.mono, color: cores.texto, fontSize: 10, letterSpacing: 1 },
});
