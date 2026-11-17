import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { cores, espaco, fontes } from '../theme';
import { FundoPixel } from './FundoPixel';
import { LogoTR } from './LogoTR';

const DURACAO_MS = 1600;
const PASSO_MS = 40;

// Tela "Abertura" do Figma (3:2): logo, slogan e barra "CARREGANDO MUNDO".
// Exibida uma vez por abertura do app, depois que fontes e sessão já carregaram.
export function Abertura({ aoConcluir }: { aoConcluir: () => void }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const inicio = Date.now();
    const id = setInterval(() => {
      const p = Math.min(100, Math.round(((Date.now() - inicio) / DURACAO_MS) * 100));
      setPct(p);
      if (p >= 100) {
        clearInterval(id);
        setTimeout(aoConcluir, 150);
      }
    }, PASSO_MS);
    return () => clearInterval(id);
  }, [aoConcluir]);

  return (
    <FundoPixel>
      <View style={estilos.centro}>
        <LogoTR tamanho={200} />
        <Text style={estilos.slogan}>AVENTURE-SE E{'\n'}EVOLUA</Text>
        <View style={estilos.trilho} accessibilityRole="progressbar" accessibilityValue={{ now: pct, min: 0, max: 100 }}>
          <View style={[estilos.barra, { width: `${pct}%` }]} />
        </View>
        <Text style={estilos.carregando}>CARREGANDO MUNDO ...</Text>
        <Text style={estilos.pct}>{pct}%</Text>
      </View>
      <View style={estilos.rodape}>
        <Text style={estilos.copyright}>© 2026 TASK RUNNING ADVENTURE</Text>
        <View style={estilos.pontos}>
          <View style={[estilos.ponto, { backgroundColor: cores.laranja }]} />
          <View style={[estilos.ponto, { backgroundColor: cores.dourado }]} />
          <View style={[estilos.ponto, { backgroundColor: cores.textoSuave }]} />
        </View>
      </View>
    </FundoPixel>
  );
}

const estilos = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: espaco.md, paddingHorizontal: espaco.xl },
  slogan: {
    fontFamily: fontes.pixel,
    color: cores.douradoClaro,
    fontSize: 20,
    lineHeight: 30,
    textAlign: 'center',
    marginTop: espaco.lg,
    textShadowColor: cores.douradoEscuro,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  trilho: {
    alignSelf: 'stretch',
    height: 30,
    borderWidth: 2,
    borderColor: cores.texto,
    backgroundColor: cores.fundo,
    padding: 4,
    marginTop: espaco.xl,
  },
  barra: { height: '100%', backgroundColor: cores.laranja },
  carregando: { fontFamily: fontes.mono, color: cores.texto, fontSize: 12, letterSpacing: 2 },
  pct: { fontFamily: fontes.mono, color: cores.dourado, fontSize: 11 },
  rodape: { alignItems: 'center', gap: espaco.md, paddingBottom: espaco.xl },
  copyright: { fontFamily: fontes.mono, color: cores.textoApagado, fontSize: 10, letterSpacing: 1 },
  pontos: { flexDirection: 'row', gap: 8 },
  ponto: { width: 8, height: 8 },
});
