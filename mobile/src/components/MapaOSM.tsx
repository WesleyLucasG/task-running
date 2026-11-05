import { useEffect, useRef, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { cores, raio } from '../theme';

const HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#mapa{height:100%;margin:0;background:#0B1220;}</style>
</head>
<body>
<div id="mapa"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var mapa = L.map('mapa', { zoomControl: false }).setView([-14.2, -51.9], 4);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(mapa);
  var linha = L.polyline([], { color: '#F97316', weight: 5 }).addTo(mapa);
  var atual = null;
  var centralizou = false;

  function atualizar(pts, seguir) {
    linha.setLatLngs(pts);
    if (pts.length === 0) return;
    var ultimo = pts[pts.length - 1];
    if (atual) {
      atual.setLatLng(ultimo);
    } else {
      atual = L.circleMarker(ultimo, {
        radius: 8, color: '#ffffff', weight: 2, fillColor: '#F97316', fillOpacity: 1
      }).addTo(mapa);
    }
    if (seguir) {
      if (!centralizou) { mapa.setView(ultimo, 17); centralizou = true; }
      else { mapa.panTo(ultimo); }
    } else if (pts.length > 1) {
      mapa.fitBounds(linha.getBounds(), { padding: [24, 24] });
    } else {
      mapa.setView(ultimo, 16);
    }
  }
</script>
</body>
</html>`;

type Props = {
  pontos: [number, number][];
  seguir?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function MapaOSM({ pontos, seguir = false, style }: Props) {
  // Ajustada a tipagem do ref para ignorar conflito interno do TypeScript na SDK 58
  const ref = useRef<any>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    if (!pronto) return;
    ref.current?.injectJavaScript(
      `typeof atualizar === 'function' && atualizar(${JSON.stringify(pontos)}, ${seguir}); true;`,
    );
  }, [pontos, seguir, pronto]);

  return (
    <View style={[estilos.caixa, style]}>
      <WebView
        ref={ref}
        originWhitelist={['*']}
        source={{ html: HTML, baseUrl: 'https://localhost' }}
        onLoadEnd={() => setPronto(true)}
        javaScriptEnabled
        scrollEnabled={false}
        style={estilos.web}
      />
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
});
