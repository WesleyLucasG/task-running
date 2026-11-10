import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { cores, espaco, raio } from '../theme';

type Props = {
  mensagem: string;
  imagem?: ImageSourcePropType; // quando você tiver o PNG do sprite, é só passar aqui
  tamanho?: number;
};

export function Hermes({ mensagem, imagem, tamanho = 84 }: Props) {
  const u = tamanho / 12;

  const bloco = (k: string, x: number, y: number, w: number, h: number, cor: string) => (
    <View
      key={k}
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
    <View style={estilos.linha}>
      {imagem ? (
        <Image source={imagem} style={{ width: tamanho, height: tamanho * 1.5 }} resizeMode="contain" />
      ) : (
        <View style={{ width: 12 * u, height: 18 * u }}>
          {bloco('capa', 1, 8, 10, 6, '#6B7F3A')}
          {bloco('perna-e', 3, 13, 2, 4, '#E8B27A')}
          {bloco('perna-d', 7, 13, 2, 4, '#E8B27A')}
          {bloco('sandalia-e', 3, 17, 2, 1, '#FACC15')}
          {bloco('sandalia-d', 7, 17, 2, 1, '#FACC15')}
          {bloco('tunica', 2, 8, 8, 5, '#F8FAFC')}
          {bloco('cinto', 2, 11, 8, 1, '#FACC15')}
          {bloco('braco-e', 1, 8, 1, 4, '#E8B27A')}
          {bloco('braco-d', 10, 8, 1, 4, '#E8B27A')}
          {bloco('cabeca', 3, 3, 6, 5, '#E8B27A')}
          {bloco('olho-e', 4, 5, 1, 1, '#0F172A')}
          {bloco('olho-d', 7, 5, 1, 1, '#0F172A')}
          {bloco('capacete', 3, 1, 6, 2, '#FACC15')}
          {bloco('asa-e', 1, 1, 2, 2, '#F8FAFC')}
          {bloco('asa-d', 9, 1, 2, 2, '#F8FAFC')}
        </View>
      )}
      <View style={estilos.balao}>
        <Text style={estilos.nome}>HERMES</Text>
        <Text style={estilos.texto}>{mensagem}</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  balao: {
    flex: 1,
    backgroundColor: cores.superficie,
    borderWidth: 2,
    borderColor: cores.dourado,
    borderRadius: raio.md,
    padding: espaco.md,
    gap: espaco.xs,
  },
  nome: { color: cores.dourado, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  texto: { color: cores.texto, fontSize: 14 },
});