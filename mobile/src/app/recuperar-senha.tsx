import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollViewInstance, StyleSheet, Text, View } from 'react-native';
import { Botao } from '../components/Botao';
import { Cabecalho } from '../components/Cabecalho';
import { Campo } from '../components/Campo';
import { RequisitosSenha } from '../components/RequisitosSenha';
import { Tela } from '../components/Tela';
import { redefinirSenha, solicitarRecuperacao, validarCodigoRecuperacao } from '../domain/auth';
import { validarSenha } from '../domain/validacoes';
import { cores, espaco, fontes, raio } from '../theme';

// UC03 em etapas: e-mail → código de 6 dígitos (validado no servidor) → nova senha → concluído
type Etapa = 'EMAIL' | 'CODIGO' | 'SENHA' | 'FEITO';

export default function RecuperarSenha() {
  const [etapa, setEtapa] = useState<Etapa>('EMAIL');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [codigoSimulado, setCodigoSimulado] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const rolagem = useRef<ScrollViewInstance>(null);
  const posicaoCartao = useRef(0);
  const posicaoSenha = useRef(0); // relativa ao cartão

  const codigoCompleto = /^\d{6}$/.test(codigo);
  // RF08: o botão só é liberado com senha válida e confirmada (o Backend valida de novo)
  const senhaOk = validarSenha(senha) === null;
  const confirmacaoOk = confirmar.length > 0 && confirmar === senha;

  // Android: ao focar a senha, sobe a tela para os requisitos não ficarem atrás do teclado
  const mostrarRequisitos = () =>
    setTimeout(
      () => rolagem.current?.scrollTo({ y: Math.max(0, posicaoCartao.current + posicaoSenha.current), animated: true }),
      250,
    );

  async function executar(acao: () => Promise<void>) {
    setErro('');
    setCarregando(true);
    try {
      await acao();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  const pedirCodigo = () =>
    executar(async () => {
      const r = await solicitarRecuperacao(email);
      setCodigoSimulado(r.codigoSimulado);
      setCodigo('');
      setEtapa('CODIGO'); // a mesma resposta para e-mail cadastrado ou não (RNF09)
    });

  const conferirCodigo = () =>
    executar(async () => {
      await validarCodigoRecuperacao(email, codigo);
      setEtapa('SENHA');
    });

  const trocarSenha = () =>
    executar(async () => {
      await redefinirSenha(email, codigo, senha, confirmar);
      setEtapa('FEITO');
    });

  return (
    <Tela rolagemRef={rolagem}>
      <Cabecalho titulo="RECUPERAR SENHA" />

      {etapa === 'EMAIL' && (
        <View style={estilos.cartao}>
          <Text style={estilos.passo}>PASSO 1 DE 3</Text>
          <Text style={estilos.texto}>
            Informe o e-mail da sua conta. Enviaremos um código de 6 dígitos válido por 15 minutos.
          </Text>
          <Campo
            rotulo="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            placeholder="seu@email.com"
          />
          {!!erro && <Text style={estilos.erro}>{erro}</Text>}
          <Botao titulo="ENVIAR CÓDIGO" onPress={pedirCodigo} carregando={carregando} />
        </View>
      )}

      {etapa === 'CODIGO' && (
        <View style={estilos.cartao}>
          <Text style={estilos.passo}>PASSO 2 DE 3</Text>
          <Text style={estilos.texto}>
            Se o e-mail estiver cadastrado, enviamos um código de 6 dígitos para {email.trim()}. Ele vale
            por 15 minutos e só pode ser usado uma vez. Verifique também a caixa de spam.
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
            onChangeText={(v) => setCodigo(v.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            placeholder="000000"
            style={estilos.campoCodigo}
          />
          {!!erro && <Text style={estilos.erro}>{erro}</Text>}
          <Botao
            titulo="VALIDAR CÓDIGO"
            onPress={conferirCodigo}
            carregando={carregando}
            desabilitado={!codigoCompleto}
          />
          <Botao titulo="PEDIR NOVO CÓDIGO" variante="contorno" onPress={() => setEtapa('EMAIL')} />
        </View>
      )}

      {etapa === 'SENHA' && (
        <View style={estilos.cartao} onLayout={(e) => (posicaoCartao.current = e.nativeEvent.layout.y)}>
          <Text style={estilos.passo}>PASSO 3 DE 3</Text>
          <Text style={estilos.sucesso}>Código confirmado!</Text>
          <Text style={estilos.texto}>Agora crie sua nova senha.</Text>
          <View style={{ gap: espaco.md }} onLayout={(e) => (posicaoSenha.current = e.nativeEvent.layout.y)}>
            <Campo
              rotulo="Nova senha"
              value={senha}
              onChangeText={setSenha}
              onFocus={mostrarRequisitos}
              senha
              autoComplete="new-password"
            />
            <Campo
              rotulo="Confirmar nova senha"
              value={confirmar}
              onChangeText={setConfirmar}
              onFocus={mostrarRequisitos}
              senha
              autoComplete="new-password"
            />
            <RequisitosSenha senha={senha} confirmacao={confirmar} />
          </View>
          {!!erro && <Text style={estilos.erro}>{erro}</Text>}
          <Botao
            titulo="REDEFINIR SENHA"
            onPress={trocarSenha}
            carregando={carregando}
            desabilitado={!senhaOk || !confirmacaoOk}
          />
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
  passo: { fontFamily: fontes.mono, color: cores.laranja, fontSize: 11, letterSpacing: 1.5 },
  texto: { color: cores.textoSuave, fontSize: 14 },
  erro: { color: cores.erro },
  sucesso: { color: cores.sucesso, fontSize: 16, fontWeight: '700' },
  campoCodigo: { fontFamily: fontes.mono, fontSize: 24, letterSpacing: 8, textAlign: 'center' },
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
