import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Botao } from '../components/Botao';
import { CabecalhoJogo } from '../components/CabecalhoJogo';
import { Hermes } from '../components/Hermes';
import { garantirPermissao } from '../services/lembretes';
import { cores, espaco, fontes } from '../theme';

type Estado = 'pendente' | 'concedida' | 'negada';

// Figma "Permissões" (3:678). RNF14: permissão explícita para o GPS.
// RF10: notificações para os lembretes de água.
export default function Permissoes() {
  const [gps, setGps] = useState<Estado>('pendente');
  const [avisos, setAvisos] = useState<Estado>('pendente');

  useEffect(() => {
    Location.getForegroundPermissionsAsync().then((p) => p.granted && setGps('concedida'));
  }, []);

  async function habilitarGps() {
    const p = await Location.requestForegroundPermissionsAsync();
    setGps(p.granted ? 'concedida' : 'negada');
    if (!p.granted && !p.canAskAgain) Linking.openSettings();
  }

  async function habilitarAvisos() {
    setAvisos((await garantirPermissao()) ? 'concedida' : 'negada');
  }

  const fala =
    gps === 'concedida'
      ? 'Excelente! Com o GPS ativo, cada passo seu vira poder no reino.'
      : 'Para rastrear sua jornada e enviar recompensas divinas, preciso que você habilite estes poderes!';

  return (
    <View style={estilos.raiz}>
      <CabecalhoJogo titulo="QUEST: PERMISSÕES" />
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <Hermes pose="falando" mensagem={fala} />

        <View style={estilos.cartao}>
          <View style={estilos.ilustracao}>
            <Image source={require('../../assets/hermes/bussola.png')} style={estilos.bussola} resizeMode="contain" />
          </View>
          <View style={estilos.corpo}>
            <View style={estilos.linhaTitulo}>
              <Ionicons name="location-outline" size={20} color={cores.laranja} />
              <Text style={estilos.titulo}>LOCALIZAÇÃO GPS</Text>
            </View>
            <Text style={estilos.texto}>Necessário para converter seus passos reais em progresso no mapa RPG.</Text>
            <Botao
              titulo={rotulo(gps, 'HABILITAR GPS', 'GPS HABILITADO')}
              iconeEsquerda={gps === 'concedida' ? 'checkmark' : undefined}
              desabilitado={gps === 'concedida'}
              onPress={habilitarGps}
            />
          </View>
        </View>

        <View style={[estilos.cartao, estilos.cartaoAvisos]}>
          <View style={estilos.corpo}>
            <View style={estilos.linhaTitulo}>
              <Ionicons name="notifications-outline" size={20} color={cores.dourado} />
              <Text style={estilos.titulo}>NOTIFICAÇÕES</Text>
            </View>
            <Text style={estilos.texto}>Lembretes de hidratação e avisos de novos baús.</Text>
            <Botao
              titulo={rotulo(avisos, 'HABILITAR AVISOS', 'AVISOS HABILITADOS')}
              variante="dourado"
              iconeEsquerda={avisos === 'concedida' ? 'checkmark' : undefined}
              desabilitado={avisos === 'concedida'}
              onPress={habilitarAvisos}
            />
          </View>
        </View>

        {gps === 'negada' && (
          <Text style={estilos.aviso}>
            Sem o GPS você ainda pode explorar o app, mas só poderá registrar corridas depois de permitir a
            localização.
          </Text>
        )}
      </ScrollView>

      <View style={estilos.rodape}>
        <Botao
          titulo="INICIAR AVENTURA"
          iconeDireita="chevron-forward"
          desabilitado={gps === 'pendente'}
          onPress={() => router.replace('/criar-personagem')}
        />
      </View>
    </View>
  );
}

function rotulo(e: Estado, pedir: string, ok: string) {
  if (e === 'concedida') return ok;
  if (e === 'negada') return 'TENTAR NOVAMENTE';
  return pedir;
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.md, gap: espaco.xl, paddingTop: espaco.xl },
  cartao: {
    flexDirection: 'row',
    backgroundColor: cores.superficie,
    borderWidth: 2,
    borderColor: cores.borda,
  },
  cartaoAvisos: { marginLeft: espaco.md },
  ilustracao: {
    width: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 2,
    borderRightColor: cores.borda,
  },
  bussola: { width: 76, height: 76 },
  corpo: { flex: 1, padding: espaco.md, gap: espaco.sm },
  linhaTitulo: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  titulo: { fontFamily: fontes.textoNegrito, color: cores.texto, fontSize: 16 },
  texto: { fontFamily: fontes.texto, color: cores.textoSuave, fontSize: 13, lineHeight: 19 },
  aviso: { fontFamily: fontes.texto, color: cores.dourado, fontSize: 12, textAlign: 'center' },
  rodape: { padding: espaco.md, borderTopWidth: 3, borderTopColor: cores.borda },
});
