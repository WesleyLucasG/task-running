import { StyleSheet, View } from 'react-native';
import { cores } from '../theme';

export function BarraProgresso({ progresso, cor = cores.laranja }: { progresso: number; cor?: string }) {
  const pct = Math.max(0, Math.min(1, progresso)) * 100;
  return (
    <View style={estilos.trilho}>
      <View style={[estilos.preenchimento, { width: `${pct}%`, backgroundColor: cor }]} />
    </View>
  );
}

const estilos = StyleSheet.create({
  trilho: {
    height: 14,
    backgroundColor: cores.fundo,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 7,
    overflow: 'hidden',
  },
  preenchimento: { height: '100%' },
});