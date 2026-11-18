import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AvatarPixel } from '../components/AvatarPixel';
import { Botao } from '../components/Botao';
import { CabecalhoJogo } from '../components/CabecalhoJogo';
import { Campo } from '../components/Campo';
import { Aparencia, SeletorAparencia } from '../components/SeletorAparencia';
import { atualizarAparencia, obterJogador } from '../db/jogo';
import { useAuth } from '../state/AuthContext';
import { hermesFalar } from '../state/hermes';
import { cores, espaco, fontes } from '../theme';

// Figma "Criação de Personagem" (3:806). RF11: personalização do avatar.
// Classes (ex.: "Guerreiro") ficam fora: são roadmap no documento (§2.4) — decisão D8.
export default function CriarPersonagem() {
  const { usuario, atualizarPerfil, concluirConfiguracao } = useAuth();
  const [aparencia, setAparencia] = useState<Aparencia | null>(null);
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [espelhado, setEspelhado] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    hermesFalar('ajuda-personagem', 'Escolha gênero, cabelo, cores e detalhe do traje. Você pode mudar depois no Perfil.', 'apresentando');
  }, []);

  useEffect(() => {
    if (!usuario) return;
    obterJogador(usuario.id).then(({ avatar }) =>
      setAparencia({
        genero: avatar.genero,
        cabelo: avatar.cabelo,
        corPele: avatar.corPele,
        corRoupa: avatar.corRoupa,
        corCabelo: avatar.corCabelo,
        detalheRoupa: avatar.detalheRoupa,
      }),
    );
  }, [usuario]);

  async function comecar() {
    if (!usuario || !aparencia) return;
    if (nome.trim().length < 2) {
      Alert.alert('Nome do aventureiro', 'Informe um nome com pelo menos 2 letras.');
      return;
    }
    setSalvando(true);
    try {
      await atualizarAparencia(usuario.id, aparencia);
      if (nome.trim() !== usuario.nome) {
        await atualizarPerfil({ nome: nome.trim(), email: usuario.email, peso: String(usuario.peso) });
      }
      await concluirConfiguracao(); // o roteador leva para a Home
    } catch (e) {
      Alert.alert('Não foi possível salvar', e instanceof Error ? e.message : String(e));
      setSalvando(false);
    }
  }

  return (
    <View style={estilos.raiz}>
      <CabecalhoJogo titulo="Criar Personagem" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
          <View style={estilos.palco}>
            <Text style={estilos.selo}>LV. 1 HERÓI</Text>
            {aparencia && (
              <View style={{ transform: [{ scaleX: espelhado ? -1 : 1 }] }}>
                <AvatarPixel {...aparencia} tamanho={140} />
              </View>
            )}
            <Pressable
              style={estilos.girar}
              onPress={() => setEspelhado((v) => !v)}
              accessibilityLabel="Girar personagem">
              <Ionicons name="refresh" size={22} color={cores.texto} />
            </Pressable>
          </View>

          <Text style={estilos.rotulo}>NOME DO AVENTUREIRO</Text>
          <View style={{ marginTop: -espaco.sm }}>
            <Campo
              rotulo=""
              icone="person-outline"
              value={nome}
              onChangeText={setNome}
              autoCapitalize="characters"
              placeholder="AQUILES"
              maxLength={24}
            />
          </View>

          <View style={estilos.abas}>
            <Text style={estilos.abaAtiva}>APARÊNCIA</Text>
          </View>

          {aparencia && <SeletorAparencia valor={aparencia} aoMudar={setAparencia} />}

          <Botao
            titulo="Começar Jornada"
            fonte="pixel"
            iconeDireita="flash-outline"
            carregando={salvando}
            onPress={comecar}
            estilo={{ marginTop: espaco.lg }}
          />
          <Text style={estilos.nota}>* VOCÊ PODE ALTERAR A APARÊNCIA DEPOIS, NO PERFIL</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.md, gap: espaco.md },
  palco: {
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: cores.borda,
    backgroundColor: cores.fundo,
  },
  selo: {
    position: 'absolute',
    top: espaco.md,
    left: espaco.md,
    fontFamily: fontes.pixel,
    fontSize: 10,
    color: cores.texto,
    backgroundColor: cores.laranja,
    borderWidth: 2,
    borderColor: cores.laranjaEscuro,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  girar: {
    position: 'absolute',
    right: espaco.md,
    bottom: espaco.md,
    borderWidth: 2,
    borderColor: cores.texto,
    padding: 6,
  },
  rotulo: { fontFamily: fontes.mono, color: cores.laranja, fontSize: 13, letterSpacing: 1, marginTop: espaco.md },
  abas: { borderBottomWidth: 2, borderBottomColor: cores.borda, marginTop: espaco.sm },
  abaAtiva: {
    alignSelf: 'flex-start',
    fontFamily: fontes.pixel,
    fontSize: 11,
    color: cores.texto,
    backgroundColor: cores.laranja,
    borderWidth: 2,
    borderColor: cores.laranjaEscuro,
    paddingHorizontal: espaco.xl,
    paddingVertical: 12,
  },
  nota: {
    fontFamily: fontes.mono,
    color: cores.textoSuave,
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: 1,
  },
});
