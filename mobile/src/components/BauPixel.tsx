import { View } from 'react-native';
import { COR_BAU, TipoBau } from '../domain/loja';

// Baú desenhado em "pixels" (Views), com a cor da raridade. aberto = tampa levantada.
export function BauPixel({ tipo, tamanho = 40, aberto = false }: { tipo: TipoBau; tamanho?: number; aberto?: boolean }) {
  const u = tamanho / 10;
  const cor = COR_BAU[tipo];
  const madeira = '#7C4A1E';
  const px = (x: number, y: number, w: number, h: number, c: string, k: string) => (
    <View key={k} style={{ position: 'absolute', left: x * u, top: y * u, width: w * u, height: h * u, backgroundColor: c }} />
  );
  const tampaY = aberto ? 0 : 2;
  return (
    <View style={{ width: 10 * u, height: 9 * u }} accessibilityLabel={`Baú ${tipo.toLowerCase()}`}>
      {aberto && px(2, 3, 6, 2, '#FDE68A', 'brilho')}
      {px(0, tampaY, 10, 3, madeira, 'tampa')}
      {px(0, tampaY, 10, 1, cor, 'tampa-borda')}
      {px(0, 5, 10, 4, madeira, 'corpo')}
      {px(0, 5, 10, 1, cor, 'faixa')}
      {px(0, 5, 1, 4, cor, 'lado-e')}
      {px(9, 5, 1, 4, cor, 'lado-d')}
      {px(0, 8, 10, 1, cor, 'base')}
      {!aberto && px(4, 4, 2, 2, cor, 'fecho')}
      {!aberto && px(4.5, 4.5, 1, 1, '#0F172A', 'fechadura')}
    </View>
  );
}
