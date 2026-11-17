import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CabecalhoJogo } from '../components/CabecalhoJogo';
import { SpriteHermes } from '../components/Hermes';
import { Atributo, distribuirPonto, EstadoHabilidades, obterHabilidades } from '../db/habilidades';
import { ContextoIdle, obterContextoIdle } from '../db/heroi';
import { DANO_POR_PONTO_FORCA, PONTOS_POR_KM, VIDA_POR_PONTO_VITALIDADE } from '../domain/idle';
import { useAuth } from '../state/AuthContext';
import { cores, espaco, fontes } from '../theme';

const ATRIBUTOS: {
  chave: Atributo;
  nome: string;
  icone: keyof typeof Ionicons.glyphMap;
  efeito: string;
  cor: string;
}[] = [
  { chave: 'forca', nome: 'FORÇA', icone: 'flame-outline', efeito: `+${DANO_POR_PONTO_FORCA} de dano por golpe`, cor: cores.laranja },
  { chave: 'vitalidade', nome: 'VITALIDADE', icone: 'heart-outline', efeito: `+${VIDA_POR_PONTO_VITALIDADE} de vida máxima`, cor: cores.erro },
  { chave: 'velocidade', nome: 'VELOCIDADE', icone: 'flash-outline', efeito: '+5% na velocidade de ataque', cor: cores.dourado },
];

// Melhoria D15: pontos de habilidade ganhos a cada km real (abre pelo menu "Árvore de Atributos").
export default function Atributos() {
  const { usuario } = useAuth();
  const [hab, setHab] = useState<EstadoHabilidades | null>(null);
  const [ctx, setCtx] = useState<ContextoIdle | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    const [h, c] = await Promise.all([obterHabilidades(usuario.id), obterContextoIdle(usuario.id)]);
    setHab(h);
    setCtx(c);
  }, [usuario]);

  useFocusEffect(
    useCallback(() => {
      carregar().catch(() => {});
    }, [carregar]),
  );

  async function investir(a: Atributo) {
    if (!usuario || ocupado) return;
    setOcupado(true);
    try {
      await distribuirPonto(usuario.id, a);
      await carregar();
    } catch (e) {
      Alert.alert('Atributos', e instanceof Error ? e.message : String(e));
    } finally {
      setOcupado(false);
    }
  }

  const s = ctx?.contexto.heroi;
  const km = ((hab?.distanciaTotalMetros ?? 0) / 1000).toFixed(2);

  return (
    <View style={estilos.raiz}>
      <CabecalhoJogo titulo="ÁRVORE DE ATRIBUTOS" voltar />
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <View style={estilos.destaque}>
          <SpriteHermes pose="cajado" altura={96} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={estilos.rotulo}>PONTOS DISPONÍVEIS</Text>
            <Text style={estilos.pontos}>{hab?.disponiveis ?? 0}</Text>
            <Text style={estilos.texto}>
              Você ganha {PONTOS_POR_KM} pontos a cada km concluído. Total percorrido: {km} km ({hab?.ganhos ?? 0}{' '}
              pontos).
            </Text>
          </View>
        </View>

        {ATRIBUTOS.map((a) => (
          <View key={a.chave} style={[estilos.linha, { borderLeftColor: a.cor }]}>
            <View style={estilos.icone}>
              <Ionicons name={a.icone} size={22} color={a.cor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.nome}>{a.nome}</Text>
              <Text style={estilos.efeito}>{a.efeito}</Text>
            </View>
            <Text style={estilos.valor}>{hab?.[a.chave] ?? 0}</Text>
            <Pressable
              style={[estilos.mais, !hab?.disponiveis && estilos.maisInativo]}
              disabled={!hab?.disponiveis || ocupado}
              onPress={() => investir(a.chave)}
              accessibilityLabel={`Investir um ponto em ${a.nome}`}>
              <Ionicons name="add" size={22} color={cores.texto} />
            </Pressable>
          </View>
        ))}

        <View style={estilos.resumo}>
          <Text style={estilos.rotulo}>STATUS NA ESTEIRA</Text>
          <Linha rotulo="Dano por golpe" valor={`${s?.dano ?? 0}`} />
          <Linha rotulo="Vida máxima" valor={`${s?.vidaMax ?? 0}`} />
          <Linha rotulo="Golpes por segundo" valor={s ? (1000 / s.intervaloMs).toFixed(2) : '0'} />
          <Linha rotulo="Bônus de itens (força / vida)" valor={`+${ctx?.base.bonusForca ?? 0} / +${ctx?.base.bonusVida ?? 0}`} />
        </View>
      </ScrollView>
    </View>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={estilos.linhaResumo}>
      <Text style={estilos.texto}>{rotulo}</Text>
      <Text style={estilos.valorResumo}>{valor}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.md, gap: espaco.md },
  destaque: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    padding: espaco.md,
    backgroundColor: cores.superficie,
    borderWidth: 3,
    borderColor: cores.dourado,
  },
  rotulo: { fontFamily: fontes.mono, color: cores.laranja, fontSize: 11, letterSpacing: 2 },
  pontos: { fontFamily: fontes.pixel, color: cores.douradoClaro, fontSize: 28 },
  texto: { fontFamily: fontes.texto, color: cores.textoSuave, fontSize: 13, lineHeight: 18 },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    padding: espaco.md,
    backgroundColor: cores.superficie,
    borderLeftWidth: 4,
  },
  icone: { borderWidth: 1, borderColor: cores.bordaClara, padding: 6 },
  nome: { fontFamily: fontes.textoNegrito, color: cores.texto, fontSize: 15 },
  efeito: { fontFamily: fontes.texto, color: cores.textoSuave, fontSize: 12 },
  valor: { fontFamily: fontes.pixel, color: cores.texto, fontSize: 14, minWidth: 30, textAlign: 'center' },
  mais: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.laranja,
    borderBottomWidth: 3,
    borderBottomColor: cores.laranjaEscuro,
  },
  maisInativo: { backgroundColor: cores.borda, borderBottomColor: cores.fundoProfundo },
  resumo: {
    padding: espaco.md,
    gap: espaco.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: cores.bordaClara,
  },
  linhaResumo: { flexDirection: 'row', justifyContent: 'space-between' },
  valorResumo: { fontFamily: fontes.monoNegrito, color: cores.texto, fontSize: 13 },
});
