import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Botao } from '../../components/Botao';
import { CabecalhoJogo } from '../../components/CabecalhoJogo';
import { iniciarAtividade } from '../../db/atividades';
import { EstadoMapa, obterEstadoMapa, Situacao } from '../../db/fases';
import { concluirAtividadeComRecompensa } from '../../db/jogo';
import type { FaseCatalogo } from '../../domain/fases';
import { calcularPace, estimarCalorias } from '../../domain/geo';
import { POSICOES_MONSTROS } from '../../domain/idle';
import { sincronizarPendentes } from '../../services/sincronizacao';
import { useAuth } from '../../state/AuthContext';
import { avisarJogadorAlterado } from '../../state/sinais';
import { cores, espaco, fontes } from '../../theme';

// Rótulos de bioma em inglês, como no Figma ("FOREST • 5 MONSTROS")
const BIOMA = ['FOREST', 'MOUNTAIN', 'DESERT', 'RUINS', 'OCEAN'];

const TAG: Record<Situacao, { texto: string; fundo: string; cor: string }> = {
  CONCLUIDA: { texto: 'CONCLUÍDO', fundo: cores.dourado, cor: cores.fundo },
  ATUAL: { texto: 'EXPLORANDO', fundo: cores.laranja, cor: cores.texto },
  BLOQUEADA: { texto: 'BLOQUEADO', fundo: cores.borda, cor: cores.textoSuave },
};

const km = (m: number) => (m / 1000).toFixed(1).replace('.', ',');

// Figma "Mapa Mundi" (3:3238). RF20: progressão em mapa temático; RF21: meta libera o chefe.
export default function Mapa() {
  const { usuario } = useAuth();
  const [estado, setEstado] = useState<EstadoMapa | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setEstado(await obterEstadoMapa(usuario.id));
  }, [usuario]);

  useFocusEffect(
    useCallback(() => {
      carregar().catch(() => {});
    }, [carregar]),
  );

  // MODO DEMONSTRAÇÃO (só em desenvolvimento): usa o mesmo caminho das atividades reais
  async function simular(metros: number) {
    if (!usuario || ocupado) return;
    setOcupado(true);
    try {
      const duracao = Math.round(metros / 2.5);
      const fim = new Date();
      const inicio = new Date(fim.getTime() - duracao * 1000);
      const id = await iniciarAtividade(usuario.id, 'CAMINHADA', inicio);
      await concluirAtividadeComRecompensa(id, usuario.id, {
        dataFim: fim,
        duracaoSegundos: duracao,
        distanciaMetros: metros,
        calorias: estimarCalorias(usuario.peso, metros, 'CAMINHADA'),
        paceMedio: calcularPace(metros, duracao),
      });
      await sincronizarPendentes(usuario.id); // RN11(b): conta só depois de sincronizada
      await carregar();
      avisarJogadorAlterado();
    } catch (e) {
      Alert.alert('Erro na demonstração', e instanceof Error ? e.message : String(e));
    } finally {
      setOcupado(false);
    }
  }

  const fases = estado?.fases ?? [];
  const concluidas = fases.filter((f) => f.situacao === 'CONCLUIDA').length;
  const atual = estado?.atual ?? null;
  const parcial = atual ? Math.min(1, atual.acumuladaMetros / atual.fase.metaDistanciaMetros) : 0;
  const exploracao = fases.length ? Math.round(((concluidas + (atual ? parcial * 0.5 : 0)) / fases.length) * 100) : 0;

  return (
    <View style={estilos.raiz}>
      <CabecalhoJogo titulo="MAPA MUNDI" />
      <ScrollView contentContainerStyle={estilos.conteudo}>
        {/* Banner "Terras de Gaia": faixas com as cores de cada região
            PENDENTE: trocar pela ilustração do Figma em assets/images/mapa-gaia.png */}
        <View style={estilos.banner}>
          <View style={estilos.faixas}>
            {fases.map(({ fase }) => (
              <View key={fase.numero} style={{ flex: 1, backgroundColor: fase.cenario.horizonte }}>
                <View style={{ flex: 1, backgroundColor: fase.cenario.ceu, opacity: 0.6 }} />
                <View style={{ height: '35%', backgroundColor: fase.cenario.chao }} />
              </View>
            ))}
          </View>
          <View style={estilos.bannerTexto}>
            <Text style={estilos.titulo}>TERRAS DE GAIA</Text>
            <View style={estilos.linhaBanner}>
              <Text style={estilos.areas}>
                {concluidas}/{fases.length} Áreas
              </Text>
              <Text style={estilos.exploracao}>EXPLORAÇÃO: {exploracao}%</Text>
            </View>
          </View>
        </View>

        <View style={estilos.detectados}>
          <Ionicons name="skull-outline" size={14} color={cores.laranja} />
          <Text style={estilos.textoDetectados}>MONSTROS DETECTADOS</Text>
        </View>

        {fases.map(({ fase, situacao }, i) => (
          <CartaoFase
            key={fase.numero}
            fase={fase}
            situacao={situacao}
            bioma={BIOMA[i] ?? 'UNKNOWN'}
            atual={situacao === 'ATUAL' ? atual : null}
          />
        ))}

        <View style={estilos.fronteira}>
          <View style={estilos.iconeFronteira}>
            <Ionicons name="location-outline" size={28} color={cores.textoSuave} />
          </View>
          <Text style={estilos.tituloFronteira}>FRONTEIRA DESCONHECIDA</Text>
          <Text style={estilos.textoFronteira}>
            Continue treinando no mundo real para desbloquear novas regiões e enfrentar desafios.
          </Text>
          <Botao titulo="INICIAR CORRIDA DE TREINO" onPress={() => router.push('/corrida')} estilo={{ alignSelf: 'stretch' }} />
        </View>

        {__DEV__ && (
          <View style={estilos.demo}>
            <Text style={estilos.textoDetectados}>MODO DEMONSTRAÇÃO (ATIVIDADE SIMULADA)</Text>
            <View style={{ flexDirection: 'row', gap: espaco.md }}>
              <Botao titulo="+1 KM" variante="contorno" carregando={ocupado} onPress={() => simular(1000)} estilo={{ flex: 1 }} />
              <Botao titulo="+3 KM" variante="contorno" carregando={ocupado} onPress={() => simular(3000)} estilo={{ flex: 1 }} />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function CartaoFase({
  fase,
  situacao,
  bioma,
  atual,
}: {
  fase: FaseCatalogo;
  situacao: Situacao;
  bioma: string;
  atual: EstadoMapa['atual'];
}) {
  const tag = TAG[situacao];
  const bloqueada = situacao === 'BLOQUEADA';
  const pct = atual ? Math.min(1, atual.acumuladaMetros / fase.metaDistanciaMetros) : 0;

  return (
    <View style={[estilos.cartao, situacao === 'ATUAL' && { borderColor: cores.laranja }]}>
      {/* Cena da fase: cores do cenário, monstro e chefe (cadeado se bloqueada) */}
      <View style={[estilos.cena, { backgroundColor: bloqueada ? cores.fundo : fase.cenario.ceu }]}>
        {!bloqueada && <View style={[estilos.chaoCena, { backgroundColor: fase.cenario.chao }]} />}
        {bloqueada ? (
          <Ionicons name="lock-closed-outline" size={30} color={cores.textoSuave} />
        ) : (
          <Text style={estilos.criaturas}>
            {fase.monstro.emoji}  {fase.chefe.emoji}
          </Text>
        )}
        <Text style={[estilos.tag, { backgroundColor: tag.fundo, color: tag.cor }]}>{tag.texto}</Text>
        {bloqueada && <Text style={estilos.meta}>META {km(fase.metaDistanciaMetros)} KM</Text>}
      </View>

      <View style={estilos.corpo}>
        <View style={estilos.linhaNome}>
          <Text style={[estilos.nome, bloqueada && { color: cores.textoSuave }]}>{fase.nome.toUpperCase()}</Text>
          {situacao === 'ATUAL' && (
            <Pressable style={estilos.seta} onPress={() => router.push('/')} accessibilityLabel={`Ir para ${fase.nome}`}>
              <Ionicons name="chevron-forward" size={16} color={cores.laranja} />
            </Pressable>
          )}
        </View>
        <Text style={estilos.bioma}>
          {bioma} • {POSICOES_MONSTROS.length} MONSTROS + CHEFE
        </Text>
        <Text style={estilos.descricao}>&quot;{fase.descricao}&quot;</Text>

        {atual && (
          <View style={{ gap: 4 }}>
            <View style={estilos.linhaNome}>
              <Text style={estilos.rotuloMeta}>
                {atual.chefeLiberado ? `${fase.chefe.nome.toUpperCase()} LIBERADO` : 'META PARA O CHEFE'}
              </Text>
              <Text style={estilos.rotuloMeta}>
                {km(atual.acumuladaMetros)} / {km(fase.metaDistanciaMetros)} km
              </Text>
            </View>
            <View style={estilos.trilho}>
              <View style={[estilos.preenchido, { width: `${pct * 100}%` }]} />
            </View>
            {atual.chefeLiberado && (
              <Text style={estilos.vidaChefe}>
                Vida do chefe: {atual.vidaAtualChefe}/{fase.chefe.vidaMaxima}
              </Text>
            )}
          </View>
        )}

        <View style={estilos.rodapeCartao}>
          <Text style={estilos.info}>⚔ COMBATE</Text>
          <Text style={estilos.info}>🏆 RECOMPENSA: BAÚ OURO</Text>
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.md, gap: espaco.md, paddingBottom: espaco.xl },
  banner: { height: 150, borderWidth: 2, borderColor: cores.borda, overflow: 'hidden' },
  faixas: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row' },
  bannerTexto: { flex: 1, justifyContent: 'flex-end', padding: espaco.md, gap: 6, backgroundColor: '#0F172A55' },
  titulo: {
    fontFamily: fontes.pixel,
    color: cores.texto,
    fontSize: 18,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  linhaBanner: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  areas: {
    fontFamily: fontes.monoNegrito,
    fontSize: 11,
    color: cores.fundo,
    backgroundColor: cores.dourado,
    paddingHorizontal: 6,
  },
  exploracao: { fontFamily: fontes.monoNegrito, fontSize: 11, color: cores.texto },
  detectados: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: espaco.sm,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  textoDetectados: { fontFamily: fontes.mono, color: cores.textoSuave, fontSize: 10, letterSpacing: 1 },
  cartao: { borderWidth: 3, borderColor: cores.borda, backgroundColor: cores.superficie },
  cena: { height: 110, alignItems: 'center', justifyContent: 'center' },
  chaoCena: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 30 },
  criaturas: { fontSize: 38 },
  tag: {
    position: 'absolute',
    top: espaco.sm,
    right: espaco.sm,
    fontFamily: fontes.monoNegrito,
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  meta: {
    position: 'absolute',
    bottom: espaco.sm,
    left: espaco.sm,
    fontFamily: fontes.monoNegrito,
    fontSize: 9,
    color: cores.texto,
    backgroundColor: cores.laranjaEscuro,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  corpo: { padding: espaco.md, gap: 6 },
  linhaNome: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nome: { fontFamily: fontes.textoNegrito, color: cores.texto, fontSize: 16 },
  seta: { borderWidth: 2, borderColor: cores.laranja, padding: 2 },
  bioma: { fontFamily: fontes.mono, color: cores.textoSuave, fontSize: 10, letterSpacing: 1 },
  descricao: { fontFamily: fontes.texto, fontStyle: 'italic', color: cores.textoSuave, fontSize: 12 },
  rotuloMeta: { fontFamily: fontes.mono, color: cores.texto, fontSize: 10 },
  trilho: { height: 8, backgroundColor: cores.fundo, borderWidth: 1, borderColor: cores.borda },
  preenchido: { height: '100%', backgroundColor: cores.laranja },
  vidaChefe: { fontFamily: fontes.mono, color: cores.erro, fontSize: 10 },
  rodapeCartao: {
    flexDirection: 'row',
    gap: espaco.md,
    paddingTop: espaco.sm,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
  },
  info: { fontFamily: fontes.textoNegrito, color: cores.texto, fontSize: 10 },
  fronteira: { alignItems: 'center', gap: espaco.sm, paddingVertical: espaco.lg },
  iconeFronteira: { borderWidth: 2, borderColor: cores.bordaClara, padding: espaco.md },
  tituloFronteira: { fontFamily: fontes.textoNegrito, color: cores.texto, fontSize: 14 },
  textoFronteira: { fontFamily: fontes.texto, color: cores.textoSuave, fontSize: 12, textAlign: 'center' },
  demo: { gap: espaco.sm, padding: espaco.md, borderWidth: 1, borderStyle: 'dashed', borderColor: cores.bordaClara },
});
