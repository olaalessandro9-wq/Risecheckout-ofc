/**
 * Email Templates - Purchase Confirmation (Standard Delivery)
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * Template restaurado à estrutura ORIGINAL comprovadamente funcional.
 * SEM success-banner, com header padding 40px 20px e logo max-width 180px.
 * 
 * @version 7.0.0
 */

import { PurchaseConfirmationData, formatCurrency, getLogoUrl } from "./email-templates-base.ts";
import { getSiteBaseUrl } from "./site-urls.ts";
import { getSupportEmail } from "./email-config.ts";

// ============================================================================
// PURCHASE CONFIRMATION TEMPLATE (Original Structure - Gmail Compatible)
// ============================================================================

export function getPurchaseConfirmationTemplate(data: PurchaseConfirmationData): string {
  const logoUrl = getLogoUrl();
  const siteUrl = getSiteBaseUrl('default');
  const siteDomain = siteUrl.replace('https://', '');
  const supportEmail = data.supportEmail || getSupportEmail();
  const linkAcesso = data.deliveryUrl || "#";

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
      .cta-button { display: inline-block; background-color: #007BFF; color: #FFFFFF; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; }
      .order-details { border: 1px solid #E9ECEF; border-radius: 6px; }
      .order-details h2 { font-size: 18px; font-weight: 700; color: #212529; margin: 0; padding: 20px; border-bottom: 1px solid #E9ECEF; }
      .order-item { display: flex; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #E9ECEF; }
      .order-item:last-child { border-bottom: none; }
      .order-label { font-size: 14px; color: #495057; }
      .order-value { font-size: 14px; font-weight: 600; color: #212529; text-align: right; }
      .total-row { display: flex; justify-content: space-between; padding: 20px; background-color: #F8F9FA; font-size: 18px; font-weight: 700; }
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

  // CTA section (optional - only when deliveryUrl exists)
  const ctaSection = linkAcesso && linkAcesso !== '#' ? `
      <div class="cta-section">
        <h2>Seu acesso está liberado!</h2>
        <p>Clique no botão abaixo para acessar o conteúdo adquirido.</p>
        <a href="${linkAcesso}" class="cta-button">Acessar meu produto</a>
      </div>` : '';

  // Payment method row (optional)
  const paymentMethodRow = data.paymentMethod ? `
        <div class="order-item">
          <span class="order-label">Pagamento</span>
          <span class="order-value">${data.paymentMethod}</span>
        </div>` : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmação de Compra - Rise Checkout</title>
  ${styles}
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="Rise Checkout" width="600">
    </div>
    <div class="content">
      <h1>Sua compra foi confirmada!</h1>
      <p>Olá, ${data.customerName || 'Cliente'}. Obrigado por comprar conosco. Seu pagamento foi processado com sucesso.</p>
      ${ctaSection}
      <div class="order-details">
        <h2>Resumo do Pedido</h2>
        <div class="order-item">
          <span class="order-label">Produto</span>
          <span class="order-value">${data.productName}</span>
        </div>
        <div class="order-item">
          <span class="order-label">Nº do Pedido</span>
          <span class="order-value">#${data.orderId ? data.orderId.substring(0, 8).toUpperCase() : '---'}</span>
        </div>
        ${paymentMethodRow}
        <div class="total-row">
          <span class="order-label">Total</span>
          <span class="order-value">${formatCurrency(data.amountCents)}</span>
        </div>
      </div>
    </div>
    <div class="support">
      <p>Dúvidas? Entre em contato: <a href="mailto:${supportEmail}">${supportEmail}</a></p>
    </div>
    <div class="footer">
      ${data.sellerName ? `<p>Vendido por: ${data.sellerName}</p>` : ''}
      <p>Processado com segurança por <a href="${siteUrl}">Rise Checkout</a>.</p>
    </div>
  </div>
</body>
</html>`;
}

// ============================================================================
// TEXT VERSION
// ============================================================================

export function getPurchaseConfirmationTextTemplate(data: PurchaseConfirmationData): string {
  const supportEmail = data.supportEmail || getSupportEmail();
  
  let text = `COMPRA CONFIRMADA

Olá, ${data.customerName || 'Cliente'}!

Obrigado por comprar conosco. Seu pagamento foi processado com sucesso.
`;

  if (data.deliveryUrl) {
    text += `
SEU ACESSO ESTÁ LIBERADO!
Clique no link abaixo para acessar o conteúdo:
${data.deliveryUrl}
`;
  }

  text += `
RESUMO DO PEDIDO
==================
Produto: ${data.productName}
Nº do Pedido: #${data.orderId ? data.orderId.substring(0, 8).toUpperCase() : '---'}`;

  if (data.paymentMethod) {
    text += `\nForma de Pagamento: ${data.paymentMethod}`;
  }

  text += `\nTotal: ${formatCurrency(data.amountCents)}

Em caso de dúvidas, entre em contato: ${supportEmail}
`;

  if (data.sellerName) {
    text += `\nVendido por: ${data.sellerName}`;
  }

  text += `\nProcessado com segurança por Rise Checkout`;

  return text.trim();
}
