import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CabecalhoJogo } from '../components/CabecalhoJogo';
import { CartaoMeta } from '../components/CartaoMeta';
import { textoRenovacao } from '../domain/metas';
import type { Meta } from '../services/jogoRemoto';
import { useMetas } from '../state/useMetas';
import { cores, espaco, fontes } from '../theme';

type Aba = 'DIARIAS' | 'SEMANAIS';

// Metas diárias e semanais (extensão aprovada). Progresso e recompensas vêm do servidor.
export default function MetasTela() {
  const { disponivel, metas, erro, resgatando, resgatar, restanteDiarias, restanteSemanais } = useMetas();
  const [aba, setAba] = useState<Aba>('DIARIAS');

  const lista: Meta[] = (aba === 'DIARIAS' ? metas?.diarias : metas?.semanais) ?? [];
  const normais = lista.filter((m) => !m.bonus);
  const bonus = lista.find((m) => m.bonus);
  const feitas = normais.filter((m) => m.concluida).length;
  const restante = aba === 'DIARIAS' ? restanteDiarias : restanteSemanais;

  async function aoResgatar(m: Meta) {
    try {
      const moedas = await resgatar(m.codigo);
      Alert.alert('Recompensa recebida', `+${moedas} moedas por "${m.titulo}".`);
    } catch (e) {
      Alert.alert('Metas', e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <View style={estilos.raiz}>
      <CabecalhoJogo titulo="METAS" voltar />

      <View style={estilos.abas}>
        <Guia rotulo="DIÁRIAS" ativa={aba === 'DIARIAS'} onPress={() => setAba('DIARIAS')} />
        <Guia rotulo="SEMANAIS" ativa={aba === 'SEMANAIS'} onPress={() => setAba('SEMANAIS')} />
      </View>

      <ScrollView contentContainerStyle={estilos.conteudo}>
        {!disponivel ? (
          <Text style={estilos.info}>As metas são registradas no servidor. Conecte o aplicativo à API para usá-las.</Text>
        ) : !metas ? (
          <Text style={estilos.info}>{erro ?? 'Carregando metas...'}</Text>
        ) : (
          <>
            <View style={estilos.resumo}>
              <View style={{ flex: 1 }}>
                <Text style={estilos.resumoTitulo}>
                  {aba === 'DIARIAS' ? 'Missões do dia' : 'Missões da semana'} · {feitas}/{normais.length}
                </Text>
                <View style={estilos.linhaTempo}>
                  <Ionicons name="time-outline" size={13} color={cores.textoSuave} />
                  <Text style={estilos.tempo}>{textoRenovacao(restante)}</Text>
                </View>
              </View>
              <Ionicons name="flag" size={22} color={cores.laranja} />
            </View>

            {normais.map((m) => (
              <CartaoMeta key={m.codigo} meta={m} resgatando={resgatando === m.codigo} aoResgatar={() => aoResgatar(m)} />
            ))}

            {bonus && (
              <>
                <Text style={estilos.secao}>RECOMPENSA ESPECIAL</Text>
                <CartaoMeta meta={bonus} resgatando={resgatando === bonus.codigo} aoResgatar={() => aoResgatar(bonus)} />
              </>
            )}

            <Text style={estilos.nota}>
              Corridas e caminhadas contam depois de sincronizadas. A hidratação conta até a sua meta pessoal: beber
              além dela não rende mais. Recompensas não resgatadas expiram quando o período renova.
            </Text>
            {erro && <Text style={[estilos.nota, { color: cores.erro }]}>{erro}</Text>}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Guia({ rotulo, ativa, onPress }: { rotulo: string; ativa: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[estilos.guia, ativa && estilos.guiaAtiva]}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: ativa }}>
      <Text style={[estilos.guiaTexto, !ativa && { color: cores.textoSuave }]}>{rotulo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  abas: {
    flexDirection: 'row',
    paddingHorizontal: espaco.md,
    paddingTop: espaco.md,
    borderBottomWidth: 2,
    borderBottomColor: cores.borda,
  },
  guia: { paddingHorizontal: espaco.md, paddingVertical: 12, borderWidth: 2, borderColor: 'transparent', borderBottomWidth: 0 },
  guiaAtiva: { backgroundColor: cores.laranja, borderColor: cores.laranjaEscuro },
  guiaTexto: { fontFamily: fontes.pixel, fontSize: 10, color: cores.texto },
  conteudo: { padding: espaco.md, gap: espaco.sm + 2, paddingBottom: espaco.xl },
  resumo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: espaco.md,
    backgroundColor: cores.superficie,
    borderWidth: 3,
    borderColor: cores.borda,
  },
  resumoTitulo: { fontFamily: fontes.monoNegrito, color: cores.texto, fontSize: 13 },
  linhaTempo: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  tempo: { fontFamily: fontes.mono, color: cores.textoSuave, fontSize: 11 },
  secao: { fontFamily: fontes.mono, color: cores.textoSuave, fontSize: 11, letterSpacing: 2, marginTop: espaco.sm },
  info: { fontFamily: fontes.texto, color: cores.textoSuave, fontSize: 14, textAlign: 'center', marginTop: espaco.lg },
  nota: { fontFamily: fontes.texto, color: cores.textoApagado, fontSize: 11, lineHeight: 16, marginTop: espaco.sm },
});
