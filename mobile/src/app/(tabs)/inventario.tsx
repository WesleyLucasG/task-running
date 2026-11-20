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
  venderItem,
} from '../../db/inventario';
import { multiplicadorAgilidade, progressoXp } from '../../domain/jogo';
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
  const [larguraPalco, setLarguraPalco] = useState(140);

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

  // Venda (modo API): mostra nome, raridade e o valor CALCULADO PELO SERVIDOR antes de confirmar
  function vender(i: ItemInventario) {
    const valor = i.valorVenda ?? 0;
    Alert.alert(
      'Vender item',
      `${i.nome}\n${ROTULO_RARIDADE[i.raridade]} · ${ROTULO_TIPO[i.tipo]}\n\nVocê receberá ${valor} moedas. O item sai do inventário e esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: `Vender (+${valor})`,
          style: 'destructive',
          onPress: () =>
            executar(async () => {
              const r = await venderItem(i.id);
              Alert.alert('Item vendido', `+${r.moedas} moedas. Saldo: ${r.saldoMoedas.toLocaleString('pt-BR')}.`);
            }),
        },
      ],
    );
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
            {/* Barra de XP (nível atual e progresso até o próximo; valores do servidor no modo API) */}
            {avatar && <BarraXpHeroi nivel={avatar.nivel} xp={progressoXp(avatar)} />}

            {/* Herói grande com a aparência salva + 4 slots; atributos em primeiro plano */}
            <View style={estilos.equipamento}>
              <View style={estilos.colunaSlots}>
                {slotEquipado('CAPACETE')}
                {slotEquipado('ARMA')}
              </View>
              <View style={estilos.palco} onLayout={(e) => setLarguraPalco(e.nativeEvent.layout.width)}>
                <View style={estilos.aura} />
                <View style={estilos.sombraChao} />
                {avatar && (
                  <AvatarPixel
                    genero={avatar.genero}
                    cabelo={avatar.cabelo}
                    corPele={avatar.corPele}
                    corRoupa={avatar.corRoupa}
                    corCabelo={avatar.corCabelo}
                    detalheRoupa={avatar.detalheRoupa}
                    tamanho={Math.min(132, Math.max(84, larguraPalco - 28))}
                  />
                )}
              </View>
              <View style={estilos.colunaSlots}>
                {slotEquipado('ARMADURA')}
                {slotEquipado('BOTAS')}
              </View>
            </View>
            {avatar && (
              <View style={estilos.atributos}>
                <Atributo
                  icone="flame"
                  rotulo="FORÇA"
                  valor={avatar.forcaBase + bonus.forca}
                  extra={bonus.forca > 0 ? `+${bonus.forca} itens` : 'base'}
                  cor={cores.laranja}
                />
                <Atributo icone="heart" rotulo="VIDA" valor={avatar.vidaMaxima} extra={`nível ${avatar.nivel}`} cor={cores.erro} />
                <Atributo icone="shield-half" rotulo="ARMADURA" valor={bonus.vida} extra="vida dos itens" cor="#60A5FA" />
                <Atributo
                  icone="flash"
                  rotulo="AGILIDADE"
                  valor={avatar.agilidade}
                  extra={`+${Math.round((multiplicadorAgilidade(avatar.agilidade) - 1) * 100)}% corrida`}
                  cor={cores.douradoClaro}
                />
              </View>
            )}

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

              {selecionado.origem === 'EQUIPADO' && apiConfigurada() && (
                <Text style={estilos.detalhe}>Para vender, desequipe o item primeiro.</Text>
              )}
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
                  {apiConfigurada() && selecionado.item.valorVenda != null && (
                    <Botao
                      titulo={`VENDER +${selecionado.item.valorVenda} MOEDAS`}
                      variante="contorno"
                      carregando={ocupado}
                      onPress={() => vender(selecionado.item)}
                    />
                  )}
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

function BarraXpHeroi({ nivel, xp }: { nivel: number; xp: ReturnType<typeof progressoXp> }) {
  const pct = Math.round(xp.fracao * 100);
  return (
    <View style={estilos.xp}>
      <View style={estilos.linhaXp}>
        <Text style={estilos.nivelXp}>NÍVEL {nivel}</Text>
        <Text style={estilos.valorXp}>
          {xp.maximo
            ? 'NÍVEL MÁXIMO'
            : `${xp.atual.toLocaleString('pt-BR')} / ${xp.necessario.toLocaleString('pt-BR')} XP · ${pct}%`}
        </Text>
      </View>
      <View style={estilos.trilhoXp}>
        <View style={{ width: `${xp.fracao * 100}%`, height: '100%', backgroundColor: cores.douradoClaro }} />
      </View>
    </View>
  );
}

function Atributo({
  icone,
  rotulo,
  valor,
  extra,
  cor,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  rotulo: string;
  valor: number;
  extra: string;
  cor: string;
}) {
  return (
    <View style={estilos.atributo} accessibilityLabel={`${rotulo}: ${valor} (${extra})`}>
      <Ionicons name={icone} size={16} color={cor} />
      <Text style={estilos.atributoValor}>{valor}</Text>
      <Text style={estilos.atributoRotulo}>{rotulo}</Text>
      <Text style={estilos.atributoExtra} numberOfLines={1}>
        {extra}
      </Text>
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
  // Palco do herói: fundo escuro com aura e sombra no chão; o personagem é o elemento central
  palco: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: espaco.sm,
    paddingTop: espaco.md,
    paddingBottom: espaco.lg + 4,
    backgroundColor: cores.fundoProfundo,
    borderWidth: 1,
    borderColor: cores.borda,
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  aura: {
    position: 'absolute',
    top: '18%',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#F9731614',
    borderWidth: 1,
    borderColor: '#F9731626',
  },
  sombraChao: {
    position: 'absolute',
    bottom: espaco.lg - 2,
    width: '70%',
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0008',
  },
  xp: { gap: 6, padding: espaco.sm + 2, backgroundColor: cores.superficie, borderWidth: 2, borderColor: cores.borda },
  linhaXp: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nivelXp: { fontFamily: fontes.pixel, color: cores.douradoClaro, fontSize: 11 },
  valorXp: { fontFamily: fontes.mono, color: cores.texto, fontSize: 11 },
  trilhoXp: { height: 9, backgroundColor: cores.fundo, borderWidth: 1, borderColor: '#000', overflow: 'hidden' },
  // Atributos em primeiro plano, sobrepondo a base do palco
  atributos: {
    flexDirection: 'row',
    gap: espaco.xs,
    marginTop: -espaco.lg - espaco.sm,
    marginHorizontal: espaco.sm,
  },
  atributo: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
    paddingVertical: espaco.sm,
    backgroundColor: '#1E293BF2',
    borderWidth: 2,
    borderColor: cores.borda,
  },
  atributoValor: { fontFamily: fontes.pixel, color: cores.texto, fontSize: 12, marginTop: 2 },
  atributoRotulo: { fontFamily: fontes.monoNegrito, color: cores.texto, fontSize: 8, letterSpacing: 0.5 },
  atributoExtra: { fontFamily: fontes.mono, color: cores.textoSuave, fontSize: 8 },
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
