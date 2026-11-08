import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { BarraProgresso } from '../../components/BarraProgresso';
import { Botao } from '../../components/Botao';
import { Campo } from '../../components/Campo';
import { Tela } from '../../components/Tela';
import {
  ConfigLembrete,
  DiaHidratacao,
  historicoPorDia,
  obterConfig,
  registrarConsumo,
  salvarConfig,
  totalDoDia,
} from '../../db/hidratacao';
import { formatarDia } from '../../domain/datas';
import { agendarLembretes, cancelarLembretes, testarLembrete } from '../../services/lembretes';
import { useAuth } from '../../state/AuthContext';
import { cores, espaco, fontes, raio } from '../../theme';

const ATALHOS = [200, 300, 500];
const INTERVALOS = [1, 2, 3, 4];

export default function Hidratacao() {
  const { usuario } = useAuth();
  const meta = usuario?.metaAguaMl ?? 0;

  const [total, setTotal] = useState(0);
  const [historico, setHistorico] = useState<DiaHidratacao[]>([]);
  const [config, setConfig] = useState<ConfigLembrete>({ ativo: false, intervaloHoras: 2 });
  const [custom, setCustom] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setTotal(await totalDoDia(usuario.id));
    setHistorico(await historicoPorDia(usuario.id));
    setConfig(await obterConfig(usuario.id));
  }, [usuario]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  async function registrar(ml: number) {
    if (!usuario) return;
    setSalvando(true);
    try {
      const r = await registrarConsumo(usuario.id, ml, meta);
      let msg = `+${ml} ml registrados · +${r.xp} XP`;
      if (r.subiuNivel) msg += ` · Nível ${r.nivelDepois}!`;
      if (r.bauConcedido) msg += ' · Meta batida! Você ganhou um Baú Bronze.';
      setMensagem(msg);
      setCustom('');
      await carregar();
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  function adicionarPersonalizado() {
    registrar(Math.round(Number(custom.replace(',', '.'))));
  }

  async function alternarLembrete(ativo: boolean) {
    if (!usuario) return;
    const nova = { ...config, ativo };
    setConfig(nova);
    await salvarConfig(usuario.id, nova); // a escolha é gravada primeiro
    try {
      if (ativo) {
        const ok = await agendarLembretes(config.intervaloHoras);
        if (!ok) {
          const desfeita = { ...config, ativo: false };
          setConfig(desfeita);
          await salvarConfig(usuario.id, desfeita);
          Alert.alert(
            'Permissão necessária',
            'Ative as notificações do Expo Go nas configurações do celular.',
          );
        }
      } else {
        await cancelarLembretes();
      }
    } catch (e) {
      Alert.alert(
        'Lembrete salvo, mas não agendado',
        'Sua preferência foi guardada, porém este aparelho não conseguiu agendar a notificação.\n\n' +
          (e instanceof Error ? e.message : String(e)),
      );
    }
  }

  async function mudarIntervalo(horas: number) {
    if (!usuario) return;
    const nova = { ...config, intervaloHoras: horas };
    setConfig(nova);
    await salvarConfig(usuario.id, nova);
    if (!config.ativo) return;
    try {
      await agendarLembretes(horas);
    } catch (e) {
      Alert.alert(
        'Intervalo salvo, mas não agendado',
        e instanceof Error ? e.message : String(e),
      );
    }
  }

  async function testar() {
    try {
      const ok = await testarLembrete();
      Alert.alert(
        ok ? 'Teste agendado' : 'Permissão necessária',
        ok ? 'A notificação chega em 5 segundos.' : 'Ative as notificações do Expo Go.',
      );
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : String(e));
    }
  }

  const percentual = meta > 0 ? Math.min(100, Math.round((total / meta) * 100)) : 0;

  return (
    <Tela>
      <Text style={estilos.titulo}>ÁGUA</Text>

      <View style={estilos.cartao}>
        <Text style={estilos.grande}>
          {total}
          <Text style={estilos.unidade}> / {meta} ml</Text>
        </Text>
        <BarraProgresso progresso={meta > 0 ? total / meta : 0} cor={cores.sucesso} />
        <Text style={estilos.texto}>{percentual}% da meta de hoje</Text>
      </View>

      {!!mensagem && <Text style={estilos.mensagem}>{mensagem}</Text>}

      <Text style={estilos.subtitulo}>REGISTRAR</Text>
      <View style={estilos.linha}>
        {ATALHOS.map((ml) => (
          <Pressable
            key={ml}
            disabled={salvando}
            onPress={() => registrar(ml)}
            style={[estilos.atalho, salvando && { opacity: 0.6 }]}>
            <Text style={estilos.atalhoTexto}>+{ml} ml</Text>
          </Pressable>
        ))}
      </View>
      <Campo
        rotulo="Outra quantidade (ml)"
        value={custom}
        onChangeText={setCustom}
        keyboardType="number-pad"
        placeholder="250"
      />
      <Botao titulo="ADICIONAR" onPress={adicionarPersonalizado} carregando={salvando} />

      <Text style={estilos.subtitulo}>LEMBRETES</Text>
      <View style={estilos.cartao}>
        <View style={estilos.linhaEntre}>
          <Text style={estilos.texto}>Lembrar de beber água</Text>
          <Switch
            value={config.ativo}
            onValueChange={alternarLembrete}
            trackColor={{ false: cores.borda, true: cores.laranja }}
          />
        </View>
        <Text style={estilos.texto}>A cada quantas horas (entre 8h e 20h):</Text>
        <View style={estilos.linha}>
          {INTERVALOS.map((h) => (
            <Pressable
              key={h}
              onPress={() => mudarIntervalo(h)}
              style={[estilos.chip, config.intervaloHoras === h && estilos.chipAtivo]}>
              <Text style={[estilos.chipTexto, config.intervaloHoras === h && { color: cores.texto }]}>
                {h}h
              </Text>
            </Pressable>
          ))}
        </View>
        <Botao titulo="TESTAR LEMBRETE" variante="contorno" onPress={testar} />
      </View>

      <Text style={estilos.subtitulo}>HISTÓRICO</Text>
      {historico.length === 0 ? (
        <Text style={estilos.texto}>Nenhum registro ainda.</Text>
      ) : (
        historico.map((d) => (
          <View key={d.dia} style={estilos.itemHistorico}>
            <Text style={estilos.texto}>{formatarDia(d.dia)}</Text>
            <Text style={estilos.historicoValor}>
              {d.totalMl} ml{meta > 0 ? ` · ${Math.round((d.totalMl / meta) * 100)}%` : ''}
            </Text>
          </View>
        ))
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  titulo: { fontFamily: fontes.pixel, color: cores.laranja, fontSize: 16, marginTop: espaco.md },
  subtitulo: { fontFamily: fontes.pixel, color: cores.texto, fontSize: 12, marginTop: espaco.md },
  texto: { color: cores.textoSuave, fontSize: 14 },
  mensagem: { color: cores.sucesso, fontSize: 14, fontWeight: '700' },
  cartao: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: raio.lg,
    padding: espaco.lg,
    gap: espaco.sm,
  },
  grande: { fontFamily: fontes.pixel, color: cores.texto, fontSize: 28 },
  unidade: { fontSize: 12, color: cores.textoSuave },
  linha: { flexDirection: 'row', gap: espaco.sm, flexWrap: 'wrap' },
  linhaEntre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  atalho: {
    flex: 1,
    paddingVertical: espaco.md,
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.laranja,
    borderRadius: raio.md,
  },
  atalhoTexto: { fontFamily: fontes.pixel, color: cores.laranja, fontSize: 11 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  chipAtivo: { backgroundColor: cores.laranja, borderColor: cores.laranja },
  chipTexto: { color: cores.textoSuave, fontSize: 13 },
  itemHistorico: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.md,
    padding: espaco.md,
  },
  historicoValor: { color: cores.texto, fontSize: 14, fontWeight: '700' },
});