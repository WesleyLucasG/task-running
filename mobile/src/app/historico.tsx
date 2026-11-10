import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Botao } from '../components/Botao';
import { Cabecalho } from '../components/Cabecalho';
import { Atividade, listarAtividades } from '../db/atividades';
import { formatarDistanciaKm, formatarDuracao, formatarPace } from '../domain/geo';
import { sincronizarPendentes } from '../services/sincronizacao';
import { useAuth } from '../state/AuthContext';
import { cores, espaco, fontes, raio } from '../theme';

export default function Historico() {
  const { usuario } = useAuth();
  const [itens, setItens] = useState<Atividade[]>([]);
  const [mensagem, setMensagem] = useState('');
  const [sincronizando, setSincronizando] = useState(false);

  const carregar = useCallback(async () => {
    if (usuario) setItens(await listarAtividades(usuario.id));
  }, [usuario]);

  // Recarrega sempre que a tela volta a ficar visível
  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  async function sincronizar() {
    if (!usuario) return;
    setSincronizando(true);
    setMensagem('');
    try {
      const rede = await NetInfo.fetch();
      if (!rede.isConnected || rede.isInternetReachable === false) {
        setMensagem('Sem conexão. Seus dados continuam salvos no aparelho e serão enviados quando a internet voltar.');
        return;
      }
      const r = await sincronizarPendentes(usuario.id);
      const total = r.enviadas + r.jaProcessadas;
      if (total === 0 && r.falhas === 0) setMensagem('Nada pendente para sincronizar.');
      else
        setMensagem(
          `${total} atividade(s) sincronizada(s)` +
            (r.falhas ? `; ${r.falhas} falharam e seguem pendentes.` : '.'),
        );
      await carregar();
    } finally {
      setSincronizando(false);
    }
  }

  const pendentes = itens.filter((i) => !i.sincronizado).length;

  return (
    <SafeAreaView style={estilos.raiz}>
      <Cabecalho titulo="HISTÓRICO" />

      <View style={{ gap: espaco.sm, marginTop: espaco.md }}>
        <Botao
          titulo={pendentes > 0 ? `SINCRONIZAR (${pendentes})` : 'SINCRONIZAR'}
          variante="contorno"
          onPress={sincronizar}
          carregando={sincronizando}
        />
        {!!mensagem && <Text style={estilos.mensagem}>{mensagem}</Text>}
      </View>

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
              <Text style={item.sincronizado ? estilos.sincronizada : estilos.pendente}>
                {item.sincronizado ? 'SINCRONIZADA' : 'AGUARDANDO SINCRONIZAÇÃO'}
              </Text>
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
  mensagem: { color: cores.dourado, fontSize: 13 },
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
  sincronizada: { color: cores.sucesso, fontSize: 10, fontWeight: '700' },
});