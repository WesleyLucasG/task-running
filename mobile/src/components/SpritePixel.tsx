import { memo } from 'react';
import { View } from 'react-native';
import { largura, retangulos, Sprite } from '../domain/sprites';

type Props = {
  sprite: Sprite;
  tamanho: number; // largura em px
  espelhar?: boolean; // inimigos olham para o herói (esquerda)
  cinza?: boolean; // chefe bloqueado
};

// Desenha um sprite de pixel art (domain/sprites.ts) com Views — cada retângulo junta pixels vizinhos.
export const SpritePixel = memo(function SpritePixel({ sprite, tamanho, espelhar = false, cinza = false }: Props) {
  const colunas = largura(sprite);
  const u = tamanho / colunas;
  return (
    <View
      style={{ width: tamanho, height: sprite.grade.length * u, transform: espelhar ? [{ scaleX: -1 }] : undefined }}>
      {retangulos(sprite, cinza).map(([x, y, w, h, cor], i) => (
        <View
          key={i}
          style={{ position: 'absolute', left: x * u, top: y * u, width: w * u + 0.5, height: h * u + 0.5, backgroundColor: cor }}
        />
      ))}
    </View>
  );
});
