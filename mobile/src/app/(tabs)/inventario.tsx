import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BauPixel } from '../../components/BauPixel';
import { CabecalhoJogo } from '../../components/CabecalhoJogo';
import { RevelacaoItem } from '../../components/RevelacaoItem';
import {
  abrirBau,
  alternarEquipado,
  Bau,
  ItemInventario,
  listarBaus,
  listarInventario,
  moverItemDeLocal,
} from '../../db/inventario';
import { COR_RARIDADE, RARIDADES, ROTULO_BAU, ROTULO_RARIDADE, ROTULO_TIPO, TIPOS_ITEM, TipoItem } from '../../domain/loja';
import { useAuth } from '../../state/AuthContext';
import { avisarJogadorAlterado } from '../../state/sinais';
import { cores, espaco, fontes } from '../../theme';

type Aba = 'INVENTARIO' | 'BAU';

const ICONE: Record<TipoItem, keyof typeof Ionicons.glyphMap> = {
  ARMA: 'flame',
  CAPACETE: 'shield',
  ARMADURA: 'shirt',
  BOTAS: 'footsteps',
};

// Ordenação: raridade mais alta primeiro, depois categoria
const ordem = (a: ItemInventario, b: ItemInventario) =>
  RARIDADES.indexOf(b.raridade) - RARIDADES.indexOf(a.raridade) ||
  TIPOS_ITEM.indexOf(a.tipo) - TIPOS_ITEM.indexOf(b.tipo);

// RF24–RF26 (baús de recompensa, inventário, equipar) + baú de armazenamento (D19).
export default function Inventario() {
  const { usuario } = useAuth();
  const [aba, setAba] = useState<Aba>('INVENTARIO');
  const [itens, setItens] = useState<ItemInventario[]>([]);
  const [baus, setBaus] = useState<Bau[]>([]);
  const [abrindo, setAbrindo] = useState<Bau | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    const [i, b] = await Promise.all([listarInventario(usuario.id), listarBaus(usuario.id)]);
    setItens(i);
    setBaus(b);
  }, [usuario]);

  useFocusEffect(
    useCallback(() => {
      carregar().catch(() => {});
    }, [carregar]),
  );

  const naMochila = useMemo(
    () => itens.filter((i) => i.local === 'INVENTARIO').sort((a, b) => Number(b.equipado) - Number(a.equipado) || ordem(a, b)),
    [itens],
  );
  const guardados = useMemo(() => itens.filter((i) => i.local === 'BAU').sort(ordem), [itens]);
  const bonus = naMochila
    .filter((i) => i.equipado)
    .reduce((s, i) => ({ forca: s.forca + i.bonusForca, vida: s.vida + i.bonusVida }), { forca: 0, vida: 0 });

  async function executar(id: string, acao: () => Promise<void>) {
    setOcupado(id);
    try {
      await acao();
      await carregar();
      avisarJogadorAlterado();
    } catch (e) {
      Alert.alert('Inventário', e instanceof Error ? e.message : String(e));
    } finally {
      setOcupado(null);
    }
  }

  const equipar = (i: ItemInventario) => executar(i.id, () => alternarEquipado(usuario!.id, i.id));
  const mover = (i: ItemInventario, destino: 'INVENTARIO' | 'BAU') => {
    if (destino === 'BAU' && i.equipado) {
      Alert.alert('Item equipado', 'Desequipe o item antes de guardá-lo no baú.');
      return;
    }
    executar(i.id, () => moverItemDeLocal(usuario!.id, i.id, destino));
  };

  return (
    <View style={estilos.raiz}>
      <CabecalhoJogo titulo="INVENTÁRIO" />

      <View style={estilos.abas}>
        <Guia rotulo={`INVENTÁRIO (${naMochila.length})`} ativa={aba === 'INVENTARIO'} onPress={() => setAba('INVENTARIO')} />
        <Guia rotulo={`BAÚ (${guardados.length})`} ativa={aba === 'BAU'} onPress={() => setAba('BAU')} />
      </View>

      <ScrollView contentContainerStyle={estilos.conteudo}>
        {aba === 'INVENTARIO' ? (
          <>
            {baus.length > 0 && (
              <View style={{ gap: espaco.sm }}>
                <Text style={estilos.secao}>BAÚS DE RECOMPENSA · TOQUE PARA ABRIR</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: espaco.sm }}>
                  {baus.map((b) => (
                    <Pressable key={b.id} style={estilos.bau} onPress={() => setAbrindo(b)}>
                      <BauPixel tipo={b.tipo} tamanho={44} />
                      <Text style={estilos.bauTexto}>{ROTULO_BAU[b.tipo].replace('Baú ', '').toUpperCase()}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={estilos.resumo}>
              <Text style={estilos.secao}>BÔNUS EQUIPADOS</Text>
              <Text style={estilos.resumoValor}>
                ⚔ +{bonus.forca} força   ❤ +{bonus.vida} vida
              </Text>
            </View>

            {naMochila.length === 0 && (
              <Text style={estilos.vazio}>Nenhum item ainda. Derrote monstros, abra baús ou visite a Loja Mística!</Text>
            )}
            {naMochila.map((i) => (
              <CartaoItem key={i.id} item={i} ocupado={ocupado === i.id}>
                <Acao
                  rotulo={i.equipado ? 'DESEQUIPAR' : 'EQUIPAR'}
                  cor={i.equipado ? cores.borda : cores.laranja}
                  onPress={() => equipar(i)}
                />
                <Acao rotulo="GUARDAR" cor={cores.superficieAlta} inativo={i.equipado} onPress={() => mover(i, 'BAU')} />
              </CartaoItem>
            ))}
          </>
        ) : (
          <>
            <View style={estilos.resumo}>
              <Text style={estilos.secao}>BAÚ DE ARMAZENAMENTO</Text>
              <Text style={estilos.textoInfo}>
                Itens guardados ficam seguros aqui e não contam para os atributos. Retire-os para equipar.
              </Text>
            </View>
            {guardados.length === 0 && <Text style={estilos.vazio}>Seu baú está vazio.</Text>}
            {[...RARIDADES].reverse().map((r) => {
              const grupo = guardados.filter((i) => i.raridade === r);
              if (!grupo.length) return null;
              return (
                <View key={r} style={{ gap: espaco.sm }}>
                  <Text style={[estilos.secao, { color: COR_RARIDADE[r] }]}>
                    {ROTULO_RARIDADE[r].toUpperCase()} · {grupo.length}
                  </Text>
                  {grupo.map((i) => (
                    <CartaoItem key={i.id} item={i} ocupado={ocupado === i.id}>
                      <Acao rotulo="RETIRAR" cor={cores.laranja} onPress={() => mover(i, 'INVENTARIO')} />
                    </CartaoItem>
                  ))}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      <RevelacaoItem
        visivel={!!abrindo}
        bau={abrindo?.tipo}
        abrir={async () => {
          const item = await abrirBau(usuario!.id, abrindo!.id);
          await carregar();
          avisarJogadorAlterado();
          return item;
        }}
        aoFechar={() => setAbrindo(null)}
      />
    </View>
  );
}

function Guia({ rotulo, ativa, onPress }: { rotulo: string; ativa: boolean; onPress: () => void }) {
  return (
    <Pressable style={[estilos.guia, ativa && estilos.guiaAtiva]} onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: ativa }}>
      <Text style={[estilos.guiaTexto, !ativa && { color: cores.textoSuave }]}>{rotulo}</Text>
    </Pressable>
  );
}

function CartaoItem({ item, ocupado, children }: { item: ItemInventario; ocupado: boolean; children: React.ReactNode }) {
  const cor = COR_RARIDADE[item.raridade];
  return (
    <View style={[estilos.cartao, { borderLeftColor: cor }, ocupado && { opacity: 0.5 }]}>
      <View style={[estilos.icone, { borderColor: cor }]}>
        <Ionicons name={ICONE[item.tipo]} size={26} color={cor} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={estilos.linhaNome}>
          <Text style={estilos.nome} numberOfLines={1}>
            {item.nome}
          </Text>
          {item.equipado && <Text style={estilos.equipado}>EM USO</Text>}
        </View>
        <Text style={[estilos.detalhe, { color: cor }]}>
          {ROTULO_RARIDADE[item.raridade]} · <Text style={{ color: cores.textoSuave }}>{ROTULO_TIPO[item.tipo]}</Text>
        </Text>
        <Text style={estilos.detalhe}>
          {item.bonusForca > 0 ? `⚔ +${item.bonusForca}  ` : ''}
          {item.bonusVida > 0 ? `❤ +${item.bonusVida}` : ''}
        </Text>
        <View style={estilos.acoes}>{children}</View>
      </View>
    </View>
  );
}

function Acao({ rotulo, cor, onPress, inativo = false }: { rotulo: string; cor: string; onPress: () => void; inativo?: boolean }) {
  return (
    <Pressable style={[estilos.acao, { backgroundColor: cor }, inativo && { opacity: 0.4 }]} onPress={onPress}>
      <Text style={estilos.acaoTexto}>{rotulo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  abas: {
    flexDirection: 'row',
    paddingHorizontal: espaco.md,
    paddingTop: espaco.md,
    borderBottomWidth: 2,
    borderBottomColor: cores.borda,
  },
  guia: { paddingHorizontal: espaco.md, paddingVertical: 12, borderWidth: 2, borderColor: 'transparent', borderBottomWidth: 0 },
  guiaAtiva: { backgroundColor: cores.laranja, borderColor: cores.laranjaEscuro },
  guiaTexto: { fontFamily: fontes.pixel, fontSize: 10, color: cores.texto },
  conteudo: { padding: espaco.md, gap: espaco.md, paddingBottom: espaco.xl },
  secao: { fontFamily: fontes.mono, color: cores.textoSuave, fontSize: 11, letterSpacing: 2 },
  bau: {
    alignItems: 'center',
    gap: 6,
    padding: espaco.sm,
    width: 84,
    backgroundColor: cores.superficie,
    borderWidth: 2,
    borderColor: cores.borda,
  },
  bauTexto: { fontFamily: fontes.monoNegrito, color: cores.texto, fontSize: 9 },
  resumo: { padding: espaco.md, gap: 6, borderWidth: 1, borderStyle: 'dashed', borderColor: cores.bordaClara },
  resumoValor: { fontFamily: fontes.monoNegrito, color: cores.texto, fontSize: 14 },
  textoInfo: { fontFamily: fontes.texto, color: cores.textoSuave, fontSize: 12, lineHeight: 17 },
  vazio: { fontFamily: fontes.texto, color: cores.textoSuave, fontSize: 14, textAlign: 'center', marginTop: espaco.lg },
  cartao: {
    flexDirection: 'row',
    gap: espaco.md,
    padding: espaco.md,
    backgroundColor: cores.superficie,
    borderWidth: 2,
    borderColor: cores.borda,
    borderLeftWidth: 5,
  },
  icone: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    backgroundColor: cores.fundo,
  },
  linhaNome: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  nome: { flex: 1, fontFamily: fontes.textoNegrito, color: cores.texto, fontSize: 14 },
  equipado: {
    fontFamily: fontes.monoNegrito,
    fontSize: 9,
    color: cores.fundo,
    backgroundColor: cores.sucesso,
    paddingHorizontal: 5,
  },
  detalhe: { fontFamily: fontes.mono, color: cores.textoSuave, fontSize: 11 },
  acoes: { flexDirection: 'row', gap: espaco.sm, marginTop: 6 },
  acao: { paddingHorizontal: 12, paddingVertical: 7, borderBottomWidth: 3, borderBottomColor: '#0006' },
  acaoTexto: { fontFamily: fontes.monoNegrito, color: cores.texto, fontSize: 11 },
});
