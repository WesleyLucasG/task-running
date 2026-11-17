import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, View } from 'react-native';
import { COR_RARIDADE, ROTULO_BAU, ROTULO_RARIDADE, ROTULO_TIPO, TipoBau } from '../domain/loja';
import type { Raridade, TipoItem } from '../domain/loja';
import { cores, espaco, fontes } from '../theme';
import { BauPixel } from './BauPixel';
import { Botao } from './Botao';

export type ItemRevelado = {
  nome: string;
  tipo: TipoItem;
  raridade: Raridade;
  bonusForca: number;
  bonusVida: number;
};

type Props = {
  visivel: boolean;
  bau?: TipoBau; // com baú: mostra o baú tremendo e pede para abrir
  abrir?: () => Promise<ItemRevelado>;
  itemPronto?: ItemRevelado | null; // sem baú: revela direto (lendário do chefe)
  titulo?: string;
  aoFechar: () => void;
};

const ICONE: Record<TipoItem, keyof typeof Ionicons.glyphMap> = {
  ARMA: 'flame',
  CAPACETE: 'shield',
  ARMADURA: 'shirt',
  BOTAS: 'footsteps',
};

// Abertura de baú e revelação de item. Animações leves (Animated + driver nativo).
export function RevelacaoItem({ visivel, bau, abrir, itemPronto, titulo, aoFechar }: Props) {
  const [item, setItem] = useState<ItemRevelado | null>(null);
  const [abrindo, setAbrindo] = useState(false);
  const [erro, setErro] = useState('');
  const [tremor] = useState(() => new Animated.Value(0));
  const [escala] = useState(() => new Animated.Value(0));
  const [giro] = useState(() => new Animated.Value(0));

  const mostrado = item ?? itemPronto ?? null;
  const lendario = mostrado?.raridade === 'LENDARIO';

  // Zera o estado ao fechar, para a próxima abertura começar do baú fechado
  const fechar = () => {
    setItem(null);
    setErro('');
    setAbrindo(false);
    escala.setValue(0);
    aoFechar();
  };

  // Baú balançando enquanto espera ser aberto
  useEffect(() => {
    if (!visivel) return;
    const balanco = Animated.loop(
      Animated.sequence([
        Animated.timing(tremor, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.timing(tremor, { toValue: -1, duration: 90, useNativeDriver: true }),
        Animated.timing(tremor, { toValue: 0, duration: 90, useNativeDriver: true }),
        Animated.delay(500),
      ]),
    );
    balanco.start();
    return () => balanco.stop();
  }, [visivel, tremor]);

  // Item revelado: "salta" na tela; lendário ganha raios girando
  useEffect(() => {
    if (!mostrado) return;
    Animated.spring(escala, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
    if (!lendario) return;
    const raios = Animated.loop(
      Animated.timing(giro, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true }),
    );
    raios.start();
    return () => raios.stop();
  }, [mostrado, lendario, escala, giro]);

  async function aoAbrir() {
    if (!abrir) return;
    setAbrindo(true);
    try {
      setItem(await abrir());
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setAbrindo(false);
    }
  }

  const cor = mostrado ? COR_RARIDADE[mostrado.raridade] : cores.dourado;
  const rotacao = giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const inclinacao = tremor.interpolate({ inputRange: [-1, 1], outputRange: ['-8deg', '8deg'] });

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={fechar} statusBarTranslucent>
      <View style={estilos.fundo}>
        <View style={[estilos.caixa, lendario && { borderColor: cores.douradoClaro }]}>
          <Text style={[estilos.titulo, lendario && { color: cores.douradoClaro }]}>
            {lendario ? 'ITEM LENDÁRIO!' : (titulo ?? (bau ? ROTULO_BAU[bau].toUpperCase() : 'NOVO ITEM'))}
          </Text>

          {!mostrado && bau && (
            <>
              <Animated.View style={{ transform: [{ rotate: inclinacao }], marginVertical: espaco.lg }}>
                <BauPixel tipo={bau} tamanho={110} />
              </Animated.View>
              {!!erro && <Text style={estilos.erro}>{erro}</Text>}
              <Botao titulo="ABRIR BAÚ" fonte="pixel" carregando={abrindo} onPress={aoAbrir} estilo={{ alignSelf: 'stretch' }} />
              <Botao titulo="DEPOIS" variante="escuro" onPress={fechar} estilo={{ alignSelf: 'stretch' }} />
            </>
          )}

          {mostrado && (
            <>
              <View style={estilos.palco}>
                {lendario && (
                  <Animated.View style={[estilos.raios, { transform: [{ rotate: rotacao }] }]}>
                    {Array.from({ length: 8 }, (_, i) => (
                      <View key={i} style={[estilos.raio, { transform: [{ rotate: `${i * 22.5}deg` }] }]} />
                    ))}
                  </Animated.View>
                )}
                <Animated.View style={[estilos.icone, { borderColor: cor, transform: [{ scale: escala }] }]}>
                  <Ionicons name={ICONE[mostrado.tipo]} size={54} color={cor} />
                </Animated.View>
              </View>
              <Text style={[estilos.raridade, { color: cor }]}>{ROTULO_RARIDADE[mostrado.raridade].toUpperCase()}</Text>
              <Text style={estilos.nome}>{mostrado.nome}</Text>
              <Text style={estilos.tipo}>{ROTULO_TIPO[mostrado.tipo]}</Text>
              <View style={estilos.bonus}>
                {mostrado.bonusForca > 0 && <Text style={estilos.chip}>⚔ +{mostrado.bonusForca} força</Text>}
                {mostrado.bonusVida > 0 && <Text style={estilos.chip}>❤ +{mostrado.bonusVida} vida</Text>}
              </View>
              <Text style={estilos.aviso}>Enviado ao Inventário.</Text>
              <Botao titulo="ÓTIMO!" onPress={fechar} estilo={{ alignSelf: 'stretch' }} />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: '#020617DD', alignItems: 'center', justifyContent: 'center', padding: espaco.lg },
  caixa: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: espaco.sm,
    padding: espaco.lg,
    backgroundColor: cores.superficie,
    borderWidth: 3,
    borderColor: cores.borda,
  },
  titulo: { fontFamily: fontes.pixel, color: cores.texto, fontSize: 14, textAlign: 'center' },
  palco: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center' },
  raios: { position: 'absolute', width: 180, height: 180, alignItems: 'center', justifyContent: 'center' },
  raio: { position: 'absolute', width: 8, height: 180, backgroundColor: '#FACC1533' },
  icone: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    backgroundColor: cores.fundo,
  },
  raridade: { fontFamily: fontes.monoNegrito, fontSize: 12, letterSpacing: 2 },
  nome: { fontFamily: fontes.textoNegrito, color: cores.texto, fontSize: 18, textAlign: 'center' },
  tipo: { fontFamily: fontes.texto, color: cores.textoSuave, fontSize: 13 },
  bonus: { flexDirection: 'row', gap: espaco.sm, marginVertical: espaco.sm },
  chip: {
    fontFamily: fontes.monoNegrito,
    color: cores.texto,
    fontSize: 11,
    backgroundColor: cores.borda,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  aviso: { fontFamily: fontes.texto, color: cores.textoSuave, fontSize: 12, marginBottom: espaco.sm },
  erro: { fontFamily: fontes.texto, color: cores.erro, fontSize: 13 },
});
