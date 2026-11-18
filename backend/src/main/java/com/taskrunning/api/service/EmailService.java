package com.taskrunning.api.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.email.habilitado", havingValue = "true")
@RequiredArgsConstructor
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.email.remetente:noreply@taskrunning.app}")
    private String remetente;

    @Value("${FRONTEND_URL:http://localhost:5174}")
    private String frontendUrl;

    public void enviarRecuperacaoSenha(String emailDestino, String nomeUsuario, String token) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(remetente);
            helper.setTo(emailDestino);
            helper.setSubject("Redefinição de senha – Task Running");
            helper.setText(construirHtml(nomeUsuario, token), true);
            mailSender.send(msg);
            log.info("E-mail de recuperação enviado para {}", emailDestino);
        } catch (Exception e) {
            // Falha no envio não cancela o fluxo; o token já está salvo e o dev-mode devolve o token na resposta.
            log.error("Falha ao enviar e-mail de recuperação para {}: {}", emailDestino, e.getMessage());
        }
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
                            <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.5;">
                              Este link expira em <strong>15 minutos</strong>.
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
                """.formatted(nome, link, link, link);
    }
}
