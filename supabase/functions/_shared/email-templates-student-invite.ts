/**
 * Email Template: Student Invite
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * Template para convite de alunos à área de membros.
 * Segue padrão visual unificado com banner azul e botão gradiente.
 * 
 * @version 1.0.0
 */

import { getLogoUrl } from "./email-templates-base.ts";

// ============================================================================
// TYPES
// ============================================================================

export interface StudentInviteData {
  studentName: string;
  productName: string;
  producerName: string;
  accessLink: string;
}

// ============================================================================
// HTML TEMPLATE
// ============================================================================

export function getStudentInviteTemplate(data: StudentInviteData): string {
  const styles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background-color: #F8F9FA; color: #343A40; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      .container { max-width: 600px; margin: 40px auto; background-color: #FFFFFF; border: 1px solid #E9ECEF; border-radius: 8px; overflow: hidden; }
      .header { text-align: center; padding: 0; line-height: 0; background-color: #fff; }
      .header img { display: block; width: 100%; max-width: 600px; height: auto; }
      .success-banner { background: linear-gradient(135deg, #004fff 0%, #002875 100%); padding: 24px 32px; text-align: center; }
      .success-banner h1 { font-size: 24px; font-weight: 700; color: #212529; margin: 0; }
      .content { padding: 32px; }
      .content p { font-size: 16px; line-height: 1.6; margin: 0 0 16px; color: #495057; }
      .content p strong { color: #212529; }
      .cta-section { background-color: #F8F9FA; border: 1px solid #E9ECEF; padding: 24px; border-radius: 6px; text-align: center; margin: 24px 0; }
      .cta-section h2 { font-size: 18px; font-weight: 600; color: #212529; margin: 0 0 8px; }
      .cta-section p { font-size: 14px; color: #495057; margin: 0 0 20px; }
      .cta-button { display: inline-block; background: linear-gradient(135deg, #004fff 0%, #002875 100%); color: #ffffff !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; }
      .info-box { background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 6px; padding: 16px; margin-top: 24px; }
      .info-box p { font-size: 14px; color: #1E40AF; margin: 0; }
      .divider { height: 1px; background-color: #E9ECEF; margin: 32px 0; }
      .footer { text-align: center; padding: 24px 32px; background-color: #F8F9FA; border-top: 1px solid #E9ECEF; }
      .footer p { font-size: 12px; color: #6C757D; margin: 0; }
    </style>
  `;

  const content = `
    <div class="header">
      <img src="${getLogoUrl()}" alt="Rise Checkout Logo" width="600">
    </div>
    <div class="success-banner">
      <h1>Você Foi Convidado!</h1>
    </div>
    <div class="content">
      <p>Olá, <strong>${data.studentName}</strong>!</p>
      <p><strong>${data.producerName}</strong> liberou seu acesso ao produto:</p>
      <p style="font-size: 18px; font-weight: 600; color: #212529; margin: 16px 0;">"${data.productName}"</p>
      
      <div class="cta-section">
        <h2>Configure Sua Senha</h2>
        <p>Clique no botão abaixo para configurar sua senha e acessar o conteúdo exclusivo.</p>
        <a href="${data.accessLink}" class="cta-button">Acessar Agora</a>
      </div>

      <div class="info-box">
        <p>⏱️ Este link expira em 7 dias. Se você não solicitou este acesso, ignore este email.</p>
      </div>

      <div class="divider"></div>
      
      <p style="font-size: 14px; color: #6C757D;">
        Você recebeu este email porque foi convidado para acessar um produto na plataforma Rise Checkout.
      </p>
    </div>
    <div class="footer">
      <p>Rise Checkout</p>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Você Foi Convidado!</title>
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
// TEXT TEMPLATE
// ============================================================================

export function getStudentInviteTextTemplate(data: StudentInviteData): string {
  return `Você Foi Convidado!

Olá, ${data.studentName}!

${data.producerName} liberou seu acesso ao produto "${data.productName}".

Clique no link abaixo para configurar sua senha e acessar o conteúdo:
${data.accessLink}

⏱️ Este link expira em 7 dias.

Se você não solicitou este acesso, ignore este email.

---
Rise Checkout`;
}
