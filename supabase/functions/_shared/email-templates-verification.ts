/**
 * Email Templates - Email Verification
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * Self-contained template following the EMAIL_TEMPLATE_STANDARD.
 * No shared wrappers, no getEmailWrapper(), no getBaseStyles().
 * 
 * @version 1.0.0
 */

import { getLogoUrl } from "./email-templates-base.ts";
import { getSiteBaseUrl } from "./site-urls.ts";
import { getSupportEmail } from "./email-config.ts";

// ============================================================================
// TYPES
// ============================================================================

export interface EmailVerificationData {
  userName: string;
  verificationUrl: string;
}

// ============================================================================
// EMAIL VERIFICATION TEMPLATE (Gmail Compatible)
// ============================================================================

export function getEmailVerificationTemplate(data: EmailVerificationData): string {
  const logoUrl = getLogoUrl();
  const siteUrl = getSiteBaseUrl('default');
  const supportEmail = getSupportEmail();

  const styles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background-color: #F8F9FA; color: #343A40; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      .container { max-width: 600px; margin: 40px auto; background-color: #FFFFFF; border: 1px solid #E9ECEF; border-radius: 8px; overflow: hidden; }
      .header { text-align: center; padding: 0; line-height: 0; border-bottom: 1px solid #E9ECEF; background-color: #ffffff; }
      .header img { display: block; width: 100%; max-width: 600px; height: auto; margin: 0 auto; }
      .content { padding: 32px; }
      .content h1 { font-size: 24px; font-weight: 700; color: #212529; margin: 0 0 12px; text-align: center; }
      .content p { font-size: 16px; line-height: 1.6; margin: 0 0 24px; color: #495057; }
      .cta-section { background-color: #F1F3F5; padding: 24px; border-radius: 6px; text-align: center; margin-bottom: 32px; }
      .cta-section h2 { font-size: 18px; font-weight: 600; color: #212529; margin: 0 0 8px; }
      .cta-section p { font-size: 14px; color: #495057; margin: 0 0 20px; }
      .cta-button { display: inline-block; background: linear-gradient(135deg, #004fff 0%, #002875 100%); color: #FFFFFF !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; }
      .fallback-link { font-size: 12px; color: #6C757D; word-break: break-all; margin-top: 16px; }
      .fallback-link a { color: #007BFF; text-decoration: none; }
      .info-box { background-color: #FFF3CD; border: 1px solid #FFEEBA; border-radius: 6px; padding: 16px; margin-bottom: 24px; }
      .info-box p { font-size: 14px; color: #856404; margin: 0; }
      .support { text-align: center; padding: 32px; font-size: 14px; color: #6C757D; border-top: 1px solid #E9ECEF; }
      .support a { color: #007BFF; text-decoration: none; font-weight: 600; }
      .footer { background-color: #F8F9FA; padding: 24px; text-align: center; font-size: 12px; color: #6C757D; }
      .footer p { margin: 0 0 4px; }
      .footer a { color: #495057; text-decoration: none; font-weight: 600; }
      @media only screen and (max-width: 600px) {
        .container { width: 100% !important; margin: 0 !important; border-radius: 0 !important; }
        .content { padding: 20px !important; }
      }
    </style>
  `;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirme seu Email - Rise Checkout</title>
  ${styles}
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="Rise Checkout" width="600">
    </div>
    <div class="content">
      <h1>Confirme seu email</h1>
      <p>Olá, ${data.userName || 'Usuário'}! Obrigado por se cadastrar no Rise Checkout. Para ativar sua conta, confirme seu endereço de email clicando no botão abaixo.</p>
      <div class="cta-section">
        <h2>Quase lá!</h2>
        <p>Clique no botão para verificar seu email e ativar sua conta.</p>
        <a href="${data.verificationUrl}" class="cta-button">Confirmar meu email</a>
        <p class="fallback-link">Ou copie e cole este link no navegador:<br><a href="${data.verificationUrl}">${data.verificationUrl}</a></p>
      </div>
      <div class="info-box">
        <p>⏰ Este link expira em 24 horas. Se não foi você quem se cadastrou, ignore este email.</p>
      </div>
    </div>
    <div class="support">
      <p>Dúvidas? Entre em contato: <a href="mailto:${supportEmail}">${supportEmail}</a></p>
    </div>
    <div class="footer">
      <p>Processado com segurança por <a href="${siteUrl}">Rise Checkout</a>.</p>
    </div>
  </div>
</body>
</html>`;
}

// ============================================================================
// TEXT VERSION
// ============================================================================

export function getEmailVerificationTextTemplate(data: EmailVerificationData): string {
  const supportEmail = getSupportEmail();

  return `CONFIRME SEU EMAIL

Olá, ${data.userName || 'Usuário'}!

Obrigado por se cadastrar no Rise Checkout. Para ativar sua conta, acesse o link abaixo:

${data.verificationUrl}

⏰ Este link expira em 24 horas.

Se não foi você quem se cadastrou, ignore este email.

Dúvidas? Entre em contato: ${supportEmail}

Processado com segurança por Rise Checkout`;
}