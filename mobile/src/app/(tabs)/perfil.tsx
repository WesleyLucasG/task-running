import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AvatarPixel } from '../../components/AvatarPixel';
import { BarraProgresso } from '../../components/BarraProgresso';
import { Botao } from '../../components/Botao';
import { Estatistica } from '../../components/Estatistica';
import { Tela } from '../../components/Tela';
import { atualizarAparencia, Avatar, obterJogador } from '../../db/jogo';
import { CABELOS, CORES_ROUPA, GENEROS, TONS_PELE } from '../../domain/avatar';
import { multiplicadorAgilidade, xpParaProximoNivel } from '../../domain/jogo';
import { useAuth } from '../../state/AuthContext';
import { cores, espaco, fontes, raio } from '../../theme';

type Jogador = { avatar: Avatar; moedas: number };
type Aparencia = Partial<Pick<Avatar, 'genero' | 'cabelo' | 'corPele' | 'corRoupa'>>;

function Chips<T extends string>({
  rotulo,
  opcoes,
  valor,
  aoEscolher,
}: {
  rotulo: string;
  opcoes: { valor: T; rotulo: string }[];
  valor: T;
  aoEscolher: (v: T) => void;
}) {
  return (
    <View style={estilos.grupo}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <View style={estilos.linha}>
        {opcoes.map((o) => (
          <Pressable
            key={o.valor}
            onPress={() => aoEscolher(o.valor)}
            style={[estilos.chip, valor === o.valor && estilos.chipAtivo]}>
            <Text style={[estilos.chipTexto, valor === o.valor && { color: cores.texto }]}>
              {o.rotulo}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Paleta({
  rotulo,
  lista,
  valor,
  aoEscolher,
}: {
  rotulo: string;
  lista: string[];
  valor: string;
  aoEscolher: (v: string) => void;
}) {
  return (
    <View style={estilos.grupo}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <View style={estilos.linha}>
        {lista.map((cor) => (
          <Pressable
            key={cor}
            onPress={() => aoEscolher(cor)}
            style={[
              estilos.amostra,
              { backgroundColor: cor },
              valor === cor && { borderColor: cores.texto, borderWidth: 3 },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

export default function Perfil() {
  const { usuario, sair } = useAuth();
  const [jogador, setJogador] = useState<Jogador | null>(null);

  // Recarrega sempre que a aba volta a ficar visível (o XP pode ter mudado)
  useFocusEffect(
    useCallback(() => {
      if (usuario) obterJogador(usuario.id).then(setJogador);
    }, [usuario]),
  );

  async function mudar(parcial: Aparencia) {
    if (!usuario || !jogador) return;
    setJogador({ ...jogador, avatar: { ...jogador.avatar, ...parcial } });
    await atualizarAparencia(usuario.id, parcial);
  }

  if (!jogador) {
    return (
      <Tela>
        <Text style={estilos.titulo}>PERFIL</Text>
        <Text style={estilos.texto}>Carregando...</Text>
      </Tela>
    );
  }

  const a = jogador.avatar;
  const necessario = xpParaProximoNivel(a.nivel);
  const bonus = (multiplicadorAgilidade(a.agilidade) - 1) * 100;

  return (
    <Tela>
      <Text style={estilos.titulo}>PERFIL</Text>

      <View style={estilos.cartao}>
        <AvatarPixel
          genero={a.genero}
          cabelo={a.cabelo}
          corPele={a.corPele}
          corRoupa={a.corRoupa}
          tamanho={140}
        />
        <Text style={estilos.nome}>{usuario?.nome}</Text>
        <Text style={estilos.nivel}>NÍVEL {a.nivel}</Text>
        <View style={{ alignSelf: 'stretch', gap: espaco.xs }}>
          <BarraProgresso progresso={a.experiencia / necessario} />
          <Text style={estilos.texto}>
            {a.experiencia} / {necessario} XP
          </Text>
        </View>
        <Text style={estilos.moedas}>{jogador.moedas} MOEDAS</Text>
      </View>

      <View style={estilos.linha}>
        <Estatistica rotulo="FORÇA" valor={String(a.forcaBase)} />
        <Estatistica rotulo="AGILIDADE" valor={String(a.agilidade)} />
        <Estatistica rotulo="VIDA" valor={`${a.vidaAtual}/${a.vidaMaxima}`} />
      </View>
      <Text style={estilos.texto}>
        Bônus de agilidade: +{bonus.toFixed(1)}% de XP e moedas em cada atividade.
      </Text>

      <Text style={estilos.subtitulo}>PERSONALIZAR</Text>
      <View style={estilos.cartaoForm}>
        <Chips
          rotulo="Gênero"
          opcoes={GENEROS}
          valor={a.genero}
          aoEscolher={(genero) => mudar({ genero })}
        />
        <Chips
          rotulo="Cabelo"
          opcoes={CABELOS}
          valor={a.cabelo}
          aoEscolher={(cabelo) => mudar({ cabelo })}
        />
        <Paleta
          rotulo="Tom de pele"
          lista={TONS_PELE}
          valor={a.corPele}
          aoEscolher={(corPele) => mudar({ corPele })}
        />
        <Paleta
          rotulo="Cor da roupa"
          lista={CORES_ROUPA}
          valor={a.corRoupa}
          aoEscolher={(corRoupa) => mudar({ corRoupa })}
        />
      </View>

      <Text style={estilos.subtitulo}>CONTA</Text>
      <Text style={estilos.texto}>{usuario?.email}</Text>
      <Text style={estilos.texto}>Meta diária de água: {usuario?.metaAguaMl} ml</Text>
      <Botao titulo="SAIR" variante="contorno" onPress={sair} />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  titulo: { fontFamily: fontes.pixel, color: cores.laranja, fontSize: 16, marginTop: espaco.md },
  subtitulo: { fontFamily: fontes.pixel, color: cores.texto, fontSize: 12, marginTop: espaco.md },
  texto: { color: cores.textoSuave, fontSize: 14 },
  cartao: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: raio.lg,
    padding: espaco.lg,
    alignItems: 'center',
    gap: espaco.sm,
  },
  nome: { color: cores.texto, fontSize: 20, fontWeight: '700' },
  nivel: { fontFamily: fontes.pixel, color: cores.dourado, fontSize: 14 },
  moedas: { fontFamily: fontes.pixel, color: cores.dourado, fontSize: 12 },
  linha: { flexDirection: 'row', gap: espaco.sm, flexWrap: 'wrap' },
  cartaoForm: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: raio.lg,
    padding: espaco.md,
    gap: espaco.md,
  },
  grupo: { gap: espaco.sm },
  rotulo: { color: cores.textoSuave, fontSize: 13 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  chipAtivo: { backgroundColor: cores.laranja, borderColor: cores.laranja },
  chipTexto: { color: cores.textoSuave, fontSize: 13 },
  amostra: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: cores.borda },
});