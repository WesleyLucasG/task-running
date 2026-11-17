import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Botao } from '../../components/Botao';
import { CabecalhoJogo } from '../../components/CabecalhoJogo';
import { SpriteHermes } from '../../components/Hermes';
import { comprarItem } from '../../db/compras';
import {
  CATALOGO,
  ItemCatalogo,
  ofertaDoDia,
  precoItem,
  PRECO_RARIDADE,
  RARIDADES,
  ROTULO_RARIDADE,
  TipoItem,
} from '../../domain/loja';
import { useJogador } from '../../state/useJogador';
import { cores, espaco, fontes } from '../../theme';

// Cartões com a cor da raridade, como no Figma "Loja" (3:2900)
const VISUAL_RARIDADE = {
  COMUM: { fundo: '#F1F5F9', borda: '#CBD5E1', texto: '#0F172A', selo: 'COMMON' },
  RARO: { fundo: '#94A3B8', borda: cores.laranja, texto: '#0F172A', selo: 'RARE' },
  EPICO: { fundo: '#FED7AA', borda: cores.laranja, texto: '#7C2D12', selo: 'EPIC' },
  LENDARIO: { fundo: '#FEF3C7', borda: cores.dourado, texto: '#713F12', selo: 'LEGENDARY' },
} as const;

const ICONE_TIPO: Record<TipoItem, keyof typeof Ionicons.glyphMap> = {
  ARMA: 'flame',
  CAPACETE: 'shield',
  ARMADURA: 'shirt',
  BOTAS: 'footsteps',
};

const FILTROS: { rotulo: string; icone: keyof typeof Ionicons.glyphMap; tipo: TipoItem | null }[] = [
  { rotulo: 'TUDO', icone: 'cube-outline', tipo: null },
  { rotulo: 'ARMAS', icone: 'flame-outline', tipo: 'ARMA' },
  { rotulo: 'ELMOS', icone: 'shield-outline', tipo: 'CAPACETE' },
  { rotulo: 'TÚNICAS', icone: 'shirt-outline', tipo: 'ARMADURA' },
  { rotulo: 'BOTAS', icone: 'footsteps-outline', tipo: 'BOTAS' },
];

function tempoAteMeiaNoite(): string {
  const agora = new Date();
  const fim = new Date(agora);
  fim.setHours(24, 0, 0, 0);
  const s = Math.max(0, Math.floor((fim.getTime() - agora.getTime()) / 1000));
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

// Loja Mística — melhoria D3 (loja não é requisito do MVP, §2.4). Moedas vêm só da corrida (RF18).
export default function Loja() {
  const { usuario, moedas, recarregar } = useJogador();
  const [filtro, setFiltro] = useState<TipoItem | null>(null);
  const [relogio, setRelogio] = useState(tempoAteMeiaNoite());
  const [comprando, setComprando] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setRelogio(tempoAteMeiaNoite()), 1000);
    return () => clearInterval(id);
  }, []);

  const oferta = ofertaDoDia();
  const itens = useMemo(
    () =>
      CATALOGO.filter((i) => !filtro || i.tipo === filtro).sort(
        (a, b) => RARIDADES.indexOf(a.raridade) - RARIDADES.indexOf(b.raridade) || a.tipo.localeCompare(b.tipo),
      ),
    [filtro],
  );

  function confirmar(item: ItemCatalogo) {
    const preco = precoItem(item);
    Alert.alert('Comprar item', `${item.nome} por ${preco} moedas?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Comprar', onPress: () => comprar(item) },
    ]);
  }

  async function comprar(item: ItemCatalogo) {
    if (!usuario) return;
    setComprando(item.id);
    try {
      const r = await comprarItem(usuario.id, item.id);
      await recarregar();
      Alert.alert('Compra realizada!', `${r.nome} foi para o seu inventário. Equipe-o para ficar mais forte.`);
    } catch (e) {
      Alert.alert('Loja Mística', e instanceof Error ? e.message : String(e));
    } finally {
      setComprando(null);
    }
  }

  return (
    <View style={estilos.raiz}>
      <CabecalhoJogo titulo="LOJA MÍSTICA" />
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <View style={estilos.banner}>
          <View style={estilos.retrato}>
            <SpriteHermes pose="apresentando" altura={84} />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={estilos.tituloBanner}>Ofertas de{'\n'}Hermes</Text>
            <Text style={estilos.falaBanner}>
              &quot;Viajante! Use seu ouro sabiamente para enfrentar os perigos da jornada.&quot;
            </Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: espaco.sm }}>
          {FILTROS.map((f) => {
            const ativo = filtro === f.tipo;
            return (
              <Pressable
                key={f.rotulo}
                style={[estilos.filtro, ativo && estilos.filtroAtivo]}
                onPress={() => setFiltro(f.tipo)}>
                <Ionicons name={f.icone} size={14} color={cores.texto} />
                <Text style={estilos.textoFiltro}>{f.rotulo}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={estilos.oferta}>
          <Ionicons name="time-outline" size={16} color={cores.laranja} />
          <Text style={estilos.textoOferta} numberOfLines={1}>
            OFERTA: {oferta.nome} -30%
          </Text>
          <Text style={estilos.relogio}>{relogio}</Text>
        </View>

        <View style={estilos.linhaSecao}>
          <Ionicons name="sparkles-outline" size={14} color={cores.textoSuave} />
          <Text style={estilos.secao}>ITENS DISPONÍVEIS</Text>
        </View>

        {itens.map((item) => {
          const v = VISUAL_RARIDADE[item.raridade];
          const preco = precoItem(item);
          const emOferta = preco !== PRECO_RARIDADE[item.raridade];
          return (
            <View key={item.id} style={[estilos.cartao, { backgroundColor: v.fundo, borderColor: v.borda }]}>
              <View style={estilos.icone}>
                <Ionicons name={ICONE_TIPO[item.tipo]} size={34} color={v.borda === '#CBD5E1' ? cores.textoSuave : v.borda} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={estilos.linhaNome}>
                  <Text style={[estilos.nome, { color: v.texto }]} numberOfLines={1}>
                    {item.nome.toUpperCase()}
                  </Text>
                  <Text style={[estilos.selo, { color: v.texto, borderColor: v.texto }]}>{v.selo}</Text>
                </View>
                <Text style={[estilos.descricao, { color: v.texto }]}>
                  {ROTULO_RARIDADE[item.raridade]} · aumenta seus atributos na esteira.
                </Text>
                <View style={estilos.bonus}>
                  {item.bonusForca > 0 && <Text style={estilos.chip}>⚔ +{item.bonusForca}</Text>}
                  {item.bonusVida > 0 && <Text style={estilos.chip}>❤ +{item.bonusVida}</Text>}
                </View>
                <View style={estilos.linhaPreco}>
                  <View style={estilos.moeda}>
                    <Ionicons name="logo-bitcoin" size={14} color={cores.douradoEscuro} />
                  </View>
                  <Text style={[estilos.preco, { color: v.texto }]}>
                    {preco}
                    {emOferta && <Text style={estilos.riscado}> {PRECO_RARIDADE[item.raridade]}</Text>}
                  </Text>
                  <Botao
                    titulo="COMPRAR"
                    onPress={() => confirmar(item)}
                    carregando={comprando === item.id}
                    desabilitado={moedas < preco}
                    estilo={{ marginLeft: 'auto', minWidth: 110 }}
                  />
                </View>
              </View>
            </View>
          );
        })}

        <View style={estilos.saldo}>
          <View style={estilos.moedaGrande}>
            <Ionicons name="logo-bitcoin" size={22} color={cores.douradoEscuro} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={estilos.rotuloSaldo}>SEU SALDO TOTAL</Text>
            <Text style={estilos.valorSaldo}>{moedas.toLocaleString('pt-BR')} Ouro</Text>
          </View>
        </View>

        <View style={estilos.dica}>
          <Ionicons name="information-circle-outline" size={18} color={cores.fundo} />
          <Text style={estilos.textoDica}>
            <Text style={{ fontFamily: fontes.textoNegrito }}>Dica:</Text> ganhe mais ouro completando suas
            corridas — cada km rende 50 moedas!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.md, gap: espaco.md, paddingBottom: espaco.xl },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    padding: espaco.md,
    borderWidth: 2,
    borderColor: cores.texto,
  },
  retrato: { borderWidth: 2, borderColor: cores.dourado, backgroundColor: '#1D3A6B', padding: 4 },
  tituloBanner: { fontFamily: fontes.pixel, color: cores.douradoClaro, fontSize: 14, lineHeight: 20 },
  falaBanner: { fontFamily: fontes.texto, color: cores.texto, fontSize: 12, lineHeight: 17 },
  filtro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  filtroAtivo: { backgroundColor: cores.laranja, borderColor: cores.laranja },
  textoFiltro: { fontFamily: fontes.mono, color: cores.texto, fontSize: 11 },
  oferta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    padding: espaco.sm,
    borderWidth: 2,
    borderColor: cores.laranja,
    backgroundColor: '#7C2D1240',
  },
  textoOferta: { flex: 1, fontFamily: fontes.textoMedio, color: cores.laranja, fontSize: 12 },
  relogio: { fontFamily: fontes.monoNegrito, color: cores.laranja, fontSize: 12 },
  linhaSecao: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secao: { fontFamily: fontes.mono, color: cores.textoSuave, fontSize: 11, letterSpacing: 2 },
  cartao: { flexDirection: 'row', gap: espaco.md, padding: espaco.md, borderWidth: 3 },
  icone: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.fundo,
    borderWidth: 2,
    borderColor: cores.borda,
  },
  linhaNome: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nome: { flex: 1, fontFamily: fontes.textoMedio, fontSize: 13 },
  selo: { fontFamily: fontes.monoNegrito, fontSize: 8, borderWidth: 1, paddingHorizontal: 3 },
  descricao: { fontFamily: fontes.texto, fontSize: 11, opacity: 0.8 },
  bonus: { flexDirection: 'row', gap: 6 },
  chip: {
    fontFamily: fontes.monoNegrito,
    fontSize: 10,
    color: cores.texto,
    backgroundColor: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  linhaPreco: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  moeda: { backgroundColor: cores.dourado, borderRadius: 999, padding: 2 },
  preco: { fontFamily: fontes.textoNegrito, fontSize: 15 },
  riscado: { fontSize: 11, textDecorationLine: 'line-through', opacity: 0.6 },
  saldo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    paddingTop: espaco.md,
    borderTopWidth: 2,
    borderTopColor: cores.borda,
  },
  moedaGrande: { backgroundColor: cores.dourado, borderRadius: 999, padding: 6, borderWidth: 2, borderColor: cores.douradoEscuro },
  rotuloSaldo: { fontFamily: fontes.mono, color: cores.textoSuave, fontSize: 10, letterSpacing: 1 },
  valorSaldo: { fontFamily: fontes.pixel, color: cores.douradoClaro, fontSize: 14, marginTop: 4 },
  dica: {
    flexDirection: 'row',
    gap: espaco.sm,
    padding: espaco.md,
    backgroundColor: '#E2E8F0',
    borderWidth: 2,
    borderColor: cores.borda,
  },
  textoDica: { flex: 1, fontFamily: fontes.texto, color: cores.fundo, fontSize: 12, lineHeight: 17 },
});
