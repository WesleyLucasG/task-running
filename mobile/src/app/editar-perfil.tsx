import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Botao } from '../components/Botao';
import { Cabecalho } from '../components/Cabecalho';
import { Campo } from '../components/Campo';
import { Tela } from '../components/Tela';
import { calcularMetaAgua } from '../domain/hidratacao';
import { useAuth } from '../state/AuthContext';
import { cores, espaco, raio } from '../theme';

export default function EditarPerfil() {
  const { usuario, atualizarPerfil } = useAuth();
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [peso, setPeso] = useState(String(usuario?.peso ?? ''));
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const pesoNumero = Number(peso.replace(',', '.'));
  const metaNova = pesoNumero >= 20 && pesoNumero <= 300 ? calcularMetaAgua(pesoNumero) : null;

  async function salvar() {
    setErro('');
    setCarregando(true);
    try {
      await atualizarPerfil({ nome, email, peso });
      Alert.alert('Perfil atualizado', 'Seus dados foram salvos.');
      router.back();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Tela>
      <Cabecalho titulo="EDITAR PERFIL" />
      <View style={estilos.cartao}>
        <Campo rotulo="Nome completo" value={nome} onChangeText={setNome} autoCapitalize="words" />
        <Campo
          rotulo="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <Campo
          rotulo="Peso (kg)"
          value={peso}
          onChangeText={setPeso}
          keyboardType="decimal-pad"
        />
        {metaNova !== null && (
          <Text style={estilos.meta}>Meta diária de água com este peso: {metaNova} ml</Text>
        )}
        <Text style={estilos.texto}>O CPF não pode ser alterado.</Text>
        {!!erro && <Text style={estilos.erro}>{erro}</Text>}
        <Botao titulo="SALVAR" onPress={salvar} carregando={carregando} />
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: raio.lg,
    padding: espaco.lg,
    gap: espaco.md,
  },
  texto: { color: cores.textoSuave, fontSize: 13 },
  meta: { color: cores.sucesso, fontSize: 14, fontWeight: '700' },
  erro: { color: cores.erro },
});