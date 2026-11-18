import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { cores, espaco, fontes, raio } from '../theme';

// RF14: mapa OpenStreetMap (Leaflet numa WebView).
// - Centraliza na posição atual com zoom de rua (17) e acompanha o usuário.
// - Se o usuário arrastar o mapa, para de seguir e aparece o botão de recentralizar.
// - Atribuição "© OpenStreetMap contributors" sempre visível (licença ODbL).
// - Sem internet, os blocos do mapa não carregam (a política do tile.openstreetmap.org não permite
//   download para uso offline); o app avisa e a corrida continua sendo gravada normalmente.
const HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#mapa{height:100%;margin:0;background:#0B1220;}
.leaflet-control-attribution{font-size:10px}</style>
</head>
<body>
<div id="mapa"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  function avisar(msg){ window.ReactNativeWebView && window.ReactNativeWebView.postMessage(msg); }
  if (typeof L === 'undefined') { avisar('sem-mapa'); }
  else {
    var mapa = L.map('mapa', { zoomControl: false });
    mapa.attributionControl.setPrefix(false);
    var camada = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapa);
    var falhas = 0;
    camada.on('tileerror', function(){ falhas++; if (falhas === 3) avisar('sem-blocos'); });
    camada.on('tileload', function(){ if (falhas > 0) { falhas = 0; avisar('blocos-ok'); } });
    var linha = L.polyline([], { color: '#F97316', weight: 5 }).addTo(mapa);
    var atual = null;
    var seguindo = true;
    var temVisao = false;
    mapa.on('dragstart', function(){ if (seguindo) { seguindo = false; avisar('parou-de-seguir'); } });

    function marcar(p){
      if (atual) atual.setLatLng(p);
      else atual = L.circleMarker(p, { radius: 8, color: '#ffffff', weight: 2, fillColor: '#F97316', fillOpacity: 1 }).addTo(mapa);
    }
    window.posicionar = function(p){
      marcar(p);
      if (!temVisao || seguindo) { mapa.setView(p, 17); temVisao = true; }
    };
    window.recentrar = function(){
      seguindo = true;
      if (atual) mapa.setView(atual.getLatLng(), 17);
    };
    window.atualizar = function(pts, seguir){
      linha.setLatLngs(pts);
      if (pts.length === 0) { if (!temVisao) { mapa.setView([-14.2, -51.9], 4); } return; }
      var ultimo = pts[pts.length - 1];
      marcar(ultimo);
      if (seguir) {
        if (!temVisao) { mapa.setView(ultimo, 17); temVisao = true; }
        else if (seguindo) { mapa.panTo(ultimo); }
      } else if (pts.length > 1) {
        mapa.fitBounds(linha.getBounds(), { padding: [24, 24] }); temVisao = true;
      } else {
        mapa.setView(ultimo, 16); temVisao = true;
      }
    };
  }
</script>
</body>
</html>`;

type Props = {
  pontos: [number, number][];
  seguir?: boolean;
  posicaoAtual?: [number, number] | null; // posição antes do primeiro ponto (centraliza no usuário)
  style?: StyleProp<ViewStyle>;
};

export function MapaOSM({ pontos, seguir = false, posicaoAtual = null, style }: Props) {
  // Tipagem da WebView conflita na SDK 58; basta o método usado aqui
  const ref = useRef<{ injectJavaScript: (js: string) => void } | null>(null);
  const [pronto, setPronto] = useState(false);
  const [semMapa, setSemMapa] = useState<'NENHUM' | 'SEM_MAPA' | 'SEM_BLOCOS'>('NENHUM');
  const [desalinhado, setDesalinhado] = useState(false);

  const executar = (js: string) => ref.current?.injectJavaScript(`try{${js}}catch(e){} true;`);

  useEffect(() => {
    if (!pronto) return;
    executar(`window.atualizar && window.atualizar(${JSON.stringify(pontos)}, ${seguir});`);
  }, [pontos, seguir, pronto]);

  useEffect(() => {
    if (!pronto || !posicaoAtual || pontos.length > 0) return;
    executar(`window.posicionar && window.posicionar(${JSON.stringify(posicaoAtual)});`);
  }, [posicaoAtual, pontos.length, pronto]);

  function aoMensagem(e: WebViewMessageEvent) {
    const m = e.nativeEvent.data;
    if (m === 'sem-mapa') setSemMapa('SEM_MAPA');
    else if (m === 'sem-blocos') setSemMapa('SEM_BLOCOS');
    else if (m === 'blocos-ok') setSemMapa('NENHUM');
    else if (m === 'parou-de-seguir') setDesalinhado(true);
  }

  return (
    <View style={[estilos.caixa, style]}>
      <WebView
        ref={ref as any}
        originWhitelist={['*']}
        source={{ html: HTML, baseUrl: 'https://localhost' }}
        onLoadEnd={() => setPronto(true)}
        onMessage={aoMensagem}
        javaScriptEnabled
        scrollEnabled={false}
        style={estilos.web}
      />
      {semMapa !== 'NENHUM' && (
        <View style={estilos.aviso} pointerEvents="none">
          <Ionicons name="cloud-offline-outline" size={16} color={cores.dourado} />
          <Text style={estilos.avisoTexto}>
            {semMapa === 'SEM_MAPA'
              ? 'Mapa indisponível sem internet. Sua corrida continua sendo gravada.'
              : 'Mapa de fundo sem conexão. O percurso continua sendo gravado.'}
          </Text>
        </View>
      )}
      {seguir && desalinhado && (
        <Pressable
          style={estilos.recentrar}
          onPress={() => {
            executar('window.recentrar && window.recentrar();');
            setDesalinhado(false);
          }}
          accessibilityLabel="Centralizar na minha posição">
          <Ionicons name="locate" size={22} color={cores.texto} />
        </Pressable>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: {
    overflow: 'hidden',
    borderRadius: raio.lg,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.fundo,
    minHeight: 200,
  },
  web: { flex: 1, backgroundColor: cores.fundo },
  aviso: {
    position: 'absolute',
    top: espaco.sm,
    left: espaco.sm,
    right: espaco.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: espaco.sm,
    backgroundColor: '#0F172AE6',
    borderWidth: 1,
    borderColor: cores.dourado,
  },
  avisoTexto: { flex: 1, fontFamily: fontes.texto, color: cores.texto, fontSize: 12 },
  recentrar: {
    position: 'absolute',
    right: espaco.sm,
    bottom: espaco.lg,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.laranja,
    borderWidth: 2,
    borderColor: cores.laranjaEscuro,
  },
});
