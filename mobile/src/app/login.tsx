import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Botao } from '../components/Botao';
import { Caixa } from '../components/Caixa';
import { Campo } from '../components/Campo';
import { FundoPixel } from '../components/FundoPixel';
import { LogoTR } from '../components/LogoTR';
import { useAuth } from '../state/AuthContext';
import { cores, espaco, fontes } from '../theme';

// Figma "Login" (3:442). RF04: login com e-mail e senha. RNF13: bloqueio após 5 falhas.
export default function Login() {
  const { entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(true);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function aoEntrar() {
    setErro('');
    if (!email.trim() || !senha) {
      setErro('Informe e-mail e senha.');
      return;
    }
    setCarregando(true);
    try {
      await entrar(email, senha, lembrar);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
      setCarregando(false);
    }
  }

  return (
    <FundoPixel cantos>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
            <View style={estilos.topo}>
              <LogoTR tamanho={120} />
              <Text style={estilos.marca}>TASK{'\n'}RUNNING</Text>
              <Text style={estilos.slogan}>AVENTURE-SE E EVOLUA</Text>
            </View>

            <View style={estilos.cartao}>
              <Text style={estilos.titulo}>Entrar</Text>
              <View style={estilos.linhaTitulo} />

              <Campo
                rotulo="E-mail"
                icone="mail-outline"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoComplete="email"
                placeholder="heroi@olimpo.com"
              />
              <Campo
                rotulo="Senha"
                icone="lock-closed-outline"
                senha
                value={senha}
                onChangeText={setSenha}
                autoComplete="current-password"
                placeholder="••••••••"
                onSubmitEditing={aoEntrar}
              />

              <View style={estilos.linhaOpcoes}>
                <Caixa marcada={lembrar} aoAlterar={setLembrar} rotuloAcessivel="Lembrar-me">
                  <Text style={estilos.opcao}>LEMBRAR-ME</Text>
                </Caixa>
                <Pressable onPress={() => router.push('/recuperar-senha')} hitSlop={8}>
                  <Text style={estilos.esqueci}>ESQUECI A SENHA</Text>
                </Pressable>
              </View>

              {!!erro && <Text style={estilos.erro}>{erro}</Text>}

              <Botao
                titulo="Iniciar Jornada"
                fonte="pixel"
                iconeDireita="chevron-forward"
                onPress={aoEntrar}
                carregando={carregando}
              />

              <View style={estilos.divisor}>
                <View style={estilos.traco} />
                <Text style={estilos.ou}>OU</Text>
                <View style={estilos.traco} />
              </View>

              <Botao titulo="CRIAR NOVA CONTA" variante="contorno" onPress={() => router.push('/cadastro')} />
            </View>

            <Pressable
              style={estilos.ajuda}
              onPress={() =>
                Alert.alert(
                  'Dificuldades no acesso?',
                  'Use "Esqueci a senha" para redefinir sua senha. Após 5 tentativas inválidas o acesso fica bloqueado por 15 minutos.',
                )
              }>
              <Ionicons name="help-circle-outline" size={18} color={cores.dourado} />
              <Text style={estilos.ajudaTexto}>DIFICULDADES NO ACESSO? CONTATE-NOS</Text>
            </Pressable>

            <Text style={estilos.versao}>
              V{Constants.expoConfig?.version ?? '1.0.0'}-PIXEL-ALPHA{'\n'}© 2026 TASK RUNNING STUDIO
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </FundoPixel>
  );
}

const estilos = StyleSheet.create({
  conteudo: { flexGrow: 1, padding: espaco.lg, paddingTop: espaco.xl, gap: espaco.lg },
  topo: { alignItems: 'center', gap: espaco.sm },
  marca: {
    fontFamily: fontes.pixel,
    color: cores.douradoClaro,
    fontSize: 30,
    lineHeight: 44,
    textAlign: 'center',
    marginTop: espaco.md,
    textShadowColor: cores.douradoEscuro,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  slogan: { fontFamily: fontes.mono, color: '#FDBA74', fontSize: 12, letterSpacing: 3 },
  cartao: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 3,
    borderColor: '#CBD5E1',
    padding: espaco.lg,
    gap: espaco.md,
  },
  titulo: { fontFamily: fontes.pixel, color: cores.texto, fontSize: 20, textAlign: 'center' },
  linhaTitulo: { height: 2, backgroundColor: '#CBD5E1', marginBottom: espaco.sm },
  linhaOpcoes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  opcao: { fontFamily: fontes.textoMedio, color: cores.texto, fontSize: 12 },
  esqueci: {
    fontFamily: fontes.textoNegrito,
    color: cores.laranja,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  erro: { fontFamily: fontes.texto, color: cores.erro, fontSize: 13 },
  divisor: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  traco: { flex: 1, height: 2, backgroundColor: '#CBD5E1' },
  ou: { fontFamily: fontes.mono, color: cores.textoSuave, fontSize: 11 },
  ajuda: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: cores.textoSuave,
    paddingVertical: espaco.sm,
    marginHorizontal: espaco.md,
  },
  ajudaTexto: { fontFamily: fontes.textoNegrito, color: cores.texto, fontSize: 11 },
  versao: {
    fontFamily: fontes.mono,
    color: cores.textoSuave,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 16,
    letterSpacing: 1,
  },
});
