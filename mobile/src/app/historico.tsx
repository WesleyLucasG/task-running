import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Cabecalho } from '../components/Cabecalho';
import { Atividade, listarAtividades } from '../db/atividades';
import { formatarDistanciaKm, formatarDuracao, formatarPace } from '../domain/geo';
import { useAuth } from '../state/AuthContext';
import { cores, espaco, fontes, raio } from '../theme';

export default function Historico() {
  const { usuario } = useAuth();
  const [itens, setItens] = useState<Atividade[]>([]);

  // Recarrega sempre que a tela volta a ficar visível
  useFocusEffect(
    useCallback(() => {
      if (usuario) listarAtividades(usuario.id).then(setItens);
    }, [usuario]),
  );

  return (
    <SafeAreaView style={estilos.raiz}>
      <Cabecalho titulo="HISTÓRICO" />
      <FlatList
        data={itens}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ gap: espaco.sm, paddingTop: espaco.md }}
        ListEmptyComponent={
          <Text style={estilos.vazio}>Nenhuma atividade ainda. Que tal começar o seu primeiro treino?</Text>
        }
        renderItem={({ item }) => (
          <Pressable style={estilos.cartao} onPress={() => router.push(`/atividade/${item.id}`)}>
            <View style={{ flex: 1, gap: espaco.xs }}>
              <Text style={estilos.data}>
                {new Date(item.dataInicio).toLocaleDateString('pt-BR')} ·{' '}
                {new Date(item.dataInicio).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <Text style={estilos.distancia}>{formatarDistanciaKm(item.distanciaMetros)} km</Text>
              <Text style={estilos.detalhe}>
                {item.tipo} · {formatarDuracao(item.duracaoSegundos)} · {formatarPace(item.paceMedio)}/km
              </Text>
              {!item.sincronizado && <Text style={estilos.pendente}>AGUARDANDO SINCRONIZAÇÃO</Text>}
            </View>
            <Ionicons name="chevron-forward" size={22} color={cores.textoSuave} />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo, padding: espaco.md },
  vazio: { color: cores.textoSuave, textAlign: 'center', marginTop: espaco.xl },
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.md,
    padding: espaco.md,
  },
  data: { color: cores.textoSuave, fontSize: 12 },
  distancia: { fontFamily: fontes.pixel, color: cores.texto, fontSize: 16 },
  detalhe: { color: cores.textoSuave, fontSize: 13 },
  pendente: { color: cores.dourado, fontSize: 10, fontWeight: '700' },
});