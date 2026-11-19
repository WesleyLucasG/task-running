package com.taskrunning.api.service;

import com.taskrunning.api.exception.EmailIndisponivelException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.HtmlUtils;

import java.util.List;
import java.util.Map;

/**
 * Envio do e-mail de recuperação de senha (RF06).
 *
 * Dois transportes, escolhidos por app.email.provedor (variável MAIL_PROVIDER):
 *  - "brevo": API HTTP do Brevo pela porta 443. Necessário no Render gratuito, que bloqueia
 *             as portas SMTP 25, 465 e 587 desde 26/09/2025 (causa do "Operation timed out").
 *  - "smtp" : JavaMailSender (Gmail etc.). Funciona localmente ou em hospedagem que libere SMTP.
 *
 * Qualquer falha vira EmailIndisponivelException: o fluxo NÃO pode responder como se o e-mail tivesse saído.
 * Credenciais nunca são registradas em log, e o destinatário aparece mascarado.
 */
@Service
@ConditionalOnProperty(name = "app.email.habilitado", havingValue = "true")
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final String URL_BREVO = "https://api.brevo.com/v3/smtp/email";
    private static final int TIMEOUT_MS = 10_000;

    private final ObjectProvider<JavaMailSender> mailSender;
    private final RestClient restClient;

    @Value("${app.email.provedor:smtp}")
    private String provedor;

    @Value("${app.email.remetente:noreply@taskrunning.app}")
    private String remetente;

    @Value("${app.email.remetente-nome:Task Running}")
    private String remetenteNome;

    @Value("${app.email.brevo-api-key:}")
    private String brevoApiKey;

    @Value("${app.email.brevo-url:" + URL_BREVO + "}") // configurável só para testes automatizados
    private String brevoUrl;

    @Value("${FRONTEND_URL:http://localhost:5174}")
    private String frontendUrl;

    public EmailService(ObjectProvider<JavaMailSender> mailSender, RestClient.Builder restClientBuilder) {
        this.mailSender = mailSender;
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(TIMEOUT_MS);
        fabrica.setReadTimeout(TIMEOUT_MS);
        this.restClient = restClientBuilder.requestFactory(fabrica).build();
    }

    public void enviarRecuperacaoSenha(String emailDestino, String nomeUsuario, String token) {
        String assunto = "Redefinição de senha – Task Running";
        String html = construirHtml(nomeUsuario, token);
        try {
            if ("brevo".equalsIgnoreCase(provedor)) {
                enviarPorBrevo(emailDestino, nomeUsuario, assunto, html);
            } else {
                enviarPorSmtp(emailDestino, assunto, html);
            }
            log.info("E-mail de recuperação enviado para {} via {}", mascarar(emailDestino), provedor);
        } catch (EmailIndisponivelException e) {
            throw e;
        } catch (Exception e) {
            log.error("Falha ao enviar e-mail de recuperação para {} via {}: {}",
                    mascarar(emailDestino), provedor, e.getMessage());
            throw new EmailIndisponivelException("Falha no envio do e-mail de recuperação.", e);
        }
    }

    private void enviarPorSmtp(String destino, String assunto, String html) throws Exception {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            throw configuracaoAusente("spring.mail.host (MAIL_HOST) não configurado");
        }
        MimeMessage msg = sender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
        helper.setFrom(remetente, remetenteNome);
        helper.setTo(destino);
        helper.setSubject(assunto);
        helper.setText(html, true);
        sender.send(msg);
    }

    private void enviarPorBrevo(String destino, String nome, String assunto, String html) {
        if (brevoApiKey == null || brevoApiKey.isBlank()) {
            throw configuracaoAusente("BREVO_API_KEY não configurada");
        }
        Map<String, Object> corpo = Map.of(
                "sender", Map.of("name", remetenteNome, "email", remetente),
                "to", List.of(Map.of("email", destino, "name", nome == null ? destino : nome)),
                "subject", assunto,
                "htmlContent", html);
        try {
            restClient.post()
                    .uri(brevoUrl)
                    .header("api-key", brevoApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(corpo)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException e) {
            // O corpo de erro do Brevo explica o motivo (ex.: remetente não verificado) e não contém a chave.
            log.error("Brevo recusou o envio para {}: HTTP {} {}",
                    mascarar(destino), e.getStatusCode().value(), e.getResponseBodyAsString());
            throw new EmailIndisponivelException("Provedor de e-mail recusou a mensagem.", e);
        }
    }

    private EmailIndisponivelException configuracaoAusente(String detalhe) {
        log.error("Envio de e-mail indisponível: {}", detalhe);
        return new EmailIndisponivelException("Envio de e-mail não configurado.", null);
    }

    /** "wesleylucas@edu.uniube.br" → "we***@edu.uniube.br" (LGPD: não registrar o e-mail completo). */
    static String mascarar(String email) {
        if (email == null) return "?";
        int arroba = email.indexOf('@');
        if (arroba <= 0) return "***";
        return email.substring(0, Math.min(2, arroba)) + "***" + email.substring(arroba);
    }

    private String construirHtml(String nome, String token) {
        String link = frontendUrl + "/reset-password?token=" + token;
        return """
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head><meta charset="UTF-8"/></head>
                <body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
                    <tr><td align="center">
                      <table width="560" cellpadding="0" cellspacing="0"
                             style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
                        <tr>
                          <td style="background:#F97316;padding:32px;text-align:center;">
                            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:bold;letter-spacing:-0.5px;">
                              Task Running
                            </h1>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:40px 48px;">
                            <p style="margin:0 0 16px;font-size:16px;color:#111827;">
                              Olá, <strong>%s</strong>!
                            </p>
                            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.65;">
                              Recebemos uma solicitação para redefinir a senha da sua conta no Task Running.
                              Clique no botão abaixo para criar uma nova senha.
                            </p>
                            <div style="text-align:center;margin:32px 0;">
                              <a href="%s"
                                 style="display:inline-block;background:#F97316;color:#ffffff;text-decoration:none;
                                        padding:14px 40px;border-radius:8px;font-size:15px;font-weight:bold;">
                                Redefinir minha senha
                              </a>
                            </div>
                            <p style="margin:0 0 8px;font-size:13px;color:#374151;line-height:1.5;">
                              Está usando o aplicativo? Copie o código abaixo e cole no campo
                              <strong>Código recebido</strong>:
                            </p>
                            <p style="margin:0 0 24px;font-size:14px;font-family:'Courier New',monospace;color:#111827;
                                      background:#f3f4f6;padding:12px;border-radius:6px;word-break:break-all;text-align:center;">
                              %s
                            </p>
                            <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.5;">
                              Este link e o código expiram em <strong>15 minutos</strong> e só podem ser usados uma vez.
                              Se você não solicitou a redefinição, ignore este e-mail —
                              sua senha permanece a mesma e nenhuma alteração foi feita.
                            </p>
                            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
                            <p style="margin:0;font-size:12px;color:#9ca3af;word-break:break-all;">
                              Ou acesse diretamente:<br/>
                              <a href="%s" style="color:#F97316;">%s</a>
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="background:#f9fafb;padding:20px 48px;text-align:center;">
                            <p style="margin:0;font-size:12px;color:#9ca3af;">
                              © 2026 Task Running. Todos os direitos reservados.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(HtmlUtils.htmlEscape(nome == null ? "" : nome), link, token, link, link);
    }
}
