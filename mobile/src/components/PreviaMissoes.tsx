import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useMetas } from '../state/useMetas';
import { cores, espaco, fontes } from '../theme';
import { CartaoMeta } from './CartaoMeta';

// Prévia das missões diárias na tela principal (referência aprovada): "Missões diárias 1/3 · Ver todas".
// Some no modo local (sem servidor). Tocar abre a tela de Metas, onde fica o botão Resgatar.
export function PreviaMissoes() {
  const { disponivel, metas } = useMetas();
  if (!disponivel || !metas) return null;
  const diarias = metas.diarias.filter((m) => !m.bonus);
  const feitas = diarias.filter((m) => m.concluida).length;
  const prontas = metas.diarias.filter((m) => m.concluida && !m.resgatada).length
    + metas.semanais.filter((m) => m.concluida && !m.resgatada).length;

  return (
    <View style={{ gap: espaco.sm }}>
      <Pressable style={estilos.cabecalho} onPress={() => router.push('/metas')} accessibilityLabel="Ver todas as metas">
        <Ionicons name="flag" size={15} color={cores.laranja} />
        <Text style={estilos.titulo}>Missões diárias</Text>
        <Text style={estilos.contador}>
          {feitas}/{diarias.length}
        </Text>
        {prontas > 0 && <Text style={estilos.prontas}>{prontas} p/ resgatar</Text>}
        <View style={{ flex: 1 }} />
        <Text style={estilos.verTodas}>Ver todas</Text>
        <Ionicons name="chevron-forward" size={14} color={cores.textoSuave} />
      </Pressable>
      {diarias.map((m) => (
        <CartaoMeta key={m.codigo} meta={m} compacto onPress={() => router.push('/metas')} />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  titulo: { fontFamily: fontes.textoNegrito, color: cores.texto, fontSize: 14 },
  contador: {
    fontFamily: fontes.monoNegrito,
    color: cores.texto,
    fontSize: 10,
    paddingHorizontal: 6,
    backgroundColor: cores.superficieAlta,
  },
  prontas: { fontFamily: fontes.monoNegrito, color: cores.fundo, fontSize: 9, paddingHorizontal: 5, backgroundColor: cores.douradoClaro },
  verTodas: { fontFamily: fontes.mono, color: cores.textoSuave, fontSize: 11 },
});
