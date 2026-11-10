import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Botao } from '../components/Botao';
import { Cabecalho } from '../components/Cabecalho';
import { Campo } from '../components/Campo';
import { Tela } from '../components/Tela';
import { redefinirSenha, solicitarRecuperacao } from '../domain/auth';
import { cores, espaco, fontes, raio } from '../theme';

type Etapa = 'EMAIL' | 'CODIGO' | 'FEITO';

export default function RecuperarSenha() {
  const [etapa, setEtapa] = useState<Etapa>('EMAIL');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [codigoSimulado, setCodigoSimulado] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function pedirCodigo() {
    setErro('');
    setCarregando(true);
    try {
      const r = await solicitarRecuperacao(email);
      setCodigoSimulado(r.codigoSimulado);
      setEtapa('CODIGO'); // a mesma resposta para e-mail cadastrado ou não (RNF09)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  async function trocarSenha() {
    setErro('');
    setCarregando(true);
    try {
      await redefinirSenha(email, codigo, senha, confirmar);
      setEtapa('FEITO');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Tela>
      <Cabecalho titulo="RECUPERAR SENHA" />

      {etapa === 'EMAIL' && (
        <View style={estilos.cartao}>
          <Text style={estilos.texto}>
            Informe o e-mail da sua conta. Enviaremos um código de recuperação válido por 15 minutos.
          </Text>
          <Campo
            rotulo="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="seu@email.com"
          />
          {!!erro && <Text style={estilos.erro}>{erro}</Text>}
          <Botao titulo="ENVIAR CÓDIGO" onPress={pedirCodigo} carregando={carregando} />
        </View>
      )}

      {etapa === 'CODIGO' && (
        <View style={estilos.cartao}>
          <Text style={estilos.texto}>
            Se o e-mail estiver cadastrado, enviamos um código de recuperação. Ele vale por 15
            minutos e só pode ser usado uma vez.
          </Text>

          {__DEV__ && codigoSimulado && (
            <View style={estilos.simulacao}>
              <Text style={estilos.simulacaoTitulo}>SIMULAÇÃO DE E-MAIL</Text>
              <Text style={estilos.texto}>Sem servidor de e-mail, o código aparece aqui:</Text>
              <Text style={estilos.codigo}>{codigoSimulado}</Text>
            </View>
          )}

          <Campo
            rotulo="Código recebido"
            value={codigo}
            onChangeText={setCodigo}
            autoCapitalize="characters"
            placeholder="XXXXXXXX"
          />
          <Campo rotulo="Nova senha" value={senha} onChangeText={setSenha} secureTextEntry />
          <Campo
            rotulo="Confirmar nova senha"
            value={confirmar}
            onChangeText={setConfirmar}
            secureTextEntry
          />
          <Text style={estilos.dica}>
            Mínimo de 8 caracteres, com letra, número e caractere especial.
          </Text>
          {!!erro && <Text style={estilos.erro}>{erro}</Text>}
          <Botao titulo="REDEFINIR SENHA" onPress={trocarSenha} carregando={carregando} />
          <Botao titulo="PEDIR NOVO CÓDIGO" variante="contorno" onPress={() => setEtapa('EMAIL')} />
        </View>
      )}

      {etapa === 'FEITO' && (
        <View style={estilos.cartao}>
          <Text style={estilos.sucesso}>Senha alterada com sucesso!</Text>
          <Text style={estilos.texto}>Agora você já pode entrar com a nova senha.</Text>
          <Botao titulo="IR PARA O LOGIN" onPress={() => router.replace('/login')} />
        </View>
      )}
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
  texto: { color: cores.textoSuave, fontSize: 14 },
  dica: { color: cores.textoSuave, fontSize: 12 },
  erro: { color: cores.erro },
  sucesso: { color: cores.sucesso, fontSize: 16, fontWeight: '700' },
  simulacao: {
    borderWidth: 1,
    borderColor: cores.dourado,
    borderRadius: raio.md,
    padding: espaco.md,
    gap: espaco.xs,
    alignItems: 'center',
  },
  simulacaoTitulo: { fontFamily: fontes.pixel, color: cores.dourado, fontSize: 10 },
  codigo: { fontFamily: fontes.pixel, color: cores.texto, fontSize: 18, letterSpacing: 2 },
});