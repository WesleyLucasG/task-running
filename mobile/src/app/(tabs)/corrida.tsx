import { Ionicons } from '@expo/vector-icons';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Botao } from '../../components/Botao';
import { Estatistica } from '../../components/Estatistica';
import { MapaOSM } from '../../components/MapaOSM';
import {
  cancelarAtividade,
  iniciarAtividade,
  salvarPonto,
  TipoAtividade,
} from '../../db/atividades';
import { concluirAtividadeComRecompensa } from '../../db/jogo';
import {
  calcularPace,
  coordenadaValida,
  DIST_MIN_M,
  estimarCalorias,
  formatarDistanciaKm,
  formatarDuracao,
  formatarPace,
  haversine,
  LACUNA_MAX_S,
  Ponto,
  PRECISAO_MAX_M,
  velocidadeKmh,
  VELOCIDADE_MAX_KMH,
} from '../../domain/geo';
import { useAuth } from '../../state/AuthContext';
import { cores, espaco, fontes, raio } from '../../theme';

export default function Corrida() {
  const { usuario } = useAuth();

  // Estado que aparece na tela
  const [tipo, setTipo] = useState<TipoAtividade>('CORRIDA');
  const [ativa, setAtiva] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [distancia, setDistancia] = useState(0);
  const [pontosMapa, setPontosMapa] = useState<[number, number][]>([]);
  const [semSinal, setSemSinal] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [debug, setDebug] = useState('');

  // Valores internos que mudam o tempo todo (refs não redesenham a tela)
  const atividadeId = useRef<string | null>(null);
  const inicioMs = useRef(0);
  const distMetros = useRef(0);
  const referencia = useRef<Ponto | null>(null);
  const ultimoFixGps = useRef(0);
  const ultimoSinalLocal = useRef(0);
  const assinatura = useRef<Location.LocationSubscription | null>(null);
  const relogio = useRef<ReturnType<typeof setInterval> | null>(null);

  function pararSensores() {
    assinatura.current?.remove();
    assinatura.current = null;
    if (relogio.current) clearInterval(relogio.current);
    relogio.current = null;
    deactivateKeepAwake('corrida');
  }

  useEffect(() => () => pararSensores(), []);

  function aoReceberLocalizacao(loc: Location.LocationObject) {
    const { latitude, longitude, altitude, accuracy } = loc.coords;
    ultimoSinalLocal.current = Date.now();
    setSemSinal(false);

    if (!coordenadaValida(latitude, longitude)) return; // RN02
    if (accuracy != null && accuracy > PRECISAO_MAX_M) return;

    const novo: Ponto = { latitude, longitude, altitude, timestamp: loc.timestamp };

    // RN03: lacuna grande = perda de sinal; recomeça o trecho sem somar distância
    const houveLacuna =
      ultimoFixGps.current > 0 && (novo.timestamp - ultimoFixGps.current) / 1000 > LACUNA_MAX_S;
    ultimoFixGps.current = novo.timestamp;

    const ref = referencia.current;
    if (ref && !houveLacuna) {
      const dt = (novo.timestamp - ref.timestamp) / 1000;
      if (dt <= 0) return; // ponto fora de ordem
      const d = haversine(ref, novo);
      if (d < DIST_MIN_M) return; // tremedeira do GPS parado
      if (velocidadeKmh(d, dt) > VELOCIDADE_MAX_KMH) return; // RNF12
      distMetros.current += d;
      setDistancia(distMetros.current);
    }

    referencia.current = novo;
    if (atividadeId.current) {
      salvarPonto(atividadeId.current, novo).catch((e) => console.warn('Falha ao salvar ponto', e));
    }
    setPontosMapa((p) => [...p, [latitude, longitude]]);
  }

   async function iniciar() {
    setDebug('1) toque recebido');
    if (!usuario) {
      setDebug('ERRO: usuário nulo');
      return;
    }
    try {
      setDebug('2) pedindo permissão de localização...');
      const permissao = await Location.requestForegroundPermissionsAsync();
      setDebug('3) permissão: ' + permissao.status);
      if (permissao.status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos acessar o GPS para registrar sua atividade.');
        return;
      }

      setDebug('4) verificando se o GPS está ligado...');
      const gpsLigado = await Location.hasServicesEnabledAsync();
      setDebug('5) GPS ligado: ' + gpsLigado);
      if (!gpsLigado) {
        Alert.alert('GPS desligado', 'Ative a localização do aparelho e tente novamente.');
        return;
      }

      setDebug('6) criando atividade no banco...');
      const inicio = new Date();
      atividadeId.current = await iniciarAtividade(usuario.id, tipo, inicio);
      setDebug('7) banco ok, iniciando rastreamento...');

      inicioMs.current = inicio.getTime();
      distMetros.current = 0;
      referencia.current = null;
      ultimoFixGps.current = 0;
      ultimoSinalLocal.current = Date.now();

      setSegundos(0);
      setDistancia(0);
      setPontosMapa([]);
      setSemSinal(false);
      setAtiva(true);

      await activateKeepAwakeAsync('corrida');

      relogio.current = setInterval(() => {
        setSegundos(Math.floor((Date.now() - inicioMs.current) / 1000));
        setSemSinal(Date.now() - ultimoSinalLocal.current > 10000);
      }, 1000);

      assinatura.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 0 },
        aoReceberLocalizacao,
      );
      setDebug('8) rastreando');
    } catch (e) {
      setDebug('ERRO: ' + (e instanceof Error ? e.message : String(e)));
      pararSensores();
      setAtiva(false);
    }
  }

    async function finalizar() {
    const id = atividadeId.current;
    if (!id || !usuario) return;
    setSalvando(true);
    pararSensores();
    try {
      const fim = Date.now();
      const duracao = Math.round((fim - inicioMs.current) / 1000); // RN06
      const dist = distMetros.current;
      await concluirAtividadeComRecompensa(id, usuario.id, {
        dataFim: new Date(fim),
        duracaoSegundos: duracao,
        distanciaMetros: dist,
        calorias: estimarCalorias(usuario.peso, dist, tipo),
        paceMedio: calcularPace(dist, duracao), // RN08 já tratada dentro da função
      });
      atividadeId.current = null;
      setAtiva(false);
      router.push(`/atividade/${id}`);
    } catch (e) {
      Alert.alert('Erro ao salvar', e instanceof Error ? e.message : 'Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  // RF33
  function pedirCancelamento() {
    Alert.alert('Cancelar atividade?', 'Os dados desta atividade não serão contabilizados.', [
      { text: 'Continuar', style: 'cancel' },
      {
        text: 'Cancelar atividade',
        style: 'destructive',
        onPress: async () => {
          const id = atividadeId.current;
          pararSensores();
          if (id) await cancelarAtividade(id);
          atividadeId.current = null;
          setAtiva(false);
          setSegundos(0);
          setDistancia(0);
          setPontosMapa([]);
        },
      },
    ]);
  }

  const pace = calcularPace(distancia, segundos);
  const kcal = estimarCalorias(usuario?.peso ?? 0, distancia, tipo);

   return (
    <SafeAreaView style={estilos.raiz} edges={['top', 'left', 'right']}>
      <View style={estilos.topo}>
        <Text style={estilos.titulo}>CORRIDA</Text>
        <Pressable onPress={() => router.push('/historico')} hitSlop={12}>
          <Ionicons name="time-outline" size={28} color={cores.laranja} />
        </Pressable>
      </View>
      
      {!!debug && <Text style={{ color: cores.dourado, fontSize: 12 }}>{debug}</Text>}

      {!ativa && (
        <View style={estilos.seletor}>
          {(['CORRIDA', 'CAMINHADA'] as TipoAtividade[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTipo(t)}
              style={[estilos.opcao, tipo === t && estilos.opcaoAtiva]}>
              <Text style={[estilos.opcaoTexto, tipo === t && { color: cores.texto }]}>{t}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={estilos.painel}>
        <Text style={estilos.distancia}>
          {formatarDistanciaKm(distancia)}
          <Text style={estilos.unidade}> km</Text>
        </Text>
        <View style={estilos.linha}>
          <Estatistica rotulo="TEMPO" valor={formatarDuracao(segundos)} />
          <Estatistica rotulo="PACE /km" valor={formatarPace(pace)} />
          <Estatistica rotulo="KCAL" valor={String(kcal)} />
        </View>
      </View>

      {ativa && semSinal && (
        <View style={estilos.aviso}>
          <Ionicons name="warning" size={18} color={cores.dourado} />
          <Text style={estilos.avisoTexto}>
            Sem sinal de GPS. Sua atividade continua e a distância volta a contar quando o sinal retornar.
          </Text>
        </View>
      )}

      <MapaOSM pontos={pontosMapa} seguir style={estilos.mapa} />

      <View style={estilos.acoes}>
        {!ativa ? (
          <Botao titulo="INICIAR" onPress={iniciar} />
        ) : (
          <>
            <Botao titulo="FINALIZAR" onPress={finalizar} carregando={salvando} />
            <Botao titulo="CANCELAR" variante="contorno" onPress={pedirCancelamento} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}


const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo, padding: espaco.md, gap: espaco.md },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titulo: { fontFamily: fontes.pixel, color: cores.laranja, fontSize: 16 },
  seletor: {
    flexDirection: 'row',
    backgroundColor: cores.superficie,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: 4,
  },
  opcao: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: raio.sm },
  opcaoAtiva: { backgroundColor: cores.laranja },
  opcaoTexto: { fontFamily: fontes.pixel, fontSize: 10, color: cores.textoSuave },
  painel: { gap: espaco.md },
  distancia: { fontFamily: fontes.pixel, color: cores.texto, fontSize: 40, textAlign: 'center' },
  unidade: { fontSize: 14, color: cores.textoSuave },
  linha: { flexDirection: 'row', gap: espaco.sm },
  aviso: {
    flexDirection: 'row',
    gap: espaco.sm,
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.dourado,
    borderRadius: raio.md,
    padding: espaco.sm,
  },
  avisoTexto: { color: cores.dourado, fontSize: 12, flex: 1 },
  mapa: { flex: 1 },
  acoes: { gap: espaco.sm },
});