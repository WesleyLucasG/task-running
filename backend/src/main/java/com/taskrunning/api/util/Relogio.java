package com.taskrunning.api.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * Horário oficial de Brasília para as regras que comparam com datas enviadas pelo app.
 * O app manda datas locais sem fuso (ex.: dataFim "2026-11-19T07:30:00") e o Render roda em UTC:
 * usar LocalDateTime.now() puro deixava o servidor 3 h "à frente" (chefe bloqueado indevidamente,
 * dia da hidratação virando às 21h). O fuso da JVM NÃO é alterado de propósito: assim a gravação e a
 * leitura das datas já existentes no MySQL continuam exatamente como antes do ajuste.
 */
public final class Relogio {

    public static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");

    private Relogio() {}

    public static LocalDateTime agora() {
        return LocalDateTime.now(FUSO);
    }

    public static LocalDate hoje() {
        return LocalDate.now(FUSO);
    }
}
