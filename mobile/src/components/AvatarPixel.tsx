import { View } from 'react-native';
import { AparenciaAvatar, Bloco, blocosAvatar } from '../domain/avatarBlocos';

type Props = AparenciaAvatar & { tamanho?: number };

// Herói em pixel art montado em CAMADAS (fundo → corpo → roupa → cabelo), na grade 12 x 18.
// Inspirado na referência dos guerreiros gregos (túnica, ombreiras douradas, sandálias).
// Combinar camadas evita ter uma imagem para cada combinação de gênero/cabelo/cor.
export function AvatarPixel({ tamanho = 120, ...aparencia }: Props) {
  const u = tamanho / 12;
  const camadas = blocosAvatar(aparencia);
  const desenhar = (blocos: Bloco[], camada: string) =>
    blocos.map(([x, y, w, h, cor], i) => (
      <View
        key={`${camada}-${i}`}
        style={{ position: 'absolute', left: x * u, top: y * u, width: w * u, height: h * u, backgroundColor: cor }}
      />
    ));

  return (
    <View style={{ width: 12 * u, height: 18 * u }}>
      {desenhar(camadas.fundo, 'fundo')}
      {desenhar(camadas.corpo, 'corpo')}
      {desenhar(camadas.roupa, 'roupa')}
      {desenhar(camadas.cabelo, 'cabelo')}
    </View>
  );
}
