package com.taskrunning.api.util;

import com.taskrunning.api.enums.TipoAtividade;

public class CalculoGeograficoUtil {

    private static final double RAIO_TERRA_METROS = 6371000.0;

    public static double calcularDistanciaHaversine(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return RAIO_TERRA_METROS * c;
    }

    public static double calcularPaceMedio(double distanciaMetros, long duracaoSegundos) {
        if (distanciaMetros <= 0 || duracaoSegundos <= 0) {
            return 0.0;
        }
        double distanciaKm = distanciaMetros / 1000.0;
        double tempoMinutos = duracaoSegundos / 60.0;
        return tempoMinutos / distanciaKm;
    }

    public static int calcularCalorias(TipoAtividade tipo, double pesoKg, long duracaoSegundos) {
        if (pesoKg <= 0 || duracaoSegundos <= 0) {
            return 0;
        }
        double duracaoHoras = duracaoSegundos / 3600.0;
        return (int) Math.round(tipo.getMet() * pesoKg * duracaoHoras);
    }
}