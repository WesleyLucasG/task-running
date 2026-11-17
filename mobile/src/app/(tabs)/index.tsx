import { Ionicons } from '@expo/vector-icons';
import { Href, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AvatarPixel } from '../../components/AvatarPixel';
import { CabecalhoJogo } from '../../components/CabecalhoJogo';
import { BauPixel } from '../../components/BauPixel';
import { Esteira } from '../../components/jogo/Esteira';
import { RevelacaoItem } from '../../components/RevelacaoItem';
import { abrirBau } from '../../db/inventario';
import { ROTULO_BAU } from '../../domain/loja';
import { avisarJogadorAlterado } from '../../state/sinais';
import { BauEncontrado, useEsteira } from '../../state/useEsteira';
import { useJogador } from '../../state/useJogador';
import { cores, espaco, fontes } from '../../theme';

// HOME = layout do Figma "Combate" (3:3886, aba HOME ativa): cena da esteira idle,
// painel do herói (HP e Energia Divina), histórico de batalha e ações.
export default function Home() {
  const { usuario, avatar } = useJogador();
  const { info, estado, log, efeitos, bausEncontrados, removerBau, lendario, fecharLendario } = useEsteira();
  const [abrindo, setAbrindo] = useState<BauEncontrado | null>(null);
  const ultimoBau = bausEncontrados[bausEncontrados.length - 1];

  const pronto = !!(info && estado && avatar && info.fase);
  const heroi = info?.contexto.heroi;
  const chefe = info?.contexto.chefe;
  const energiaMax = chefe?.limiteDano ?? 0;
  const energia = Math.max(0, energiaMax - (estado?.confrontoAtivo ? estado.danoNoConfronto : 0));

  return (
    <View style={estilos.raiz}>
      <CabecalhoJogo titulo="COMBATE ATIVO" />
      <ScrollView contentContainerStyle={estilos.conteudo}>
        {pronto ? (
          <Esteira
            estado={estado!}
            fase={info!.fase!}
            avatar={avatar!}
            vidaMaxHeroi={heroi!.vidaMax}
            efeitos={efeitos}
          />
        ) : info && !info.fase ? (
          <View style={estilos.fim}>
            <Text style={estilos.fimTitulo}>TODAS AS TERRAS CONQUISTADAS!</Text>
          </View>
        ) : (
          <View style={estilos.carregando} />
        )}

        {ultimoBau && (
          <View style={estilos.faixaBau}>
            <BauPixel tipo={ultimoBau.tipo} tamanho={30} />
            <View style={{ flex: 1 }}>
              <Text style={estilos.faixaTitulo}>{ROTULO_BAU[ultimoBau.tipo].toUpperCase()} ENCONTRADO!</Text>
              <Text style={estilos.faixaSub}>
                {bausEncontrados.length > 1 ? `${bausEncontrados.length} baús nesta sessão · ` : ''}também ficam no Inventário
              </Text>
            </View>
            <Pressable style={estilos.faixaBotao} onPress={() => setAbrindo(ultimoBau)}>
              <Text style={estilos.faixaBotaoTexto}>ABRIR</Text>
            </Pressable>
          </View>
        )}

        <View style={estilos.painel}>
          <View style={estilos.linhaHeroi}>
            <View style={estilos.retrato}>
              {avatar && <AvatarPixel {...avatar} tamanho={22} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.nomeHeroi} numberOfLines={1}>
                {(usuario?.nome ?? 'HERÓI').toUpperCase()}
              </Text>
              <Text style={estilos.atributos}>
                ⚔ {heroi?.dano ?? 0}   ❤ {heroi?.vidaMax ?? 0}   ⚡ {heroi ? (1000 / heroi.intervaloMs).toFixed(1) : 0}/s
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={estilos.rotuloNivel}>NÍVEL</Text>
              <Text style={estilos.nivel}>{avatar?.nivel ?? 1}</Text>
            </View>
          </View>

          <Barra
            icone="heart-outline"
            rotulo="PONTOS DE VIDA (HP)"
            atual={estado?.vida ?? 0}
            maximo={heroi?.vidaMax ?? 1}
            cor={cores.laranja}
          />
          <Barra
            icone="flash-outline"
            rotulo="ENERGIA DIVINA (SP)"
            atual={energia}
            maximo={energiaMax}
            cor={cores.dourado}
          />
          <Text style={estilos.dica}>
            {chefe?.podeEnfrentar
              ? `Energia pronta: até ${energiaMax} de dano em ${info?.fase?.chefe.nome}.`
              : (chefe?.motivo ?? '')}
          </Text>
        </View>

        <View style={estilos.historico}>
          <View style={estilos.linhaHistorico}>
            <Ionicons name="information-circle-outline" size={14} color={cores.textoSuave} />
            <Text style={estilos.rotuloHistorico}>HISTÓRICO DE BATALHA</Text>
          </View>
          {log.map((linha, i) => (
            <Text key={`${i}-${linha}`} style={[estilos.linhaLog, i > 0 && { opacity: 0.6 }]}>
              {linha}
            </Text>
          ))}
        </View>

        <View style={estilos.grade}>
          <Acao
            icone="footsteps-outline"
            titulo="CORRER"
            subtitulo="Ganhe XP e energia"
            fundo={cores.laranja}
            destino="/corrida"
          />
          <Acao
            icone="flame-outline"
            titulo="ATRIBUTOS"
            subtitulo={`${info?.pontosDisponiveis ?? 0} pontos livres`}
            fundo={cores.dourado}
            destino="/atributos"
            alerta={(info?.pontosDisponiveis ?? 0) > 0}
          />
          <Acao icone="water-outline" titulo="HIDRATAÇÃO" subtitulo="Meta diária" destino="/hidratacao" />
          <Acao icone="time-outline" titulo="HISTÓRICO" subtitulo="Suas corridas" destino="/historico" />
        </View>
      </ScrollView>

      {/* Abertura do baú encontrado na esteira */}
      <RevelacaoItem
        visivel={!!abrindo}
        bau={abrindo?.tipo}
        abrir={async () => {
          // Sem "abrindo!.id": o React Compiler leria abrindo.id durante a renderização (abrindo = null)
          if (!abrindo || !usuario) throw new Error('Baú indisponível.');
          const id = abrindo.id;
          removerBau(id); // sai da faixa mesmo se já tiver sido aberto pelo Inventário
          const item = await abrirBau(usuario.id, id);
          avisarJogadorAlterado();
          return item;
        }}
        aoFechar={() => setAbrindo(null)}
      />
      {/* Bônus lendário do chefe (10%) */}
      <RevelacaoItem visivel={!!lendario} itemPronto={lendario} aoFechar={fecharLendario} />
    </View>
  );
}

function Barra({
  icone,
  rotulo,
  atual,
  maximo,
  cor,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  rotulo: string;
  atual: number;
  maximo: number;
  cor: string;
}) {
  const pct = maximo > 0 ? Math.max(0, Math.min(1, atual / maximo)) : 0;
  return (
    <View style={{ gap: 6 }}>
      <View style={estilos.linhaBarra}>
        <Ionicons name={icone} size={14} color={cores.texto} />
        <Text style={estilos.rotuloBarra}>{rotulo}</Text>
        <Text style={estilos.valorBarra}>
          {Math.round(atual)}/{maximo}
        </Text>
      </View>
      <View style={estilos.trilho}>
        <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: cor }} />
      </View>
    </View>
  );
}

function Acao({
  icone,
  titulo,
  subtitulo,
  fundo = cores.superficie,
  destino,
  alerta = false,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  titulo: string;
  subtitulo: string;
  fundo?: string;
  destino: Href;
  alerta?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [estilos.acao, { backgroundColor: fundo }, pressed && { opacity: 0.8 }]}
      onPress={() => router.push(destino)}>
      <Ionicons name={icone} size={24} color={cores.texto} />
      <Text style={estilos.tituloAcao}>{titulo}</Text>
      <Text style={estilos.subAcao}>{subtitulo}</Text>
      {alerta && <View style={estilos.alerta} />}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.md, gap: espaco.md },
  carregando: { height: 246, backgroundColor: cores.superficie, borderWidth: 3, borderColor: cores.borda },
  fim: {
    height: 246,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.superficie,
    borderWidth: 3,
    borderColor: cores.dourado,
  },
  fimTitulo: { fontFamily: fontes.pixel, color: cores.douradoClaro, fontSize: 11, textAlign: 'center' },
  faixaBau: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    padding: espaco.sm,
    paddingHorizontal: espaco.md,
    backgroundColor: '#422006',
    borderWidth: 2,
    borderColor: cores.dourado,
  },
  faixaTitulo: { fontFamily: fontes.monoNegrito, color: cores.douradoClaro, fontSize: 12 },
  faixaSub: { fontFamily: fontes.texto, color: cores.textoSuave, fontSize: 11 },
  faixaBotao: {
    backgroundColor: cores.laranja,
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.sm,
    borderBottomWidth: 3,
    borderBottomColor: cores.laranjaEscuro,
  },
  faixaBotaoTexto: { fontFamily: fontes.pixel, color: cores.texto, fontSize: 10 },
  painel: {
    padding: espaco.md,
    gap: espaco.md,
    backgroundColor: cores.superficie,
    borderWidth: 3,
    borderColor: cores.borda,
  },
  linhaHeroi: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  retrato: {
    width: 44,
    height: 44,
    borderWidth: 2,
    borderColor: cores.laranja,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.fundo,
  },
  nomeHeroi: { fontFamily: fontes.monoNegrito, color: cores.texto, fontSize: 13, letterSpacing: 1 },
  atributos: { fontFamily: fontes.mono, color: cores.textoSuave, fontSize: 11, marginTop: 2 },
  rotuloNivel: { fontFamily: fontes.mono, color: cores.textoSuave, fontSize: 9 },
  nivel: { fontFamily: fontes.pixel, color: cores.laranja, fontSize: 16 },
  linhaBarra: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rotuloBarra: { flex: 1, fontFamily: fontes.mono, color: cores.texto, fontSize: 11, letterSpacing: 1 },
  valorBarra: { fontFamily: fontes.mono, color: cores.texto, fontSize: 11 },
  trilho: { height: 14, backgroundColor: cores.fundo, borderWidth: 2, borderColor: cores.borda },
  dica: { fontFamily: fontes.texto, color: cores.textoSuave, fontSize: 12 },
  historico: {
    padding: espaco.md,
    gap: espaco.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: cores.bordaClara,
  },
  linhaHistorico: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: espaco.sm,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  rotuloHistorico: { fontFamily: fontes.mono, color: cores.textoSuave, fontSize: 10, letterSpacing: 1 },
  linhaLog: {
    fontFamily: fontes.mono,
    color: cores.douradoClaro,
    fontSize: 12,
    borderLeftWidth: 2,
    borderLeftColor: cores.dourado,
    paddingLeft: espaco.sm,
  },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  acao: {
    width: '48.5%',
    alignItems: 'center',
    gap: 4,
    paddingVertical: espaco.md,
    borderBottomWidth: 4,
    borderBottomColor: '#0006',
  },
  tituloAcao: { fontFamily: fontes.monoNegrito, color: cores.texto, fontSize: 13, letterSpacing: 1 },
  subAcao: { fontFamily: fontes.mono, color: cores.texto, fontSize: 10, opacity: 0.85 },
  alerta: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    backgroundColor: cores.erro,
    borderWidth: 1,
    borderColor: cores.texto,
  },
});
