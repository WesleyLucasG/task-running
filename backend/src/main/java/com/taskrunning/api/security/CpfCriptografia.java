package com.taskrunning.api.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/**
 * RNF06: o CPF é gravado criptografado (AES-256-GCM, IV aleatório por registro).
 * Para localizar o usuário pelo CPF sem decifrar a tabela inteira, guarda-se também
 * um índice cego (HMAC-SHA256 com outra chave derivada), que é determinístico.
 */
@Component
public class CpfCriptografia {

    private static final String PREFIXO = "enc:v1:";
    private static final int IV_BYTES = 12;
    private static final int TAG_BITS = 128;

    private final SecretKeySpec chaveAes;
    private final SecretKeySpec chaveHmac;
    private final SecureRandom aleatorio = new SecureRandom();

    public CpfCriptografia(@Value("${app.seguranca.cpf-chave}") String segredo) {
        if (segredo == null || segredo.isBlank()) {
            throw new IllegalStateException("app.seguranca.cpf-chave (CPF_SECRET) não configurada.");
        }
        this.chaveAes = new SecretKeySpec(derivar(segredo, "cpf-aes"), "AES");
        this.chaveHmac = new SecretKeySpec(derivar(segredo, "cpf-hmac"), "HmacSHA256");
    }

    public static String normalizar(String cpf) {
        return cpf == null ? "" : cpf.replaceAll("\\D", "");
    }

    public static boolean estaCriptografado(String valor) {
        return valor != null && valor.startsWith(PREFIXO);
    }

    /** Índice cego para busca e unicidade (sempre o mesmo valor para o mesmo CPF). */
    public String hash(String cpf) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(chaveHmac);
            return HexFormat.of().formatHex(mac.doFinal(normalizar(cpf).getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Falha ao calcular o hash do CPF.", e);
        }
    }

    public String criptografar(String cpf) {
        try {
            byte[] iv = new byte[IV_BYTES];
            aleatorio.nextBytes(iv);
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.ENCRYPT_MODE, chaveAes, new GCMParameterSpec(TAG_BITS, iv));
            byte[] cifrado = c.doFinal(normalizar(cpf).getBytes(StandardCharsets.UTF_8));
            byte[] tudo = ByteBuffer.allocate(iv.length + cifrado.length).put(iv).put(cifrado).array();
            return PREFIXO + Base64.getEncoder().encodeToString(tudo);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Falha ao criptografar o CPF.", e);
        }
    }

    /** Aceita registros antigos em texto puro (ainda não migrados) e devolve só dígitos. */
    public String descriptografar(String armazenado) {
        if (!estaCriptografado(armazenado)) return normalizar(armazenado);
        try {
            byte[] tudo = Base64.getDecoder().decode(armazenado.substring(PREFIXO.length()));
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.DECRYPT_MODE, chaveAes, new GCMParameterSpec(TAG_BITS, tudo, 0, IV_BYTES));
            return new String(c.doFinal(tudo, IV_BYTES, tudo.length - IV_BYTES), StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            throw new IllegalStateException("Falha ao descriptografar o CPF.", e);
        }
    }

    /** Exibição segura: ***.***.***-NN */
    public static String mascarar(String cpfDigitos) {
        String d = normalizar(cpfDigitos);
        return d.length() == 11 ? "***.***.***-" + d.substring(9) : "***";
    }

    private static byte[] derivar(String segredo, String rotulo) {
        try {
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            sha.update(rotulo.getBytes(StandardCharsets.UTF_8));
            return sha.digest(segredo.getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }
}
