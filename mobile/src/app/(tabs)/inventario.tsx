import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AvatarPixel } from '../../components/AvatarPixel';
import { BauPixel } from '../../components/BauPixel';
import { Botao } from '../../components/Botao';
import { CabecalhoJogo } from '../../components/CabecalhoJogo';
import { RevelacaoItem } from '../../components/RevelacaoItem';
import {
  abrirBau,
  alternarEquipado,
  Bau,
  descartarItemDaMochila,
  ItemInventario,
  listarBaus,
  listarInventario,
  moverItemDeLocal,
} from '../../db/inventario';
import { COR_RARIDADE, RARIDADES, ROTULO_BAU, ROTULO_RARIDADE, ROTULO_TIPO, TIPOS_ITEM, TipoItem } from '../../domain/loja';
import { valorDescarte } from '../../domain/recompensas';
import { apiConfigurada } from '../../services/api';
import { avisarJogadorAlterado } from '../../state/sinais';
import { useJogador } from '../../state/useJogador';
import { cores, espaco, fontes } from '../../theme';

type Aba = 'INVENTARIO' | 'BAU';
type Origem = 'EQUIPADO' | 'MOCHILA' | 'BAU';

const COLUNAS = 4;
const SLOTS_MINIMOS = 16;

const ICONE: Record<TipoItem, keyof typeof Ionicons.glyphMap> = {
  ARMA: 'flame',
  CAPACETE: 'shield',
  ARMADURA: 'shirt',
  BOTAS: 'footsteps',
};

// Raridade mais alta primeiro, depois categoria
const ordem = (a: ItemInventario, b: ItemInventario) =>
  RARIDADES.indexOf(b.raridade) - RARIDADES.indexOf(a.raridade) ||
  TIPOS_ITEM.indexOf(a.tipo) - TIPOS_ITEM.indexOf(b.tipo);

// RF24–RF26 + baú de armazenamento (D19) + slots, silhueta e descarte (D21).
export default function Inventario() {
  const { usuario, avatar } = useJogador();
  const uid = usuario?.id ?? '';
  const [aba, setAba] = useState<Aba>('INVENTARIO');
  const [itens, setItens] = useState<ItemInventario[]>([]);
  const [baus, setBaus] = useState<Bau[]>([]);
  const [abrindo, setAbrindo] = useState<Bau | null>(null);
  const [selecionado, setSelecionado] = useState<{ item: ItemInventario; origem: Origem } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [larguraGrade, setLarguraGrade] = useState(340);

  const carregar = useCallback(async () => {
    if (!uid) return;
    const [i, b] = await Promise.all([listarInventario(uid), listarBaus(uid)]);
    setItens(i);
    setBaus(b);
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      carregar().catch(() => {});
    }, [carregar]),
  );

  const equipados = useMemo(() => itens.filter((i) => i.equipado), [itens]);
  const mochila = useMemo(() => itens.filter((i) => i.local === 'INVENTARIO' && !i.equipado).sort(ordem), [itens]);
  const guardados = useMemo(() => itens.filter((i) => i.local === 'BAU').sort(ordem), [itens]);
  const bonus = equipados.reduce((s, i) => ({ forca: s.forca + i.bonusForca, vida: s.vida + i.bonusVida }), {
    forca: 0,
    vida: 0,
  });
  const slotTamanho = Math.floor((larguraGrade - espaco.sm * (COLUNAS - 1)) / COLUNAS);

  async function executar(acao: () => Promise<unknown>) {
    setOcupado(true);
    try {
      await acao();
      setSelecionado(null);
      await carregar();
      avisarJogadorAlterado();
    } catch (e) {
      Alert.alert('Inventário', e instanceof Error ? e.message : String(e));
    } finally {
      setOcupado(false);
    }
  }

  function descartar(i: ItemInventario) {
    const valor = valorDescarte(i.raridade);
    Alert.alert('Descartar item', `Descartar ${i.nome} por ${valor} moedas? Esta ação não pode ser desfeita.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: `Descartar (+${valor})`,
        style: 'destructive',
        onPress: () => executar(() => descartarItemDaMochila(uid, i.id)),
      },
    ]);
  }

  const slotEquipado = (tipo: TipoItem) => {
    const item = equipados.find((i) => i.tipo === tipo);
    return (
      <SlotItem
        item={item}
        tamanho={62}
        vazioIcone={ICONE[tipo]}
        rotulo={ROTULO_TIPO[tipo]}
        onPress={() => item && setSelecionado({ item, origem: 'EQUIPADO' })}
      />
    );
  };

  return (
    <View style={estilos.raiz}>
      <CabecalhoJogo titulo="INVENTÁRIO" />

      <View style={estilos.abas}>
        <Guia rotulo={`INVENTÁRIO (${mochila.length + equipados.length})`} ativa={aba === 'INVENTARIO'} onPress={() => setAba('INVENTARIO')} />
        {/* Baú de armazenamento e descarte só existem no modo local (não há suporte no servidor) */}
        {!apiConfigurada() && (
          <Guia rotulo={`BAÚ (${guardados.length})`} ativa={aba === 'BAU'} onPress={() => setAba('BAU')} />
        )}
      </View>

      <ScrollView contentContainerStyle={estilos.conteudo}>
        {aba === 'INVENTARIO' ? (
          <>
            {/* Equipamento: silhueta do herói com os 4 slots */}
            <View style={estilos.equipamento}>
              <View style={estilos.colunaSlots}>
                {slotEquipado('CAPACETE')}
                {slotEquipado('ARMA')}
              </View>
              <View style={estilos.silhueta}>
                {avatar && (
                  <AvatarPixel genero={avatar.genero} cabelo={avatar.cabelo} corPele="#64748B" corRoupa="#475569" tamanho={92} />
                )}
              </View>
              <View style={estilos.colunaSlots}>
                {slotEquipado('ARMADURA')}
                {slotEquipado('BOTAS')}
              </View>
            </View>
            <Text style={estilos.bonus}>
              ⚔ +{bonus.forca} força   ❤ +{bonus.vida} vida
            </Text>

            {baus.length > 0 && (
              <View style={{ gap: espaco.sm }}>
                <Text style={estilos.secao}>BAÚS DE RECOMPENSA · TOQUE PARA ABRIR</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: espaco.sm }}>
                  {baus.map((b) => (
                    <Pressable key={b.id} style={estilos.bau} onPress={() => setAbrindo(b)}>
                      <BauPixel tipo={b.tipo} tamanho={40} />
                      <Text style={estilos.bauTexto}>{ROTULO_BAU[b.tipo].replace('Baú ', '').toUpperCase()}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={estilos.secao}>MOCHILA · {mochila.length} ITENS</Text>
            <Grade
              itens={mochila}
              tamanho={slotTamanho}
              aoMedir={setLarguraGrade}
              aoTocar={(item) => setSelecionado({ item, origem: 'MOCHILA' })}
            />
          </>
        ) : (
          <>
            <Text style={estilos.info}>
              Baú de armazenamento: itens guardados ficam seguros e não contam para os atributos. Toque em um item
              para retirá-lo.
            </Text>
            {[...RARIDADES].reverse().map((r) => {
              const grupo = guardados.filter((i) => i.raridade === r);
              if (!grupo.length) return null;
              return (
                <View key={r} style={{ gap: espaco.sm }}>
                  <Text style={[estilos.secao, { color: COR_RARIDADE[r] }]}>
                    {ROTULO_RARIDADE[r].toUpperCase()} · {grupo.length}
                  </Text>
                  <Grade
                    itens={grupo}
                    tamanho={slotTamanho}
                    minimo={0}
                    aoMedir={setLarguraGrade}
                    aoTocar={(item) => setSelecionado({ item, origem: 'BAU' })}
                  />
                </View>
              );
            })}
            {guardados.length === 0 && <Text style={estilos.vazio}>Seu baú está vazio.</Text>}
          </>
        )}
      </ScrollView>

      {/* Painel do item selecionado */}
      <Modal visible={!!selecionado} transparent animationType="slide" onRequestClose={() => setSelecionado(null)}>
        <Pressable style={estilos.veu} onPress={() => setSelecionado(null)}>
          {selecionado && (
            <Pressable style={[estilos.folha, { borderTopColor: COR_RARIDADE[selecionado.item.raridade] }]}>
              <View style={estilos.linhaFolha}>
                <SlotItem item={selecionado.item} tamanho={64} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={estilos.nome}>{selecionado.item.nome}</Text>
                  <Text style={[estilos.detalhe, { color: COR_RARIDADE[selecionado.item.raridade] }]}>
                    {ROTULO_RARIDADE[selecionado.item.raridade]} · {ROTULO_TIPO[selecionado.item.tipo]}
                  </Text>
                  <Text style={estilos.detalhe}>
                    {selecionado.item.bonusForca > 0 ? `⚔ +${selecionado.item.bonusForca} força  ` : ''}
                    {selecionado.item.bonusVida > 0 ? `❤ +${selecionado.item.bonusVida} vida` : ''}
                  </Text>
                </View>
              </View>

              {selecionado.origem === 'EQUIPADO' && (
                <Botao
                  titulo="DESEQUIPAR"
                  variante="escuro"
                  carregando={ocupado}
                  onPress={() => executar(() => alternarEquipado(uid, selecionado.item.id))}
                />
              )}
              {selecionado.origem === 'MOCHILA' && (
                <>
                  <Botao
                    titulo="EQUIPAR"
                    carregando={ocupado}
                    onPress={() => executar(() => alternarEquipado(uid, selecionado.item.id))}
                  />
                  {!apiConfigurada() && (
                    <View style={estilos.linhaBotoes}>
                      <Botao
                        titulo="GUARDAR NO BAÚ"
                        variante="escuro"
                        estilo={{ flex: 1 }}
                        onPress={() => executar(() => moverItemDeLocal(uid, selecionado.item.id, 'BAU'))}
                      />
                      <Botao
                        titulo={`DESCARTAR +${valorDescarte(selecionado.item.raridade)}`}
                        variante="contorno"
                        estilo={{ flex: 1 }}
                        onPress={() => descartar(selecionado.item)}
                      />
                    </View>
                  )}
                </>
              )}
              {selecionado.origem === 'BAU' && (
                <Botao
                  titulo="RETIRAR PARA A MOCHILA"
                  carregando={ocupado}
                  onPress={() => executar(() => moverItemDeLocal(uid, selecionado.item.id, 'INVENTARIO'))}
                />
              )}
            </Pressable>
          )}
        </Pressable>
      </Modal>

      <RevelacaoItem
        visivel={!!abrindo}
        bau={abrindo?.tipo}
        abrir={async () => {
          if (!abrindo) throw new Error('Baú indisponível.');
          const item = await abrirBau(uid, abrindo.id);
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
    <Pressable
      style={[estilos.guia, ativa && estilos.guiaAtiva]}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: ativa }}>
      <Text style={[estilos.guiaTexto, !ativa && { color: cores.textoSuave }]}>{rotulo}</Text>
    </Pressable>
  );
}

// Grade de slots do mesmo tamanho; completa com slots vazios até fechar as linhas
function Grade({
  itens,
  tamanho,
  minimo = SLOTS_MINIMOS,
  aoMedir,
  aoTocar,
}: {
  itens: ItemInventario[];
  tamanho: number;
  minimo?: number;
  aoMedir: (largura: number) => void;
  aoTocar: (i: ItemInventario) => void;
}) {
  const total = Math.max(minimo, Math.ceil(itens.length / COLUNAS) * COLUNAS);
  return (
    <View style={estilos.grade} onLayout={(e) => aoMedir(e.nativeEvent.layout.width)}>
      {Array.from({ length: total }, (_, i) => {
        const item = itens[i];
        return <SlotItem key={item?.id ?? `vazio-${i}`} item={item} tamanho={tamanho} onPress={() => item && aoTocar(item)} />;
      })}
    </View>
  );
}

function SlotItem({
  item,
  tamanho,
  vazioIcone,
  rotulo,
  onPress,
}: {
  item?: ItemInventario;
  tamanho: number;
  vazioIcone?: keyof typeof Ionicons.glyphMap;
  rotulo?: string;
  onPress?: () => void;
}) {
  const cor = item ? COR_RARIDADE[item.raridade] : cores.borda;
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Pressable
        onPress={onPress}
        disabled={!item}
        accessibilityLabel={item ? `${item.nome}, ${ROTULO_RARIDADE[item.raridade]}` : `Slot vazio${rotulo ? ` de ${rotulo}` : ''}`}
        style={[
          estilos.slot,
          { width: tamanho, height: tamanho, borderColor: cor },
          !item && estilos.slotVazio,
        ]}>
        {item ? (
          <Ionicons name={ICONE[item.tipo]} size={tamanho * 0.45} color={cor} />
        ) : (
          vazioIcone && <Ionicons name={vazioIcone} size={tamanho * 0.4} color={cores.borda} />
        )}
      </Pressable>
      {rotulo && <Text style={estilos.rotuloSlot}>{rotulo.toUpperCase()}</Text>}
    </View>
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
  equipamento: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: espaco.md,
    backgroundColor: cores.superficie,
    borderWidth: 3,
    borderColor: cores.borda,
  },
  colunaSlots: { gap: espaco.md },
  silhueta: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: espaco.sm,
    paddingVertical: espaco.sm,
    backgroundColor: cores.fundo,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: cores.bordaClara,
    alignSelf: 'stretch',
  },
  bonus: { fontFamily: fontes.monoNegrito, color: cores.texto, fontSize: 13, textAlign: 'center', marginTop: -espaco.sm },
  secao: { fontFamily: fontes.mono, color: cores.textoSuave, fontSize: 11, letterSpacing: 2 },
  bau: {
    alignItems: 'center',
    gap: 6,
    padding: espaco.sm,
    width: 80,
    backgroundColor: cores.superficie,
    borderWidth: 2,
    borderColor: cores.borda,
  },
  bauTexto: { fontFamily: fontes.monoNegrito, color: cores.texto, fontSize: 9 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  slot: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, backgroundColor: cores.superficie },
  slotVazio: { borderStyle: 'dashed', backgroundColor: cores.fundo },
  rotuloSlot: { fontFamily: fontes.mono, color: cores.textoSuave, fontSize: 8 },
  info: { fontFamily: fontes.texto, color: cores.textoSuave, fontSize: 12, lineHeight: 17 },
  vazio: { fontFamily: fontes.texto, color: cores.textoSuave, fontSize: 14, textAlign: 'center', marginTop: espaco.lg },
  veu: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#020617AA' },
  folha: {
    padding: espaco.lg,
    gap: espaco.md,
    backgroundColor: cores.superficie,
    borderTopWidth: 4,
  },
  linhaFolha: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  nome: { fontFamily: fontes.textoNegrito, color: cores.texto, fontSize: 16 },
  detalhe: { fontFamily: fontes.mono, color: cores.textoSuave, fontSize: 12 },
  linhaBotoes: { flexDirection: 'row', gap: espaco.md },
});
