package com.taskrunning.api.util;

import com.taskrunning.api.enums.TipoAtividade;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CalculoGeograficoUtilTest {

    @Test
    @DisplayName("1. Deve calcular distancia GPS em metros corretamente (Formula de Haversine)")
    void deveCalcularDistanciaHaversineComPrecisao() {
        // Ponto A (Uberlândia - Centro)
        double lat1 = -18.9186;
        double lon1 = -48.2772;

        // Ponto B (~1000 metros de distância)
        double lat2 = -18.9276;
        double lon2 = -48.2772;

        double distancia = CalculoGeograficoUtil.calcularDistanciaHaversine(lat1, lon1, lat2, lon2);

        // Valida tolerância de variação geográfica em metros
        assertTrue(distancia > 950.0 && distancia < 1050.0);
    }

    @Test
    @DisplayName("2. Deve retornar zero quando coordenadas inicial e final forem identicas")
    void deveRetornarZeroParaMesmasCoordenadas() {
        double lat = -18.9186;
        double lon = -48.2772;

        double distancia = CalculoGeograficoUtil.calcularDistanciaHaversine(lat, lon, lat, lon);

        assertEquals(0.0, distancia, 0.001);
    }

    @Test
    @DisplayName("3. Deve calcular pace medio correto em minutos por quilometro")
    void deveCalcularPaceMedioCorretamente() {
        double distanciaMetros = 5000.0; // 5 km
        long duracaoSegundos = 1500L;    // 25 minutos (1500s)

        double pace = CalculoGeograficoUtil.calcularPaceMedio(distanciaMetros, duracaoSegundos);

        assertEquals(5.0, pace, 0.1); // 25 min / 5 km = 5.0 min/km
    }

    @Test
    @DisplayName("4. Deve calcular calorias gastas com base no tipo de atividade e peso")
    void deveCalcularCaloriasCorretamente() {
        double pesoKg = 70.0;
        long duracaoSegundos = 3600L; // 1 hora (3600s)

        int calorias = CalculoGeograficoUtil.calcularCalorias(TipoAtividade.CORRIDA, pesoKg, duracaoSegundos);

        assertTrue(calorias > 0);
    }
}