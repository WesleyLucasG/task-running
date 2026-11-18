import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FalaHermes, ouvirHermes } from '../state/hermes';
import { cores, espaco, fontes } from '../theme';
import { SpriteHermes } from './Hermes';

const DURACAO_MS = 4500;

// Balão flutuante do Hermes (sobre qualquer tela, sem alterar o layout das telas aprovadas).
export function HermesAviso() {
  const { top } = useSafeAreaInsets();
  const [fala, setFala] = useState<FalaHermes | null>(null);
  const [posicao] = useState(() => new Animated.Value(-140));

  useEffect(
    () =>
      ouvirHermes((f) => {
        setFala(f);
        posicao.setValue(-140);
        Animated.spring(posicao, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
      }),
    [posicao],
  );

  useEffect(() => {
    if (!fala) return;
    const t = setTimeout(() => {
      Animated.timing(posicao, { toValue: -140, duration: 250, useNativeDriver: true }).start(() => setFala(null));
    }, DURACAO_MS);
    return () => clearTimeout(t);
  }, [fala, posicao]);

  if (!fala) return null;
  return (
    <Animated.View
      style={[estilos.envoltorio, { top: top + espaco.sm, transform: [{ translateY: posicao }] }]}
      accessibilityLiveRegion="polite">
      <Pressable style={estilos.balao} onPress={() => setFala(null)} accessibilityLabel={`Hermes: ${fala.texto}`}>
        <View style={estilos.retrato}>
          <SpriteHermes pose={fala.pose} altura={44} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={estilos.nome}>HERMES</Text>
          <Text style={estilos.texto}>{fala.texto}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  envoltorio: { position: 'absolute', left: espaco.md, right: espaco.md, zIndex: 50, elevation: 12 },
  balao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    padding: espaco.sm,
    backgroundColor: cores.superficie,
    borderWidth: 2,
    borderColor: cores.dourado,
  },
  retrato: { width: 48, height: 48, alignItems: 'center', justifyContent: 'flex-end', backgroundColor: cores.fundo },
  nome: { fontFamily: fontes.mono, color: cores.laranja, fontSize: 10, letterSpacing: 2 },
  texto: { fontFamily: fontes.texto, color: cores.texto, fontSize: 13, lineHeight: 18 },
});
