import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { cores, espaco, fontes, SOMBRA_PIXEL } from '../theme';

export type VarianteBotao =
  | 'primario' // laranja sólido ("Iniciar Jornada", "Entendido")
  | 'dourado' // dourado sólido ("Habilitar Avisos")
  | 'contorno' // borda dourada ("Criar Nova Conta")
  | 'claro' // borda branca ("Entrar" no cadastro)
  | 'escuro'; // superfície escura ("Voltar")

type Props = {
  titulo: string;
  onPress: () => void;
  carregando?: boolean;
  desabilitado?: boolean;
  variante?: VarianteBotao;
  fonte?: 'pixel' | 'texto';
  iconeDireita?: keyof typeof Ionicons.glyphMap;
  iconeEsquerda?: keyof typeof Ionicons.glyphMap;
  estilo?: ViewStyle;
};

const VISUAL: Record<VarianteBotao, { fundo: string; borda: string; texto: string; sombra?: string }> = {
  primario: { fundo: cores.laranja, borda: cores.laranja, texto: cores.texto, sombra: cores.laranjaEscuro },
  dourado: { fundo: cores.dourado, borda: cores.texto, texto: cores.texto, sombra: cores.douradoEscuro },
  contorno: { fundo: 'transparent', borda: cores.dourado, texto: cores.dourado },
  claro: { fundo: 'transparent', borda: cores.texto, texto: cores.texto },
  escuro: { fundo: cores.superficie, borda: cores.borda, texto: cores.texto, sombra: cores.sombra },
};

export function Botao({
  titulo,
  onPress,
  carregando = false,
  desabilitado = false,
  variante = 'primario',
  fonte = 'texto',
  iconeDireita,
  iconeEsquerda,
  estilo,
}: Props) {
  const v = VISUAL[variante];
  const inativo = desabilitado || carregando;
  const tamanhoFonte = fonte === 'pixel' ? 13 : 14;

  return (
    <View style={[estilos.envoltorio, estilo]}>
      {v.sombra && !desabilitado && <View style={[estilos.sombra, { backgroundColor: v.sombra }]} />}
      <Pressable
        onPress={onPress}
        disabled={inativo}
        accessibilityRole="button"
        accessibilityState={{ disabled: inativo }}
        style={({ pressed }) => [
          estilos.base,
          { backgroundColor: v.fundo, borderColor: v.borda },
          desabilitado && estilos.desabilitado,
          pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] },
        ]}>
        {carregando ? (
          <ActivityIndicator color={v.texto} />
        ) : (
          <View style={estilos.linha}>
            {iconeEsquerda && <Ionicons name={iconeEsquerda} size={18} color={v.texto} />}
            <Text
              style={[
                estilos.texto,
                {
                  color: desabilitado ? cores.textoApagado : v.texto,
                  fontFamily: fonte === 'pixel' ? fontes.pixel : fontes.textoNegrito,
                  fontSize: tamanhoFonte,
                },
              ]}>
              {titulo}
            </Text>
            {iconeDireita && (
              <Ionicons name={iconeDireita} size={18} color={desabilitado ? cores.textoApagado : v.texto} />
            )}
          </View>
        )}
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  envoltorio: { position: 'relative', marginRight: SOMBRA_PIXEL, marginBottom: SOMBRA_PIXEL },
  sombra: {
    position: 'absolute',
    top: SOMBRA_PIXEL,
    left: SOMBRA_PIXEL,
    right: -SOMBRA_PIXEL,
    bottom: -SOMBRA_PIXEL,
  },
  base: {
    minHeight: 54,
    paddingHorizontal: espaco.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desabilitado: { backgroundColor: cores.superficie, borderColor: cores.borda },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  texto: { letterSpacing: 1, textAlign: 'center' },
});
