import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Botao } from '../../components/Botao';
import { Cabecalho } from '../../components/Cabecalho';
import { Estatistica } from '../../components/Estatistica';
import { MapaOSM } from '../../components/MapaOSM';
import { Atividade, buscarAtividade, excluirAtividade, listarPontos } from '../../db/atividades';
import { buscarRecompensa, ResultadoRecompensa } from '../../db/jogo';
import { formatarDistanciaKm, formatarDuracao, formatarPace } from '../../domain/geo';
import { useAuth } from '../../state/AuthContext';
import { cores, espaco, fontes, raio } from '../../theme';

export default function DetalheAtividade() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario } = useAuth();
  const [atividade, setAtividade] = useState<Atividade | null>(null);
  const [rota, setRota] = useState<[number, number][]>([]);
  const [recompensa, setRecompensa] = useState<ResultadoRecompensa | null>(null);

  useEffect(() => {
    if (!id || !usuario) return;
    buscarAtividade(id, usuario.id).then(setAtividade); // RN07: só dados do próprio usuário
    listarPontos(id).then((p) => setRota(p.map((x) => [x.latitude, x.longitude])));
    buscarRecompensa(id).then(setRecompensa);
  }, [id, usuario]);

  function confirmarExclusao() {
    Alert.alert('Excluir atividade?', 'Essa ação não pode ser desfeita.', [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          if (id && usuario) await excluirAtividade(id, usuario.id);
          router.back();
        },
      },
    ]);
  }

  if (!atividade) {
    return (
      <SafeAreaView style={estilos.raiz}>
        <Cabecalho titulo="ATIVIDADE" />
        <Text style={estilos.texto}>Atividade não encontrada.</Text>
      </SafeAreaView>
    );
  }

  const subiuNivel = recompensa ? recompensa.nivelDepois > recompensa.nivelAntes : false;

  return (
    <SafeAreaView style={estilos.raiz}>
      <Cabecalho titulo="ATIVIDADE" />
      <Text style={estilos.texto}>
        {atividade.tipo} · {new Date(atividade.dataInicio).toLocaleDateString('pt-BR')}
      </Text>
      <Text style={estilos.distancia}>
        {formatarDistanciaKm(atividade.distanciaMetros)}
        <Text style={estilos.unidade}> km</Text>
      </Text>
      <View style={estilos.linha}>
        <Estatistica rotulo="TEMPO" valor={formatarDuracao(atividade.duracaoSegundos)} />
        <Estatistica rotulo="PACE /km" valor={formatarPace(atividade.paceMedio)} />
        <Estatistica rotulo="KCAL" valor={String(atividade.calorias)} />
      </View>

      {recompensa && (
        <View style={estilos.recompensa}>
          <Text style={estilos.recompensaTitulo}>RECOMPENSAS</Text>
          <Text style={estilos.recompensaValor}>
            +{recompensa.xp} XP · +{recompensa.moedas} MOEDAS
          </Text>
          {recompensa.multiplicador > 1 && (
            <Text style={estilos.texto}>
              Bônus de agilidade: +{((recompensa.multiplicador - 1) * 100).toFixed(1)}%
            </Text>
          )}
          {subiuNivel && (
            <Text style={estilos.nivel}>
              NÍVEL {recompensa.nivelAntes} → {recompensa.nivelDepois}!
            </Text>
          )}
        </View>
      )}

      {rota.length === 0 ? (
        <Text style={estilos.texto}>Esta atividade não tem pontos de GPS para mostrar no mapa.</Text>
      ) : (
        <MapaOSM pontos={rota} style={{ flex: 1 }} />
      )}
      <Botao titulo="EXCLUIR ATIVIDADE" variante="contorno" onPress={confirmarExclusao} />
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo, padding: espaco.md, gap: espaco.md },
  texto: { color: cores.textoSuave, fontSize: 14 },
  distancia: { fontFamily: fontes.pixel, color: cores.texto, fontSize: 36, textAlign: 'center' },
  unidade: { fontSize: 14, color: cores.textoSuave },
  linha: { flexDirection: 'row', gap: espaco.sm },
  recompensa: {
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.dourado,
    borderRadius: raio.md,
    padding: espaco.md,
    alignItems: 'center',
    gap: espaco.xs,
  },
  recompensaTitulo: { fontFamily: fontes.pixel, color: cores.dourado, fontSize: 12 },
  recompensaValor: { fontFamily: fontes.pixel, color: cores.texto, fontSize: 14 },
  nivel: { fontFamily: fontes.pixel, color: cores.sucesso, fontSize: 14, marginTop: espaco.xs },
});