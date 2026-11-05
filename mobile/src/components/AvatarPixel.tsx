import { View } from 'react-native';
import { Cabelo, COR_CABELO, Genero } from '../domain/avatar';

type Props = {
  genero: Genero;
  cabelo: Cabelo;
  corPele: string;
  corRoupa: string;
  tamanho?: number;
};

export function AvatarPixel({ genero, cabelo, corPele, corRoupa, tamanho = 120 }: Props) {
  const u = tamanho / 12; // unidade de "pixel"

  const bloco = (chave: string, x: number, y: number, w: number, h: number, cor: string) => (
    <View
      key={chave}
      style={{
        position: 'absolute',
        left: x * u,
        top: y * u,
        width: w * u,
        height: h * u,
        backgroundColor: cor,
      }}
    />
  );

  return (
    <View style={{ width: 12 * u, height: 18 * u }}>
      {bloco('perna-e', 3, 13, 2, 4, '#1E293B')}
      {bloco('perna-d', 7, 13, 2, 4, '#1E293B')}
      {bloco('sapato-e', 3, 17, 2, 1, '#F1F5F9')}
      {bloco('sapato-d', 7, 17, 2, 1, '#F1F5F9')}
      {bloco('corpo', 2, 8, 8, 5, corRoupa)}
      {bloco('braco-e', 1, 8, 1, 5, corPele)}
      {bloco('braco-d', 10, 8, 1, 5, corPele)}
      {genero === 'FEMININO' && bloco('saia', 2, 13, 8, 2, corRoupa)}
      {bloco('cabeca', 3, 2, 6, 6, corPele)}
      {bloco('olho-e', 4, 5, 1, 1, '#0F172A')}
      {bloco('olho-d', 7, 5, 1, 1, '#0F172A')}
      {cabelo === 'CURTO' && bloco('cabelo', 3, 1, 6, 3, COR_CABELO)}
      {cabelo === 'LONGO' && [
        bloco('cabelo', 3, 1, 6, 3, COR_CABELO),
        bloco('cabelo-e', 2, 2, 1, 8, COR_CABELO),
        bloco('cabelo-d', 9, 2, 1, 8, COR_CABELO),
      ]}
      {cabelo === 'RASPADO' && bloco('cabelo', 3, 2, 6, 1, COR_CABELO)}
    </View>
  );
}