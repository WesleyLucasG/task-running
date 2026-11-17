import { ReactNode, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { cores } from '../theme';

// Fundo noturno das telas de entrada (Abertura/Login).
// PENDENTE: quando a arte do Figma estiver em assets/images/fundo-olimpo.png,
// trocar a View raiz por <ImageBackground source={require(...)} resizeMode="cover">.
export function FundoPixel({ children, cantos = false }: { children: ReactNode; cantos?: boolean }) {
  // Estrelas em posições fixas (determinísticas) para não "piscar" a cada renderização
  const estrelas = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        left: `${(i * 37) % 100}%` as const,
        top: `${(i * 53) % 60}%` as const,
        tamanho: i % 5 === 0 ? 4 : 2,
      })),
    [],
  );

  return (
    <View style={estilos.raiz}>
      <View style={estilos.horizonte} />
      {estrelas.map((e, i) => (
        <View
          key={i}
          style={[estilos.estrela, { left: e.left, top: e.top, width: e.tamanho, height: e.tamanho }]}
        />
      ))}
      {cantos && (
        <>
          <View style={[estilos.canto, { top: 48, left: 12, borderTopWidth: 2, borderLeftWidth: 2 }]} />
          <View style={[estilos.canto, { top: 48, right: 12, borderTopWidth: 2, borderRightWidth: 2 }]} />
          <View style={[estilos.canto, { bottom: 12, left: 12, borderBottomWidth: 2, borderLeftWidth: 2 }]} />
          <View style={[estilos.canto, { bottom: 12, right: 12, borderBottomWidth: 2, borderRightWidth: 2 }]} />
        </>
      )}
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundoProfundo },
  // Faixa de "pôr do sol" atrás do conteúdo, lembrando a arte do Figma
  horizonte: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '28%',
    height: '22%',
    backgroundColor: '#7C2D12',
    opacity: 0.35,
  },
  estrela: { position: 'absolute', backgroundColor: '#CBD5E1', opacity: 0.6 },
  canto: { position: 'absolute', width: 18, height: 18, borderColor: cores.douradoEscuro },
});
