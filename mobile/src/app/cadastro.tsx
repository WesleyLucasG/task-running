import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Botao } from '../components/Botao';
import { Campo } from '../components/Campo';
import { Tela } from '../components/Tela';
import { mascararCpf } from '../domain/validacoes';
import { AuthProvider, useAuth } from '../state/AuthContext';
import { cores, espaco, fontes, raio } from '../theme';

export default function Cadastro() {
  const { cadastrar } = useAuth();
  const [form, setForm] = useState({
    nome: '',
    email: '',
    cpf: '',
    peso: '',
    senha: '',
    confirmarSenha: '',
  });
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const mudar = (campo: keyof typeof form) => (valor: string) =>
    setForm((f) => ({ ...f, [campo]: campo === 'cpf' ? mascararCpf(valor) : valor }));

  async function aoCadastrar() {
    setErro('');
    setCarregando(true);
    try {
      await cadastrar(form);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
      setCarregando(false);
    }
  }

  return (
    <Tela>
      <Text style={estilos.titulo}>NOVO HERÓI</Text>

      <View style={estilos.cartao}>
        <Campo rotulo="Nome completo" value={form.nome} onChangeText={mudar('nome')} autoCapitalize="words" />
        <Campo
          rotulo="E-mail"
          value={form.email}
          onChangeText={mudar('email')}
          keyboardType="email-address"
        />
        <Campo
          rotulo="CPF"
          value={form.cpf}
          onChangeText={mudar('cpf')}
          keyboardType="number-pad"
          placeholder="000.000.000-00"
        />
        <Campo
          rotulo="Peso (kg)"
          value={form.peso}
          onChangeText={mudar('peso')}
          keyboardType="decimal-pad"
          placeholder="70"
        />
        <Campo rotulo="Senha" value={form.senha} onChangeText={mudar('senha')} secureTextEntry />
        <Campo
          rotulo="Confirmar senha"
          value={form.confirmarSenha}
          onChangeText={mudar('confirmarSenha')}
          secureTextEntry
        />
        <Text style={estilos.dica}>Mínimo de 8 caracteres, com letra, número e caractere especial.</Text>
        {!!erro && <Text style={estilos.erro}>{erro}</Text>}
        <Botao titulo="CRIAR CONTA" onPress={aoCadastrar} carregando={carregando} />
      </View>

      <Text style={estilos.rodape}>
        Já tem conta?{' '}
        <Link href="/login" style={estilos.link}>
          Entrar
        </Link>
      </Text>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  titulo: { fontFamily: fontes.pixel, color: cores.laranja, fontSize: 18, marginTop: espaco.md },
  cartao: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: raio.lg,
    padding: espaco.lg,
    gap: espaco.md,
  },
  dica: { color: cores.textoSuave, fontSize: 12 },
  erro: { color: cores.erro },
  rodape: { color: cores.textoSuave, textAlign: 'center', marginTop: espaco.md },
  link: { color: cores.laranja, fontWeight: '700' },
});