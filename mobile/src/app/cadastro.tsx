import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Botao } from '../components/Botao';
import { Caixa } from '../components/Caixa';
import { Campo } from '../components/Campo';
import { mascararCpf } from '../domain/validacoes';
import { useAuth } from '../state/AuthContext';
import { cores, espaco, fontes } from '../theme';

const CODIGO_DE_HONRA =
  'Ao entrar no reino você se compromete a registrar apenas atividades reais, respeitar seus limites ' +
  'físicos e não compartilhar sua conta. Seus dados (CPF criptografado, e-mail, peso e altura) são usados ' +
  'somente para o funcionamento do Task Running.';

// Figma "Cadastro" (3:559). RF01 (nome, e-mail, senha, peso, CPF), RF02 (CPF válido),
// RF03 (CPF/e-mail únicos), RF08 (regra de senha). Altura é opcional (Figma).
export default function Cadastro() {
  const { cadastrar } = useAuth();
  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    email: '',
    confirmarEmail: '',
    peso: '',
    altura: '',
    senha: '',
    confirmarSenha: '',
  });
  const [aceite, setAceite] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const mudar = (campo: keyof typeof form) => (valor: string) =>
    setForm((f) => ({ ...f, [campo]: campo === 'cpf' ? mascararCpf(valor) : valor }));

  async function aoCadastrar() {
    setErro('');
    if (form.email.trim().toLowerCase() !== form.confirmarEmail.trim().toLowerCase()) {
      setErro('Os e-mails não conferem.');
      return;
    }
    setCarregando(true);
    try {
      await cadastrar(form);
      // Novo herói segue para a introdução (Onboarding → Permissões → Criação de Personagem)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={estilos.raiz}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
          <View style={estilos.topo}>
            <Pressable style={estilos.voltar} onPress={() => router.back()} accessibilityLabel="Voltar">
              <Ionicons name="arrow-back" size={20} color={cores.texto} />
            </Pressable>
            <View>
              <Text style={estilos.titulo}>NOVO HERÓI</Text>
              <Text style={estilos.subtitulo}>COMECE SUA JORNADA</Text>
            </View>
          </View>

          <View>
            <Text style={estilos.secao}>Criar Conta</Text>
            <Text style={estilos.descricao}>Preencha os campos para entrar no reino.</Text>
          </View>

          <Campo
            rotulo="Nome do usuário"
            iconeRotulo="person-outline"
            value={form.nome}
            onChangeText={mudar('nome')}
            autoCapitalize="words"
            placeholder="Ex: Achilles_Run"
          />
          <Campo
            rotulo="CPF usuário"
            iconeRotulo="person-outline"
            value={form.cpf}
            onChangeText={mudar('cpf')}
            keyboardType="number-pad"
            placeholder="Ex: 000.000.000-00"
          />
          <Campo
            rotulo="Email"
            iconeRotulo="mail-outline"
            value={form.email}
            onChangeText={mudar('email')}
            keyboardType="email-address"
            autoComplete="email"
            placeholder="heroi@olimpo.com"
          />
          <Campo
            rotulo="Confirmar email"
            iconeRotulo="mail-outline"
            value={form.confirmarEmail}
            onChangeText={mudar('confirmarEmail')}
            keyboardType="email-address"
            placeholder="heroi@olimpo.com"
          />

          <View style={estilos.linhaDupla}>
            <View style={{ flex: 1 }}>
              <Campo
                rotulo="Peso"
                iconeRotulo="heart-outline"
                value={form.peso}
                onChangeText={mudar('peso')}
                keyboardType="decimal-pad"
                placeholder="Ex: 52 kg"
                ajuda="Em quilogramas"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Campo
                rotulo="Altura"
                iconeRotulo="heart-outline"
                value={form.altura}
                onChangeText={mudar('altura')}
                keyboardType="decimal-pad"
                placeholder="Ex: 1,40m"
                ajuda="Em metro e centímetros"
              />
            </View>
          </View>
          <Text style={estilos.nota}>
            Para melhor experiência informe peso e altura, ativando o Módulo de Hidratação.
          </Text>

          <Campo
            rotulo="Senha"
            iconeRotulo="lock-closed-outline"
            senha
            value={form.senha}
            onChangeText={mudar('senha')}
            placeholder="••••••••"
            ajuda="Mínimo de 8 caracteres, com letra, número e caractere especial."
          />
          <Campo
            rotulo="Confirmar senha"
            iconeRotulo="lock-closed-outline"
            senha
            value={form.confirmarSenha}
            onChangeText={mudar('confirmarSenha')}
            placeholder="••••••••"
          />

          <View style={estilos.aceite}>
            <Caixa marcada={aceite} aoAlterar={setAceite} rotuloAcessivel="Aceito o Código de Honra">
              <Text style={estilos.aceiteTexto}>
                Eu aceito o{' '}
                <Text style={estilos.link} onPress={() => Alert.alert('Código de Honra', CODIGO_DE_HONRA)}>
                  Código de Honra
                </Text>{' '}
                e os termos de privacidade do reino.
              </Text>
            </Caixa>
          </View>

          {!!erro && <Text style={estilos.erro}>{erro}</Text>}

          <Botao
            titulo="CRIAR CONTA"
            fonte="pixel"
            iconeDireita="chevron-forward"
            desabilitado={!aceite}
            carregando={carregando}
            onPress={aoCadastrar}
          />

          <View style={estilos.divisor}>
            <View style={estilos.traco} />
            <Text style={estilos.jaHeroi}>JÁ É UM HERÓI?</Text>
            <View style={estilos.traco} />
          </View>
          <Botao titulo="ENTRAR" variante="claro" onPress={() => router.back()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.md, paddingBottom: espaco.xl, gap: espaco.md },
  topo: { flexDirection: 'row', alignItems: 'center', gap: espaco.md, marginVertical: espaco.sm },
  voltar: { borderWidth: 2, borderColor: cores.borda, backgroundColor: cores.superficie, padding: 8 },
  titulo: { fontFamily: fontes.pixel, color: cores.texto, fontSize: 18 },
  subtitulo: { fontFamily: fontes.mono, color: cores.laranja, fontSize: 11, letterSpacing: 1, marginTop: 4 },
  secao: { fontFamily: fontes.textoNegrito, color: cores.texto, fontSize: 17 },
  descricao: { fontFamily: fontes.texto, color: cores.textoSuave, fontSize: 13 },
  linhaDupla: { flexDirection: 'row', gap: espaco.lg },
  nota: { fontFamily: fontes.texto, color: cores.textoSuave, fontSize: 11, textAlign: 'center' },
  aceite: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: cores.bordaClara,
    backgroundColor: cores.superficie,
    padding: espaco.md,
  },
  aceiteTexto: { fontFamily: fontes.texto, color: cores.texto, fontSize: 13, lineHeight: 20 },
  link: { color: cores.laranja, textDecorationLine: 'underline' },
  erro: { fontFamily: fontes.texto, color: cores.erro, fontSize: 13 },
  divisor: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  traco: { flex: 1, height: 2, backgroundColor: cores.borda },
  jaHeroi: { fontFamily: fontes.mono, color: cores.textoSuave, fontSize: 11, letterSpacing: 2 },
});
