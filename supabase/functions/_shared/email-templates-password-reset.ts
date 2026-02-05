/**
 * Email Templates - Password Reset
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * Template para solicitação de redefinição de senha.
 * Segue o padrão visual unificado da plataforma.
 * 
 * @version 1.0.0
 */

import { getLogoUrl } from "./email-templates-base.ts";
import { getSiteBaseUrl } from "./site-urls.ts";
import { getSupportEmail } from "./email-config.ts";
import { RESET_TOKEN_EXPIRY_HOURS } from "./auth-constants.ts";

// ============================================================================
// PASSWORD RESET EMAIL (HTML)
// ============================================================================

export interface PasswordResetData {
  name: string | null;
  resetLink: string;
}

export function getPasswordResetTemplate(data: PasswordResetData): string {
  const userName = data.name || "Usuário";
  
  const styles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background-color: #F8F9FA; color: #343A40; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      .container { max-width: 600px; margin: 40px auto; background-color: #FFFFFF; border: 1px solid #E9ECEF; border-radius: 8px; overflow: hidden; }
      .header { text-align: center; padding: 0; line-height: 0; background-color: #fff; }
      .header img { display: block; width: 100%; max-width: 600px; height: auto; }
      .content { padding: 32px; }
      .content h1 { font-size: 24px; font-weight: 700; color: #212529; margin: 0 0 12px; }
      .content p { font-size: 16px; line-height: 1.6; margin: 0 0 24px; color: #495057; }
      .cta-section { background-color: #F8F9FA; border: 1px solid #E9ECEF; padding: 24px; border-radius: 6px; text-align: center; margin-bottom: 24px; }
      .cta-section p { font-size: 14px; color: #495057; margin: 0 0 20px; }
      .cta-button { display: inline-block; background: linear-gradient(135deg, #004fff 0%, #002875 100%); color: #ffffff !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; }
      .warning-box { background-color: #FEF3C7; border: 1px solid #F59E0B; padding: 16px; border-radius: 6px; margin-bottom: 24px; }
      .warning-box p { font-size: 14px; color: #92400E; margin: 0; }
      .info-text { font-size: 14px; color: #6B7280; margin: 0 0 8px; }
      .footer { background-color: #F8F9FA; padding: 24px; text-align: center; font-size: 12px; color: #6C757D; }
      .footer p { margin: 0 0 4px; }
      .footer a { color: #495057; text-decoration: none; font-weight: 600; }
    </style>
  `;

  const content = `
    <div class="header">
      <img src="${getLogoUrl()}" alt="Rise Checkout Logo" width="600">
    </div>
    <div class="content">
      <h1>Redefinir Senha</h1>
      <p>Olá, ${userName}!</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta Rise Checkout. Clique no botão abaixo para criar uma nova senha:</p>
      
      <div class="cta-section">
        <a href="${data.resetLink}" class="cta-button">Redefinir Senha</a>
      </div>
      
      <div class="warning-box">
        <p>⏳ <strong>Atenção:</strong> Este link expira em ${RESET_TOKEN_EXPIRY_HOURS} hora${RESET_TOKEN_EXPIRY_HOURS > 1 ? 's' : ''}. Se você não solicitou esta redefinição, ignore este email.</p>
      </div>
      
      <p class="info-text">Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
      <p class="info-text" style="word-break: break-all; color: #007BFF;">${data.resetLink}</p>
    </div>
    <div class="footer">
      <p>Processado com segurança por <strong>Rise Checkout</strong>.</p>
      <p><a href="${getSiteBaseUrl('default')}">${getSiteBaseUrl('default').replace('https://', '')}</a></p>
      <p style="margin-top: 12px;">Dúvidas? <a href="mailto:${getSupportEmail()}">${getSupportEmail()}</a></p>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir Senha - Rise Checkout</title>
  ${styles}
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>`;
}

// ============================================================================
// PASSWORD RESET EMAIL (TEXT)
// ============================================================================

export function getPasswordResetTextTemplate(data: PasswordResetData): string {
  const userName = data.name || "Usuário";
  
  return `
REDEFINIR SENHA - RISE CHECKOUT
================================

Olá, ${userName}!

Recebemos uma solicitação para redefinir a senha da sua conta Rise Checkout.

Acesse o link abaixo para criar uma nova senha:
${data.resetLink}

⏳ ATENÇÃO: Este link expira em ${RESET_TOKEN_EXPIRY_HOURS} hora${RESET_TOKEN_EXPIRY_HOURS > 1 ? 's' : ''}.

Se você não solicitou esta redefinição, ignore este email.

---
Processado com segurança por Rise Checkout
${getSiteBaseUrl('default')}
Dúvidas? ${getSupportEmail()}
  `.trim();
}
