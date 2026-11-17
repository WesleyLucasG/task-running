import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Avatar } from '../../db/jogo';
import type { FaseCatalogo } from '../../domain/fases';
import { Estado, Inimigo, progressoDaVolta } from '../../domain/idle';
import { cores, espaco, fontes } from '../../theme';
import { AvatarPixel } from '../AvatarPixel';

const JANELA = 30; // unidades do mundo visíveis na tela
const ALTURA = 210;
const CHAO = 44; // altura da faixa de chão

type Props = { estado: Estado; fase: FaseCatalogo; avatar: Avatar; vidaMaxHeroi: number };

// Cena da esteira idle (Figma "Combate", quadro superior): cenário com rolagem lateral,
// herói à esquerda, monstros chegando pela direita, vida sobre as cabeças,
// números de dano e a barra "Progresso da fase" embaixo.
export function Esteira({ estado, fase, avatar, vidaMaxHeroi }: Props) {
  const [largura, setLargura] = useState(320);
  const ppu = largura / JANELA;
  const heroiX = largura * 0.22;
  const xDe = (pos: number) => heroiX + (pos - estado.pos) * ppu;

  const andando = estado.modo === 'ANDANDO';
  const pulo = andando && Math.floor(estado.tempo / 150) % 2 === 0 ? -3 : 0;
  const investida = estado.tempo - estado.ultimoGolpe < 140 ? 8 : 0;

  // Faixas do chão rolam com o herói; morros rolam mais devagar (paralaxe)
  const tile = 40;
  const deslocChao = -((estado.pos * ppu) % tile);
  const deslocMorro = -((estado.pos * ppu * 0.4) % 120);
  const pct = Math.round(progressoDaVolta(estado) * 100);

  return (
    <View style={estilos.moldura}>
      <View
        style={[estilos.cena, { backgroundColor: fase.cenario.ceu }]}
        onLayout={(e) => setLargura(e.nativeEvent.layout.width)}>
        {/* Morros ao fundo */}
        <View style={[estilos.camada, { left: deslocMorro }]}>
          {Array.from({ length: Math.ceil(largura / 120) + 2 }, (_, i) => (
            <View
              key={i}
              style={[estilos.morro, { left: i * 120, backgroundColor: fase.cenario.horizonte }]}
            />
          ))}
        </View>

        {/* Chão */}
        <View style={[estilos.chao, { backgroundColor: fase.cenario.chao }]}>
          {Array.from({ length: Math.ceil(largura / tile) + 2 }, (_, i) => (
            <View key={i} style={[estilos.ladrilho, { left: deslocChao + i * tile }]} />
          ))}
        </View>

        {/* Monstros e chefe */}
        {estado.inimigos
          .filter((i) => i.vida > 0 && xDe(i.pos) > -60 && xDe(i.pos) < largura + 60)
          .map((i) => (
            <Monstro
              key={i.id}
              inimigo={i}
              x={xDe(i.pos)}
              emoji={i.chefe ? fase.chefe.emoji : fase.monstro.emoji}
              nome={i.chefe ? fase.chefe.nome : undefined}
              atingido={estado.textos.some((t) => t.alvo === i.id && estado.tempo - t.criadoEm < 150)}
            />
          ))}

        {/* Herói */}
        <View style={[estilos.entidade, { left: heroiX - 18 + investida, bottom: CHAO - 4 + -pulo }]}>
          <BarraVida atual={estado.vida} maximo={vidaMaxHeroi} cor="#22C55E" largura={40} />
          <View style={estado.modo === 'MORTO' && { opacity: 0.3, transform: [{ rotate: '90deg' }] }}>
            <AvatarPixel
              genero={avatar.genero}
              cabelo={avatar.cabelo}
              corPele={avatar.corPele}
              corRoupa={avatar.corRoupa}
              tamanho={34}
            />
          </View>
        </View>

        {/* Números de dano */}
        {estado.textos.map((t) => {
          const idade = estado.tempo - t.criadoEm;
          const alvo = t.alvo === 'heroi' ? null : estado.inimigos.find((i) => i.id === t.alvo);
          const x = t.alvo === 'heroi' ? heroiX : alvo ? xDe(alvo.pos) : heroiX;
          return (
            <Text
              key={t.id}
              style={[
                estilos.dano,
                {
                  left: x - 14,
                  bottom: CHAO + 70 + idade * 0.05,
                  opacity: Math.max(0, 1 - idade / 900),
                  color: t.alvo === 'heroi' ? '#F87171' : cores.douradoClaro,
                },
              ]}>
              -{t.valor}
            </Text>
          );
        })}

        {/* Rótulos */}
        <Text style={estilos.nomeFase}>{fase.nome.toUpperCase()}</Text>
        <Text style={estilos.selo}>FASE {fase.numero}</Text>
        <Aviso estado={estado} />

        {/* Progresso da fase (Figma) */}
        <View style={estilos.progresso}>
          <View style={estilos.linhaProgresso}>
            <Text style={estilos.rotuloProgresso}>Progresso da fase</Text>
            <Text style={estilos.rotuloProgresso}>{pct}%</Text>
          </View>
          <View style={estilos.trilho}>
            <View style={[estilos.preenchido, { width: `${pct}%` }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

function Monstro({
  inimigo,
  x,
  emoji,
  nome,
  atingido,
}: {
  inimigo: Inimigo;
  x: number;
  emoji: string;
  nome?: string;
  atingido: boolean;
}) {
  const tamanho = inimigo.chefe ? 46 : 30;
  return (
    <View style={[estilos.entidade, { left: x - tamanho / 2 + (atingido ? 4 : 0), bottom: CHAO - 4 }]}>
      {nome && <Text style={estilos.nomeChefe}>{nome}</Text>}
      <BarraVida
        atual={inimigo.vida}
        maximo={inimigo.vidaMax}
        cor="#EF4444"
        largura={inimigo.chefe ? 64 : 36}
      />
      <Text style={{ fontSize: tamanho, opacity: atingido ? 0.6 : 1, transform: [{ scaleX: -1 }] }}>{emoji}</Text>
    </View>
  );
}

function BarraVida({ atual, maximo, cor, largura }: { atual: number; maximo: number; cor: string; largura: number }) {
  const pct = maximo > 0 ? Math.max(0, Math.min(1, atual / maximo)) : 0;
  return (
    <View style={[estilos.vida, { width: largura }]}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: cor }} />
    </View>
  );
}

const AVISOS: Partial<Record<Estado['modo'], { texto: string; cor: string }>> = {
  MORTO: { texto: 'DERROTADO! RECOMEÇANDO...', cor: cores.erro },
  SELADO: { texto: 'CHEFE SELADO', cor: cores.douradoClaro },
  RECUO: { texto: 'ENERGIA DIVINA ESGOTADA', cor: cores.douradoClaro },
  VITORIA: { texto: 'VITÓRIA!', cor: cores.sucesso },
};

function Aviso({ estado }: { estado: Estado }) {
  const a = AVISOS[estado.modo];
  if (!a) return null;
  return (
    <View style={estilos.aviso}>
      <Text style={[estilos.avisoTexto, { color: a.cor }]}>{a.texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  moldura: { borderWidth: 3, borderColor: cores.borda, backgroundColor: cores.superficie, padding: espaco.md },
  cena: { height: ALTURA, overflow: 'hidden', borderWidth: 2, borderColor: cores.fundoProfundo },
  camada: { position: 'absolute', top: 0, bottom: 0, width: 4000 },
  morro: {
    position: 'absolute',
    bottom: CHAO - 2,
    width: 150,
    height: 70,
    borderTopLeftRadius: 75,
    borderTopRightRadius: 75,
    opacity: 0.6,
  },
  chao: { position: 'absolute', left: 0, right: 0, bottom: 0, height: CHAO, borderTopWidth: 3, borderTopColor: '#0006' },
  ladrilho: { position: 'absolute', top: 8, width: 18, height: 4, backgroundColor: '#0003' },
  entidade: { position: 'absolute', alignItems: 'center', gap: 2 },
  vida: { height: 5, backgroundColor: '#0F172ACC', borderWidth: 1, borderColor: '#000', overflow: 'hidden' },
  nomeChefe: { fontFamily: fontes.monoNegrito, fontSize: 9, color: cores.texto },
  dano: { position: 'absolute', fontFamily: fontes.pixel, fontSize: 11, width: 40, textAlign: 'center' },
  nomeFase: {
    position: 'absolute',
    top: 6,
    left: 8,
    fontFamily: fontes.mono,
    fontSize: 10,
    color: cores.texto,
    backgroundColor: '#0F172AAA',
    paddingHorizontal: 4,
  },
  selo: {
    position: 'absolute',
    top: 6,
    right: 8,
    fontFamily: fontes.monoNegrito,
    fontSize: 10,
    color: cores.dourado,
    borderWidth: 1,
    borderColor: cores.dourado,
    paddingHorizontal: 4,
    backgroundColor: '#0F172AAA',
  },
  aviso: { position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center' },
  avisoTexto: {
    fontFamily: fontes.pixel,
    fontSize: 11,
    backgroundColor: '#0F172ADD',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  progresso: { position: 'absolute', left: 8, right: 8, bottom: 6, gap: 3 },
  linhaProgresso: { flexDirection: 'row', justifyContent: 'space-between' },
  rotuloProgresso: { fontFamily: fontes.textoMedio, fontSize: 10, color: cores.texto },
  trilho: { height: 7, backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#000' },
  preenchido: { height: '100%', backgroundColor: cores.laranja },
});
