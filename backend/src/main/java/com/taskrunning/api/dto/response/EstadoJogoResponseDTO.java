package com.taskrunning.api.dto.response;

import com.taskrunning.api.enums.Cabelo;
import com.taskrunning.api.enums.DetalheRoupa;
import com.taskrunning.api.enums.Genero;
import com.taskrunning.api.enums.SituacaoFase;

import java.util.List;

public record EstadoJogoResponseDTO(
        CarteiraDTO carteira,
        AtributosDTO atributos,
        AparenciaDTO aparencia,
        List<FaseDTO> fases,
        ChefeAtualDTO chefeAtual,
        long bausPendentes
) {
    public record CarteiraDTO(long moedas, long experienciaXp, int nivel) {}

    public record AtributosDTO(
            int nivel,
            long experiencia,
            long xpNoNivel,
            long xpParaProximoNivel,
            int forcaBase,
            int agilidade,
            int vidaMaxima,
            int bonusForca,
            int bonusVida,
            double multiplicadorRecompensa,
            // D45: atributos de combate (o app usa estes valores; não recalcula)
            int bonusArmadura,
            int bonusAgilidade,
            int agilidadeTotal,
            int danoPorGolpe,
            int intervaloAtaqueMs,
            double reducaoDano
    ) {}

    public record AparenciaDTO(
            Genero genero,
            Cabelo cabelo,
            String corCabelo,
            String corPele,
            String corRoupa,
            DetalheRoupa detalheRoupa
    ) {}

    public record FaseDTO(
            int numero,
            SituacaoFase situacao,
            double distanciaAcumuladaMetros,
            boolean chefeLiberado,
            int vidaAtualChefe
    ) {}

    public record ChefeAtualDTO(
            int faseNumero,
            boolean podeAtacar,
            String motivoBloqueio,
            int danoEstimado
    ) {}
}
