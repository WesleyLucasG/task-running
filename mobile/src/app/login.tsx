import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Botao } from '../components/Botao';
import { Campo } from '../components/Campo';
import { Tela } from '../components/Tela';
import { useAuth } from '../state/AuthContext';
import { cores, espaco, fontes, raio } from '../theme';

export default function Login() {
  const { entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function aoEntrar() {
    setErro('');
    setCarregando(true);
    try {
      await entrar(email, senha);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
      setCarregando(false);
    }
  }

  return (
    <Tela>
      <View style={estilos.logo}>
        <Text style={estilos.logoTexto}>TASK</Text>
        <Text style={estilos.logoTexto}>RUNNING</Text>
        <Text style={estilos.subtitulo}>Cada passo é uma aventura</Text>
      </View>

      <View style={estilos.cartao}>
        <Text style={estilos.titulo}>ENTRAR</Text>
        <Campo
          rotulo="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder="seu@email.com"
        />
        <Campo
          rotulo="Senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          placeholder="Sua senha"
        />
        {!!erro && <Text style={estilos.erro}>{erro}</Text>}
        <Botao titulo="ENTRAR" onPress={aoEntrar} carregando={carregando} />

        <Link href="/recuperar-senha" style={estilos.esqueci}>
          Esqueci minha senha
        </Link>
      </View>

      <Text style={estilos.rodape}>
        Novo por aqui?{' '}
        <Link href="/cadastro" style={estilos.link}>
          Criar herói
        </Link>
      </Text>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  logo: { alignItems: 'center', marginVertical: espaco.xl },
  logoTexto: {
    fontFamily: fontes.pixel,
    color: cores.laranja,
    fontSize: 24,
    lineHeight: 36,
    textAlign: 'center',
  },
  subtitulo: { color: cores.textoSuave, marginTop: espaco.sm },
  cartao: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: raio.lg,
    padding: espaco.lg,
    gap: espaco.md,
  },
  titulo: { fontFamily: fontes.pixel, color: cores.texto, fontSize: 14 },
  erro: { color: cores.erro },
  esqueci: { color: cores.laranja, fontWeight: '700', textAlign: 'center' },
  rodape: { color: cores.textoSuave, textAlign: 'center', marginTop: espaco.md },
  link: { color: cores.laranja, fontWeight: '700' },
});