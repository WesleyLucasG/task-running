import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { cores, espaco, fontes } from '../theme';

// Sprites recortados da folha de poses do Hermes (fundo transparente).
export const POSES_HERMES = {
  acenando: require('../../assets/hermes/acenando.png'),
  apresentando: require('../../assets/hermes/apresentando.png'),
  cajado: require('../../assets/hermes/cajado.png'),
  falando: require('../../assets/hermes/falando.png'),
  mapa: require('../../assets/hermes/mapa.png'),
  reverencia: require('../../assets/hermes/reverencia.png'),
  disparada: require('../../assets/hermes/disparada.png'),
} as const;

const QUADROS_CORRIDA = [
  require('../../assets/hermes/corrida-1.png'),
  require('../../assets/hermes/corrida-2.png'),
  require('../../assets/hermes/corrida-3.png'),
];

export type PoseHermes = keyof typeof POSES_HERMES | 'correndo';

// Sprite isolado do Hermes. "correndo" anima os 3 quadros da corrida.
export function SpriteHermes({ pose = 'acenando', altura = 120 }: { pose?: PoseHermes; altura?: number }) {
  const [quadro, setQuadro] = useState(0);

  useEffect(() => {
    if (pose !== 'correndo') return;
    const id = setInterval(() => setQuadro((q) => (q + 1) % QUADROS_CORRIDA.length), 160);
    return () => clearInterval(id);
  }, [pose]);

  const fonte = pose === 'correndo' ? QUADROS_CORRIDA[quadro] : POSES_HERMES[pose];
  return (
    <Image
      source={fonte}
      style={{ height: altura, width: altura * 0.7 }}
      resizeMode="contain"
      accessibilityLabel="Hermes, o mensageiro"
    />
  );
}

type Props = {
  mensagem: string;
  pose?: PoseHermes;
  tamanho?: number;
  destaque?: boolean; // moldura laranja com losango (Onboarding 3)
  estilo?: ViewStyle;
};

// Caixa "MENSAGEIRO HERMES" do Figma: retrato à esquerda, rótulo laranja e fala em itálico.
export function Hermes({ mensagem, pose = 'acenando', tamanho = 84, destaque = false, estilo }: Props) {
  return (
    <View style={[estilos.caixa, destaque && estilos.destaque, estilo]}>
      <View style={[estilos.retrato, { width: tamanho, height: tamanho }]}>
        <SpriteHermes pose={pose} altura={tamanho - 6} />
      </View>
      <View style={estilos.texto}>
        <Text style={estilos.nome}>MENSAGEIRO HERMES</Text>
        <Text style={estilos.fala}>&quot;{mensagem}&quot;</Text>
      </View>
      {destaque && <View style={estilos.losango} />}
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    padding: espaco.md,
    backgroundColor: cores.superficie,
    borderWidth: 2,
    borderColor: cores.borda,
  },
  destaque: {
    backgroundColor: cores.fundo,
    borderColor: 'transparent',
    borderRightColor: cores.laranja,
    borderBottomColor: cores.laranja,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  retrato: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: cores.superficieAlta,
    borderWidth: 2,
    borderColor: cores.borda,
    overflow: 'hidden',
  },
  texto: { flex: 1, gap: espaco.sm },
  nome: { fontFamily: fontes.mono, color: cores.laranja, fontSize: 11, letterSpacing: 2 },
  fala: { fontFamily: fontes.texto, fontStyle: 'italic', color: cores.texto, fontSize: 14, lineHeight: 20 },
  losango: {
    position: 'absolute',
    right: -9,
    bottom: -9,
    width: 14,
    height: 14,
    backgroundColor: cores.laranja,
    transform: [{ rotate: '45deg' }],
  },
});
