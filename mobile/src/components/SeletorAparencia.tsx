import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  cabelosDoGenero,
  CORES_CABELO,
  CORES_ROUPA,
  DETALHES_ROUPA,
  GENEROS,
  TONS_PELE,
} from '../domain/avatar';
import type { Avatar } from '../db/jogo';
import { cores, espaco, fontes } from '../theme';

export type Aparencia = Pick<Avatar, 'genero' | 'cabelo' | 'corPele' | 'corRoupa' | 'corCabelo' | 'detalheRoupa'>;

// Linhas "Estilo de Cabelo  <  2  >" do Figma (Criação de Personagem).
// RF11: gênero, cabelo (3 masculinos + 3 femininos e cor), tom de pele, cor e detalhe da roupa.
export function SeletorAparencia({ valor, aoMudar }: { valor: Aparencia; aoMudar: (a: Aparencia) => void }) {
  const estilos = cabelosDoGenero(valor.genero);
  const cabelo = estilos.findIndex((c) => c.valor === valor.cabelo);
  const genero = GENEROS.findIndex((g) => g.valor === valor.genero);

  // Ao trocar de gênero, o cabelo passa para o 1º estilo daquele gênero se o atual não existir nele
  const mudarGenero = (i: number) => {
    const novo = GENEROS[i].valor;
    const lista = cabelosDoGenero(novo);
    aoMudar({ ...valor, genero: novo, cabelo: lista.some((c) => c.valor === valor.cabelo) ? valor.cabelo : lista[0].valor });
  };

  return (
    <View style={{ gap: espaco.md }}>
      <Linha rotulo="Genero" indice={genero} total={GENEROS.length} aoMudar={mudarGenero} />
      <Linha
        rotulo="Estilo de Cabelo"
        detalhe={estilos[Math.max(0, cabelo)]?.rotulo}
        indice={cabelo}
        total={estilos.length}
        aoMudar={(i) => aoMudar({ ...valor, cabelo: estilos[i].valor })}
      />
      <Linha
        rotulo="Cor do Cabelo"
        indice={CORES_CABELO.indexOf(valor.corCabelo)}
        total={CORES_CABELO.length}
        amostra={valor.corCabelo}
        aoMudar={(i) => aoMudar({ ...valor, corCabelo: CORES_CABELO[i] })}
      />
      <Linha
        rotulo="Tom de Pele"
        indice={TONS_PELE.indexOf(valor.corPele)}
        total={TONS_PELE.length}
        amostra={valor.corPele}
        aoMudar={(i) => aoMudar({ ...valor, corPele: TONS_PELE[i] })}
      />
      <Linha
        rotulo="Cor do Traje"
        indice={CORES_ROUPA.indexOf(valor.corRoupa)}
        total={CORES_ROUPA.length}
        amostra={valor.corRoupa}
        aoMudar={(i) => aoMudar({ ...valor, corRoupa: CORES_ROUPA[i] })}
      />
      <Linha
        rotulo="Detalhe do Traje"
        detalhe={DETALHES_ROUPA.find((d) => d.valor === valor.detalheRoupa)?.rotulo}
        indice={DETALHES_ROUPA.findIndex((d) => d.valor === valor.detalheRoupa)}
        total={DETALHES_ROUPA.length}
        aoMudar={(i) => aoMudar({ ...valor, detalheRoupa: DETALHES_ROUPA[i].valor })}
      />
    </View>
  );
}

function Linha({
  rotulo,
  detalhe,
  indice,
  total,
  amostra,
  aoMudar,
}: {
  rotulo: string;
  detalhe?: string;
  indice: number;
  total: number;
  amostra?: string;
  aoMudar: (i: number) => void;
}) {
  const atual = Math.max(0, indice);
  const ir = (passo: number) => aoMudar((atual + passo + total) % total);
  return (
    <View style={estilos.linha}>
      <View style={{ flex: 1 }}>
        <Text style={estilos.rotulo}>{rotulo}</Text>
        {detalhe && <Text style={estilos.detalhe}>{detalhe}</Text>}
      </View>
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
  rotulo: { fontFamily: fontes.textoMedio, color: cores.textoSuave, fontSize: 14 },
  detalhe: { fontFamily: fontes.mono, color: cores.dourado, fontSize: 11, marginTop: 2 },
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
