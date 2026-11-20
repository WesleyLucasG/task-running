import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { percentual, textoProgresso } from '../domain/metas';
import type { Meta } from '../services/jogoRemoto';
import { cores, espaco, fontes } from '../theme';

const ICONE: Record<Meta['categoria'], keyof typeof Ionicons.glyphMap> = {
  COMBATE: 'skull-outline',
  CORRIDA: 'footsteps-outline',
  HIDRATACAO: 'water-outline',
  PROGRESSAO: 'cube-outline',
  BONUS: 'star-outline',
};

type Props = {
  meta: Meta;
  compacto?: boolean; // prévia da tela principal: sem descrição e sem botão
  resgatando?: boolean;
  aoResgatar?: () => void;
  onPress?: () => void;
};

// Cartão de meta (referência visual aprovada): ícone, título, "1,4 km / 2 km · 70%", barra e moedas.
export function CartaoMeta({ meta, compacto = false, resgatando = false, aoResgatar, onPress }: Props) {
  const pct = percentual(meta);
  const pronta = meta.concluida && !meta.resgatada;
  const corBarra = meta.resgatada ? cores.sucesso : meta.concluida ? cores.douradoClaro : cores.laranja;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[estilos.cartao, pronta && estilos.cartaoPronto, meta.resgatada && { opacity: 0.75 }]}
      accessibilityLabel={`${meta.titulo}: ${textoProgresso(meta)}, ${pct}%. Recompensa ${meta.moedas} moedas.`}>
      <View style={[estilos.icone, meta.bonus && { borderColor: cores.dourado }]}>
        <Ionicons name={ICONE[meta.categoria]} size={18} color={meta.bonus ? cores.douradoClaro : cores.laranja} />
      </View>

      <View style={{ flex: 1, gap: 4 }}>
        <View style={estilos.linha}>
          <Text style={estilos.titulo} numberOfLines={1}>
            {meta.titulo}
          </Text>
          <Text style={[estilos.status, meta.concluida && { color: meta.resgatada ? cores.sucesso : cores.douradoClaro }]}>
            {meta.resgatada ? 'Resgatada' : meta.concluida ? 'Concluída' : `${textoProgresso(meta)} · ${pct}%`}
          </Text>
        </View>
        {!compacto && <Text style={estilos.descricao}>{meta.descricao}</Text>}
        <View style={estilos.trilho}>
          <View style={{ width: `${pct}%`, height: '100%', backgroundColor: corBarra }} />
        </View>
      </View>

      {!compacto && pronta && aoResgatar ? (
        <Pressable
          style={({ pressed }) => [estilos.resgatar, pressed && { opacity: 0.8 }]}
          onPress={aoResgatar}
          disabled={resgatando}
          accessibilityLabel={`Resgatar ${meta.moedas} moedas`}>
          {resgatando ? (
            <ActivityIndicator size="small" color={cores.texto} />
          ) : (
            <Text style={estilos.resgatarTexto}>RESGATAR{'\n'}+{meta.moedas}</Text>
          )}
        </Pressable>
      ) : (
        <View style={[estilos.moedas, meta.resgatada && { borderColor: cores.sucesso }]}>
          <Ionicons
            name={meta.resgatada ? 'checkmark' : 'logo-bitcoin'}
            size={12}
            color={meta.resgatada ? cores.sucesso : cores.douradoClaro}
          />
          <Text style={estilos.moedasTexto}>{meta.moedas}</Text>
        </View>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm + 2,
    padding: espaco.sm + 2,
    backgroundColor: cores.superficie,
    borderWidth: 2,
    borderColor: cores.borda,
  },
  cartaoPronto: { borderColor: cores.dourado, backgroundColor: '#2A2410' },
  icone: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.fundo,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  titulo: { flex: 1, fontFamily: fontes.textoNegrito, color: cores.texto, fontSize: 13 },
  status: { fontFamily: fontes.mono, color: cores.textoSuave, fontSize: 10 },
  descricao: { fontFamily: fontes.texto, color: cores.textoSuave, fontSize: 11 },
  trilho: { height: 6, backgroundColor: cores.fundo, borderWidth: 1, borderColor: '#000', overflow: 'hidden' },
  moedas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: cores.douradoEscuro,
    backgroundColor: cores.fundo,
    minWidth: 42,
    justifyContent: 'center',
  },
  moedasTexto: { fontFamily: fontes.monoNegrito, color: cores.douradoClaro, fontSize: 11 },
  resgatar: {
    minWidth: 66,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    backgroundColor: cores.laranja,
    borderBottomWidth: 3,
    borderBottomColor: cores.laranjaEscuro,
  },
  resgatarTexto: { fontFamily: fontes.monoNegrito, color: cores.texto, fontSize: 9, textAlign: 'center' },
});
