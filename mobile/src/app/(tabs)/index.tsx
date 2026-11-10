import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { BarraProgresso } from '../../components/BarraProgresso';
import { Botao } from '../../components/Botao';
import { Hermes } from '../../components/Hermes';
import { Tela } from '../../components/Tela';
import { iniciarAtividade } from '../../db/atividades';
import { atacarChefe, EstadoMapa, obterEstadoMapa, Situacao } from '../../db/fases';
import { concluirAtividadeComRecompensa } from '../../db/jogo';
import { calcularPace, estimarCalorias } from '../../domain/geo';
import { useAuth } from '../../state/AuthContext';
import { cores, espaco, fontes, raio } from '../../theme';

const ICONE: Record<Situacao, keyof typeof Ionicons.glyphMap> = {
  CONCLUIDA: 'checkmark-circle',
  ATUAL: 'location',
  BLOQUEADA: 'lock-closed',
};
const COR: Record<Situacao, string> = {
  CONCLUIDA: cores.sucesso,
  ATUAL: cores.laranja,
  BLOQUEADA: cores.textoSuave,
};

const km = (metros: number) => (metros / 1000).toFixed(2);

function mensagemHermes(e: EstadoMapa | null): string {
  if (!e) return 'Carregando o mapa...';
  if (e.jogoConcluido || !e.atual) {
    return 'Você conquistou todas as terras disponíveis! Novas aventuras chegam em breve.';
  }
  const a = e.atual;
  if (!a.chefeLiberado) {
    const faltam = Math.max(0, a.fase.metaDistanciaMetros - a.acumuladaMetros);
    return `Faltam ${km(faltam)} km para liberar ${a.fase.chefe.nome}. Corra ou caminhe, herói!`;
  }
  if (a.podeAtacar) {
    return `${a.fase.chefe.nome} está liberado! Seu golpe causará cerca de ${a.danoEstimado} de dano.`;
  }
  return a.motivoBloqueio ?? '';
}

export default function Mapa() {
  const { usuario } = useAuth();
  const [estado, setEstado] = useState<EstadoMapa | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const tremor = useRef(new Animated.Value(0)).current;

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setEstado(await obterEstadoMapa(usuario.id));
  }, [usuario]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  function tremer() {
    const passo = (valor: number) =>
      Animated.timing(tremor, { toValue: valor, duration: 50, useNativeDriver: true });
    Animated.sequence([passo(10), passo(-10), passo(6), passo(0)]).start();
  }

  async function atacar() {
    if (!usuario || ocupado) return;
    setOcupado(true);
    try {
      const r = await atacarChefe(usuario.id);
      tremer();
      if (r.derrotado) {
        Alert.alert(
          'Chefe derrotado!',
          `Você causou ${r.dano} de dano e venceu a fase.\nUm Baú Ouro foi para o seu inventário.\n` +
            (r.proximaFase
              ? `Nova fase liberada: ${r.proximaFase}.`
              : 'Você concluiu todas as fases do MVP!'),
        );
      } else {
        Alert.alert(
          'Golpe certeiro!',
          `Você causou ${r.dano} de dano.\nVida do chefe: ${r.vidaRestante}/${r.vidaMaxima}.`,
        );
      }
      await carregar();
    } catch (e) {
      Alert.alert('Não foi possível atacar', e instanceof Error ? e.message : 'Tente novamente.');
    } finally {
      setOcupado(false);
    }
  }

  // MODO DEMONSTRAÇÃO: usa o mesmo caminho das atividades reais
  async function simular(metros: number) {
    if (!usuario || ocupado) return;
    setOcupado(true);
    try {
      const duracao = Math.round(metros / 2.5);
      const fim = new Date();
      const inicio = new Date(fim.getTime() - duracao * 1000);
      const id = await iniciarAtividade(usuario.id, 'CAMINHADA', inicio);
      await concluirAtividadeComRecompensa(id, usuario.id, {
        dataFim: fim,
        duracaoSegundos: duracao,
        distanciaMetros: metros,
        calorias: estimarCalorias(usuario.peso, metros, 'CAMINHADA'),
        paceMedio: calcularPace(metros, duracao),
      });
      await carregar();
    } catch (e) {
      Alert.alert('Erro na demonstração', e instanceof Error ? e.message : String(e));
    } finally {
      setOcupado(false);
    }
  }

  const atual = estado?.atual ?? null;

  return (
    <Tela>
      <Text style={estilos.titulo}>MAPA</Text>
      <Hermes mensagem={mensagemHermes(estado)} />

      {atual && (
        <View style={estilos.cartao}>
          <Text style={estilos.fase}>
            FASE {atual.fase.numero} · {atual.fase.nome.toUpperCase()}
          </Text>
          <Text style={estilos.texto}>{atual.fase.descricao}</Text>
          <BarraProgresso progresso={atual.acumuladaMetros / atual.fase.metaDistanciaMetros} />
          <Text style={estilos.texto}>
            {km(atual.acumuladaMetros)} / {km(atual.fase.metaDistanciaMetros)} km
          </Text>
        </View>
      )}

      <Text style={estilos.subtitulo}>TRILHA</Text>
      {estado?.fases.map(({ fase, situacao }) => (
        <View key={fase.numero} style={estilos.itemTrilha}>
          <Ionicons name={ICONE[situacao]} size={24} color={COR[situacao]} />
          <View style={{ flex: 1 }}>
            <Text style={[estilos.nomeFase, { color: COR[situacao] }]}>
              {fase.numero}. {fase.nome}
            </Text>
            <Text style={estilos.texto}>
              Meta {km(fase.metaDistanciaMetros)} km · Chefe: {fase.chefe.nome}
            </Text>
          </View>
        </View>
      ))}

      {atual && atual.chefeLiberado && (
        <>
          <Text style={estilos.subtitulo}>SALA DO CHEFE</Text>
          <View style={[estilos.cartao, { borderColor: cores.erro, alignItems: 'center' }]}>
            <Animated.Text style={[estilos.emoji, { transform: [{ translateX: tremor }] }]}>
              {atual.fase.chefe.emoji}
            </Animated.Text>
            <Text style={estilos.nomeChefe}>{atual.fase.chefe.nome.toUpperCase()}</Text>
            <View style={{ alignSelf: 'stretch', gap: espaco.xs }}>
              <BarraProgresso
                progresso={atual.vidaAtualChefe / atual.fase.chefe.vidaMaxima}
                cor={cores.erro}
              />
              <Text style={estilos.texto}>
                Vida: {atual.vidaAtualChefe} / {atual.fase.chefe.vidaMaxima}
              </Text>
            </View>
            <Text style={estilos.texto}>Dano estimado do seu próximo golpe: {atual.danoEstimado}</Text>
            <Pressable
              onPress={atacar}
              disabled={!atual.podeAtacar || ocupado}
              style={[estilos.atacar, (!atual.podeAtacar || ocupado) && { opacity: 0.4 }]}>
              <Text style={estilos.atacarTexto}>ATACAR</Text>
            </Pressable>
            {!!atual.motivoBloqueio && <Text style={estilos.motivo}>{atual.motivoBloqueio}</Text>}
          </View>
        </>
      )}

      {__DEV__ && (
        <>
          <Text style={estilos.subtitulo}>MODO DEMONSTRAÇÃO (ATIVIDADE SIMULADA)</Text>
          <View style={estilos.linha}>
            <View style={{ flex: 1 }}>
              <Botao titulo="+1 KM" variante="contorno" onPress={() => simular(1000)} />
            </View>
            <View style={{ flex: 1 }}>
              <Botao titulo="+3 KM" variante="contorno" onPress={() => simular(3000)} />
            </View>
          </View>
        </>
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  titulo: { fontFamily: fontes.pixel, color: cores.laranja, fontSize: 16, marginTop: espaco.md },
  subtitulo: { fontFamily: fontes.pixel, color: cores.texto, fontSize: 12, marginTop: espaco.md },
  texto: { color: cores.textoSuave, fontSize: 14 },
  linha: { flexDirection: 'row', gap: espaco.sm },
  cartao: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: raio.lg,
    padding: espaco.lg,
    gap: espaco.sm,
  },
  fase: { fontFamily: fontes.pixel, color: cores.dourado, fontSize: 12, lineHeight: 18 },
  itemTrilha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.md,
    padding: espaco.md,
  },
  nomeFase: { fontSize: 15, fontWeight: '700' },
  emoji: { fontSize: 72 },
  nomeChefe: { fontFamily: fontes.pixel, color: cores.erro, fontSize: 13 },
  atacar: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: cores.erro,
    paddingVertical: espaco.md,
    borderRadius: raio.md,
    marginTop: espaco.sm,
  },
  atacarTexto: { fontFamily: fontes.pixel, color: cores.texto, fontSize: 12 },
  motivo: { color: cores.dourado, fontSize: 13, textAlign: 'center' },
});