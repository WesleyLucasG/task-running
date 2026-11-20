package com.taskrunning.api.util;

import com.taskrunning.api.security.CpfCriptografia;
import com.taskrunning.api.service.GamificacaoService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SegurancaEUtilitariosTest {

    private final CpfCriptografia cripto = new CpfCriptografia("chave-de-teste");

    @Test
    @DisplayName("RF02: validação de CPF pelos dígitos verificadores")
    void validaCpf() {
        assertTrue(CpfValidator.valido("529.982.247-25"));
        assertTrue(CpfValidator.valido("52998224725"));
        assertFalse(CpfValidator.valido("529.982.247-24"));
        assertFalse(CpfValidator.valido("111.111.111-11"));
        assertFalse(CpfValidator.valido("123"));
    }

    @Test
    @DisplayName("RNF06: criptografia com IV aleatório, decifra de volta e hash determinístico")
    void criptografaCpf() {
        String a = cripto.criptografar("529.982.247-25");
        String b = cripto.criptografar("52998224725");
        assertNotEquals(a, b); // IV aleatório
        assertFalse(a.contains("52998224725"));
        assertEquals("52998224725", cripto.descriptografar(a));
        assertEquals(cripto.hash("529.982.247-25"), cripto.hash("52998224725"));
        assertNotEquals(cripto.hash("52998224725"), new CpfCriptografia("outra-chave").hash("52998224725"));
        assertEquals("***.***.***-25", CpfCriptografia.mascarar("52998224725"));
    }

    @Test
    @DisplayName("RN16: hash canônico igual ao do app (vetor compartilhado com src/domain/sincronizacao.ts)")
    void hashCanonicoDosPontos() {
        var pontos = List.of(
                new HashPontosGps.Ponto(-18.9186, -48.2772, LocalDateTime.of(2026, 11, 17, 10, 0, 0)),
                new HashPontosGps.Ponto(-18.919, -48.2772, LocalDateTime.of(2026, 11, 17, 10, 0, 5)));
        assertEquals("fa14d9b43a1fd71eea23100415c6cfe8c6bd19111e70229fa41e8a5cb428aa6a", HashPontosGps.calcular(pontos));
        assertEquals("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", HashPontosGps.calcular(List.of()));
    }

    @Test
    @DisplayName("RF19: curva aprovada 100, 150 … 500 XP por nível, teto no nível 10")
    void curvaDeNivel() {
        assertEquals(1, GamificacaoService.calcularNivel(0));
        assertEquals(1, GamificacaoService.calcularNivel(99));
        assertEquals(2, GamificacaoService.calcularNivel(100));
        assertEquals(3, GamificacaoService.calcularNivel(250)); // 100 + 150
        assertEquals(9, GamificacaoService.calcularNivel(2699));
        assertEquals(10, GamificacaoService.calcularNivel(2700));
        assertEquals(10, GamificacaoService.calcularNivel(1_000_000)); // nunca passa do 10
    }
}
