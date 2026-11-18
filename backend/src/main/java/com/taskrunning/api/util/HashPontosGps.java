package com.taskrunning.api.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;

/**
 * RN16: hash canônico da lista de pontos (mesmo algoritmo do app, em src/domain/sincronizacao.ts).
 * Cada ponto vira "lat,lon,yyyy-MM-ddTHH:mm:ss" (6 casas decimais), em ordem de tempo, separados por ";".
 */
public final class HashPontosGps {

    private static final DateTimeFormatter FORMATO = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private HashPontosGps() {}

    public record Ponto(double latitude, double longitude, LocalDateTime timestamp) {}

    public static String linha(Ponto p) {
        return String.format(Locale.ROOT, "%.6f,%.6f,%s", p.latitude(), p.longitude(), FORMATO.format(p.timestamp()));
    }

    public static String calcular(List<Ponto> pontosOrdenados) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < pontosOrdenados.size(); i++) {
            if (i > 0) sb.append(';');
            sb.append(linha(pontosOrdenados.get(i)));
        }
        try {
            byte[] d = MessageDigest.getInstance("SHA-256").digest(sb.toString().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(d);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
