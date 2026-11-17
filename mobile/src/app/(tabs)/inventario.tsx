import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Estatistica } from '../../components/Estatistica';
import { Tela } from '../../components/Tela';
import {
  abrirBau,
  alternarEquipado,
  Bau,
  bonusEquipados,
  ItemInventario,
  listarBaus,
  listarInventario,
} from '../../db/inventario';
import { obterJogador } from '../../db/jogo';
import {
  COR_BAU,
  COR_RARIDADE,
  ROTULO_BAU,
  ROTULO_RARIDADE,
  ROTULO_TIPO,
} from '../../domain/loja';
import { useAuth } from '../../state/AuthContext';
import { cores, espaco, fontes, raio } from '../../theme';

export default function Inventario() {
  const { usuario } = useAuth();
  const [baus, setBaus] = useState<Bau[]>([]);
  const [itens, setItens] = useState<ItemInventario[]>([]);
  const [forcaTotal, setForcaTotal] = useState(0);
  const [vidaTotal, setVidaTotal] = useState(0);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    const [b, i, bonus, jogador] = await Promise.all([
      listarBaus(usuario.id),
      listarInventario(usuario.id),
      bonusEquipados(usuario.id),
      obterJogador(usuario.id),
    ]);
    setBaus(b);
    setItens(i);
    setForcaTotal(jogador.avatar.forcaBase + bonus.forca);
    setVidaTotal(jogador.avatar.vidaMaxima + bonus.vida);
  }, [usuario]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  async function abrir(bau: Bau) {
    if (!usuario || ocupado) return;
    setOcupado(bau.id);
    try {
      const item = await abrirBau(usuario.id, bau.id);
      Alert.alert(
        'Você encontrou um item!',
        `${item.nome}\n${ROTULO_RARIDADE[item.raridade]} · ${ROTULO_TIPO[item.tipo]}\n+${item.bonusForca} força · +${item.bonusVida} vida`,
      );
      await carregar();
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Tente novamente.');
    } finally {
      setOcupado(null);
    }
  }

  async function alternar(item: ItemInventario) {
    if (!usuario || ocupado) return;
    setOcupado(item.id);
    try {
      await alternarEquipado(usuario.id, item.id);
      await carregar();
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Tente novamente.');
    } finally {
      setOcupado(null);
    }
  }

  return (
    <Tela>
      <Text style={estilos.titulo}>INVENTÁRIO</Text>

      <View style={estilos.linha}>
        <Estatistica rotulo="FORÇA TOTAL" valor={String(forcaTotal)} />
        <Estatistica rotulo="VIDA TOTAL" valor={String(vidaTotal)} />
      </View>

      <Text style={estilos.subtitulo}>BAÚS</Text>
      {baus.length === 0 ? (
        <Text style={estilos.texto}>Nenhum baú. Bata a meta diária de água para ganhar um Baú Bronze.</Text>
      ) : (
        baus.map((b) => (
          <View key={b.id} style={[estilos.cartao, { borderColor: COR_BAU[b.tipo] }]}>
            <Text style={[estilos.nomeBau, { color: COR_BAU[b.tipo] }]}>{ROTULO_BAU[b.tipo]}</Text>
            <Pressable
              onPress={() => abrir(b)}
              disabled={!!ocupado}
              style={[estilos.botaoPequeno, !!ocupado && { opacity: 0.6 }]}>
              <Text style={estilos.botaoTexto}>ABRIR</Text>
            </Pressable>
          </View>
        ))
      )}

      <Text style={estilos.subtitulo}>ITENS</Text>
      {itens.length === 0 ? (
        <Text style={estilos.texto}>Você ainda não tem itens. Abra um baú!</Text>
      ) : (
        itens.map((i) => (
          <View key={i.id} style={[estilos.cartao, { borderColor: COR_RARIDADE[i.raridade] }]}>
            <View style={{ flex: 1, gap: espaco.xs }}>
              <Text style={estilos.nomeItem}>{i.nome}</Text>
              <Text style={[estilos.detalhe, { color: COR_RARIDADE[i.raridade] }]}>
                {ROTULO_RARIDADE[i.raridade]} · {ROTULO_TIPO[i.tipo]}
              </Text>
              <Text style={estilos.detalhe}>
                +{i.bonusForca} força · +{i.bonusVida} vida
              </Text>
            </View>
            <Pressable
              onPress={() => alternar(i)}
              disabled={!!ocupado}
              style={[
                estilos.botaoPequeno,
                i.equipado && estilos.botaoEquipado,
                !!ocupado && { opacity: 0.6 },
              ]}>
              <Text style={[estilos.botaoTexto, i.equipado && { color: cores.laranja }]}>
                {i.equipado ? 'EQUIPADO' : 'EQUIPAR'}
              </Text>
            </Pressable>
          </View>
        ))
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espaco.md,
    backgroundColor: cores.superficie,
    borderWidth: 2,
    borderRadius: raio.md,
    padding: espaco.md,
  },
  nomeBau: { fontFamily: fontes.pixel, fontSize: 12 },
  nomeItem: { color: cores.texto, fontSize: 16, fontWeight: '700' },
  detalhe: { color: cores.textoSuave, fontSize: 13 },
  botaoPequeno: {
    backgroundColor: cores.laranja,
    borderWidth: 2,
    borderColor: cores.laranja,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: raio.md,
  },
  botaoEquipado: { backgroundColor: 'transparent' },
  botaoTexto: { fontFamily: fontes.pixel, color: cores.texto, fontSize: 10 },
});