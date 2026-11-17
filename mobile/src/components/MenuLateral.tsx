import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Href, router } from 'expo-router';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { xpParaProximoNivel } from '../domain/jogo';
import { useAuth } from '../state/AuthContext';
import { useJogador } from '../state/useJogador';
import { cores, espaco, fontes } from '../theme';
import { AvatarPixel } from './AvatarPixel';
import { BarraProgresso } from './BarraProgresso';
import { Botao } from './Botao';
import { LogoTR } from './LogoTR';

type Item = {
  rotulo: string;
  icone: keyof typeof Ionicons.glyphMap;
  destino?: Href;
  bloqueado?: boolean; // previsto no Figma, mas fora do escopo do MVP
};

// Ordem e rótulos idênticos ao Figma ("Menu Lateral")
const ITENS: Item[] = [
  { rotulo: 'Meu Perfil', icone: 'person-outline', destino: '/perfil' },
  { rotulo: 'Árvore de Atributos', icone: 'shield-outline', bloqueado: true },
  { rotulo: 'Loja de Itens', icone: 'bag-handle-outline', destino: '/loja' },
  { rotulo: 'Mapa do Mundo', icone: 'map-outline', destino: '/mapa' },
  { rotulo: 'Conquistas', icone: 'trophy-outline', bloqueado: true },
  { rotulo: 'Notificações', icone: 'notifications-outline', destino: '/hidratacao' },
];

export function MenuLateral({ visivel, aoFechar }: { visivel: boolean; aoFechar: () => void }) {
  const { sair } = useAuth();
  const { usuario, avatar } = useJogador();

  const ir = (destino: Href) => {
    aoFechar();
    router.push(destino);
  };

  const emBreve = (nome: string) =>
    Alert.alert(nome, 'Disponível em uma versão futura do Task Running (fora do escopo do MVP).');

  const progressoXp = avatar ? avatar.experiencia / xpParaProximoNivel(avatar.nivel) : 0;

  return (
    <Modal visible={visivel} animationType="slide" onRequestClose={aoFechar} statusBarTranslucent>
      <SafeAreaView style={estilos.raiz}>
        <ScrollView contentContainerStyle={estilos.conteudo}>
          <View style={estilos.topo}>
            <Pressable style={estilos.fechar} onPress={aoFechar} accessibilityLabel="Fechar menu">
              <Ionicons name="close" size={22} color={cores.texto} />
            </Pressable>
            <LogoTR tamanho={96} />
            <Text style={estilos.marca}>TASK RUNNING</Text>
            <Text style={estilos.slogan}>AVENTURE-SE E EVOLUA</Text>
          </View>

          <View style={estilos.corpo}>
            <Pressable style={estilos.cartaoHeroi} onPress={() => ir('/perfil')}>
              <View style={estilos.retrato}>
                {avatar && (
                  <AvatarPixel
                    genero={avatar.genero}
                    cabelo={avatar.cabelo}
                    corPele={avatar.corPele}
                    corRoupa={avatar.corRoupa}
                    tamanho={30}
                  />
                )}
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={estilos.nomeHeroi} numberOfLines={1}>
                  {usuario?.nome.toUpperCase()}
                </Text>
                <View style={estilos.linhaNivel}>
                  <Text style={estilos.selo}>LVL {avatar?.nivel ?? 1}</Text>
                  <View style={{ flex: 1 }}>
                    <BarraProgresso progresso={progressoXp} />
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={cores.textoSuave} />
            </Pressable>

            <Text style={estilos.secao}>MENU PRINCIPAL</Text>
            {ITENS.map((item) => (
              <Pressable
                key={item.rotulo}
                style={estilos.item}
                onPress={() => (item.bloqueado || !item.destino ? emBreve(item.rotulo) : ir(item.destino))}>
                <View style={estilos.iconeItem}>
                  <Ionicons name={item.icone} size={18} color={cores.texto} />
                </View>
                <Text style={estilos.rotuloItem}>{item.rotulo}</Text>
                <Ionicons
                  name={item.bloqueado ? 'lock-closed-outline' : 'chevron-forward'}
                  size={item.bloqueado ? 24 : 16}
                  color={item.bloqueado ? cores.texto : cores.borda}
                />
              </Pressable>
            ))}
          </View>

          <View style={estilos.rodape}>
            <Pressable
              style={estilos.linkRodape}
              onPress={() => Alert.alert('Ajuda & Suporte', 'Fale com a equipe Task Running pelo repositório do projeto.')}>
              <Ionicons name="help-circle-outline" size={20} color={cores.texto} />
              <Text style={estilos.textoRodape}>Ajuda & Suporte</Text>
            </Pressable>
            <Pressable style={estilos.linkRodape} onPress={() => ir('/editar-perfil')}>
              <Ionicons name="settings-outline" size={20} color={cores.texto} />
              <Text style={estilos.textoRodape}>Configurações</Text>
            </Pressable>
            <Botao
              titulo="SAIR DA CONTA"
              iconeEsquerda="log-out-outline"
              onPress={() => {
                aoFechar();
                sair();
              }}
            />
            <Text style={estilos.versao}>VERSÃO {Constants.expoConfig?.version ?? '1.0.0'}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { flexGrow: 1 },
  topo: {
    alignItems: 'center',
    gap: espaco.sm,
    paddingTop: espaco.xl,
    paddingBottom: espaco.lg,
    backgroundColor: cores.superficie,
    borderBottomWidth: 3,
    borderBottomColor: cores.borda,
  },
  fechar: {
    position: 'absolute',
    top: espaco.md,
    right: espaco.md,
    borderWidth: 1,
    borderColor: cores.bordaClara,
    padding: 6,
  },
  marca: { fontFamily: fontes.pixel, color: cores.douradoClaro, fontSize: 20, marginTop: espaco.md },
  slogan: { fontFamily: fontes.mono, color: cores.laranja, fontSize: 11, letterSpacing: 2 },
  corpo: { padding: espaco.md, gap: espaco.sm },
  cartaoHeroi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    padding: espaco.md,
    borderWidth: 3,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
    marginBottom: espaco.md,
  },
  retrato: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#C7D2FE',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  nomeHeroi: { fontFamily: fontes.textoNegrito, color: cores.texto, fontSize: 16 },
  linhaNivel: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  selo: {
    fontFamily: fontes.monoNegrito,
    fontSize: 11,
    color: cores.fundo,
    backgroundColor: cores.dourado,
    paddingHorizontal: 6,
  },
  secao: { fontFamily: fontes.mono, color: cores.textoSuave, fontSize: 11, letterSpacing: 2 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    padding: espaco.md,
    backgroundColor: cores.superficie,
  },
  iconeItem: { borderWidth: 1, borderColor: cores.bordaClara, padding: 6 },
  rotuloItem: { flex: 1, fontFamily: fontes.textoMedio, color: cores.texto, fontSize: 14 },
  rodape: {
    padding: espaco.md,
    gap: espaco.md,
    borderTopWidth: 3,
    borderTopColor: cores.borda,
    backgroundColor: cores.fundoProfundo,
  },
  linkRodape: { flexDirection: 'row', alignItems: 'center', gap: espaco.md, paddingVertical: 4 },
  textoRodape: { fontFamily: fontes.texto, color: cores.texto, fontSize: 14 },
  versao: { fontFamily: fontes.mono, color: cores.textoApagado, fontSize: 11, textAlign: 'center' },
});
