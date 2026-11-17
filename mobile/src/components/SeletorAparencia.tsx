import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CABELOS, CORES_ROUPA, GENEROS, TONS_PELE } from '../domain/avatar';
import type { Avatar } from '../db/jogo';
import { cores, espaco, fontes } from '../theme';

export type Aparencia = Pick<Avatar, 'genero' | 'cabelo' | 'corPele' | 'corRoupa'>;

// Linhas "Estilo de Cabelo  <  2  >" do Figma (Criação de Personagem).
// RF11: gênero, cabelo, tom de pele e cor das roupas.
export function SeletorAparencia({ valor, aoMudar }: { valor: Aparencia; aoMudar: (a: Aparencia) => void }) {
  const cabelo = CABELOS.findIndex((c) => c.valor === valor.cabelo);
  const traje = CORES_ROUPA.indexOf(valor.corRoupa);
  const genero = GENEROS.findIndex((g) => g.valor === valor.genero);
  const pele = TONS_PELE.indexOf(valor.corPele);

  return (
    <View style={{ gap: espaco.md }}>
      <Linha
        rotulo="Estilo de Cabelo"
        indice={cabelo}
        total={CABELOS.length}
        aoMudar={(i) => aoMudar({ ...valor, cabelo: CABELOS[i].valor })}
      />
      <Linha
        rotulo="Cor do Traje"
        indice={traje}
        total={CORES_ROUPA.length}
        amostra={valor.corRoupa}
        aoMudar={(i) => aoMudar({ ...valor, corRoupa: CORES_ROUPA[i] })}
      />
      <Linha
        rotulo="Tom de Pele"
        indice={pele}
        total={TONS_PELE.length}
        amostra={valor.corPele}
        aoMudar={(i) => aoMudar({ ...valor, corPele: TONS_PELE[i] })}
      />
      <Linha
        rotulo="Genero"
        indice={genero}
        total={GENEROS.length}
        aoMudar={(i) => aoMudar({ ...valor, genero: GENEROS[i].valor })}
      />
    </View>
  );
}

function Linha({
  rotulo,
  indice,
  total,
  amostra,
  aoMudar,
}: {
  rotulo: string;
  indice: number;
  total: number;
  amostra?: string;
  aoMudar: (i: number) => void;
}) {
  const atual = Math.max(0, indice);
  const ir = (passo: number) => aoMudar((atual + passo + total) % total);
  return (
    <View style={estilos.linha}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      {amostra && <View style={[estilos.amostra, { backgroundColor: amostra }]} />}
      <Seta icone="chevron-back" aoTocar={() => ir(-1)} rotulo={`${rotulo} anterior`} />
      <Text style={estilos.numero}>{atual + 1}</Text>
      <Seta icone="chevron-forward" aoTocar={() => ir(1)} rotulo={`Próximo ${rotulo}`} />
    </View>
  );
}

function Seta({ icone, aoTocar, rotulo }: { icone: 'chevron-back' | 'chevron-forward'; aoTocar: () => void; rotulo: string }) {
  return (
    <Pressable style={estilos.seta} onPress={aoTocar} accessibilityLabel={rotulo} hitSlop={6}>
      <Ionicons name={icone} size={18} color={cores.texto} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    paddingHorizontal: espaco.md,
    paddingVertical: 12,
    backgroundColor: cores.superficie,
    borderWidth: 2,
    borderColor: cores.borda,
  },
  rotulo: { flex: 1, fontFamily: fontes.textoMedio, color: cores.textoSuave, fontSize: 14 },
  amostra: { width: 18, height: 18, borderWidth: 2, borderColor: cores.texto },
  seta: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.fundo,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  numero: { fontFamily: fontes.textoNegrito, color: cores.texto, fontSize: 15, minWidth: 18, textAlign: 'center' },
});
