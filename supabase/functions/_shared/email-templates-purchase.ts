/**
 * Email Templates - Purchase Confirmation (Standard Delivery)
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * Template para confirmação de compra padrão.
 * ESTRUTURA COPIADA EXATAMENTE de email-templates-payment.ts e email-templates-seller.ts
 * (templates comprovadamente funcionais no Gmail, sem truncamento).
 * 
 * @version 6.0.0
 */

import { PurchaseConfirmationData, formatCurrency, getLogoUrl } from "./email-templates-base.ts";
import { getSiteBaseUrl } from "./site-urls.ts";
import { getSupportEmail } from "./email-config.ts";

// ============================================================================
// PURCHASE CONFIRMATION TEMPLATE (Gmail Compatible - Same structure as payment/seller)
// ============================================================================

export function getPurchaseConfirmationTemplate(data: PurchaseConfirmationData): string {
  const logoUrl = getLogoUrl();
  const siteUrl = getSiteBaseUrl('default');
  const siteDomain = siteUrl.replace('https://', '');
  const supportEmail = data.supportEmail || getSupportEmail();

  const styles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background-color: #F8F9FA; color: #343A40; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      .container { max-width: 600px; margin: 40px auto; background-color: #FFFFFF; border: 1px solid #E9ECEF; border-radius: 8px; overflow: hidden; }
      .header { text-align: center; padding: 0; line-height: 0; }
      .header img { display: block; width: 100%; max-width: 400px; height: auto; margin: 0 auto; }
      .content { padding: 32px; }
      .success-banner { background-color: #F8F9FA; padding: 24px; border-radius: 6px; text-align: center; margin-bottom: 24px; border: 1px solid #E9ECEF; }
      .success-badge { display: inline-block; background-color: #E9ECEF; color: #495057; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
      .success-banner h1 { font-size: 22px; font-weight: 700; color: #212529; margin: 16px 0 4px; }
      .success-banner p { font-size: 14px; color: #6B7280; margin: 0; }
      .greeting { font-size: 18px; font-weight: 600; color: #212529; margin: 0 0 12px; }
      .message { font-size: 16px; line-height: 1.6; color: #495057; margin: 0 0 24px; }
      .cta-section { background-color: #F1F3F5; padding: 24px; border-radius: 6px; text-align: center; margin-bottom: 24px; }
      .cta-section h2 { font-size: 18px; font-weight: 600; color: #212529; margin: 0 0 8px; }
      .cta-section p { font-size: 14px; color: #495057; margin: 0 0 20px; }
      .cta-button { display: inline-block; background-color: #007BFF; color: #FFFFFF; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; }
      .order-details { border: 1px solid #E9ECEF; border-radius: 6px; overflow: hidden; }
      .order-details h2 { font-size: 14px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; padding: 16px 20px; background-color: #F8F9FA; border-bottom: 1px solid #E9ECEF; }
      .order-item { display: flex; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid #E9ECEF; }
      .order-item:last-of-type { border-bottom: none; }
      .order-label { font-size: 14px; color: #6B7280; }
      .order-value { font-size: 14px; font-weight: 500; color: #212529; }
      .total-row { display: flex; justify-content: space-between; padding: 16px 20px; background-color: #007BFF; }
      .total-row .order-label, .total-row .order-value { color: #FFFFFF; font-weight: 600; font-size: 16px; }
      .support-message { text-align: center; padding: 24px 0 0; font-size: 14px; color: #6C757D; }
      .support-message a { color: #007BFF; text-decoration: none; font-weight: 600; }
      .footer { text-align: center; padding: 24px 32px; font-size: 12px; color: #6C757D; border-top: 1px solid #E9ECEF; }
      .footer p { margin: 0 0 4px; }
      .footer a { color: #495057; text-decoration: none; font-weight: 600; }
    </style>
  `;

  // CTA section (optional - only when deliveryUrl exists)
  const ctaSection = data.deliveryUrl ? `
      <div class="cta-section">
        <h2>Seu acesso está liberado!</h2>
        <p>Clique no botão abaixo para acessar o conteúdo.</p>
        <a href="${data.deliveryUrl}" class="cta-button">Acessar meu produto</a>
      </div>` : '';

  // Payment method row (optional)
  const paymentMethodRow = data.paymentMethod ? `
        <div class="order-item">
          <span class="order-label">Forma de Pagamento</span>
          <span class="order-value">${data.paymentMethod}</span>
        </div>` : '';

  const content = `
    <div class="header">
      <img src="${logoUrl}" alt="Rise Checkout" width="400">
    </div>
    <div class="content">
      <div class="success-banner">
        <span class="success-badge">✓ Compra Confirmada</span>
        <h1>Sua compra foi confirmada!</h1>
        <p>Pagamento processado com sucesso</p>
      </div>
      
      <p class="greeting">Olá, ${data.customerName}!</p>
      <p class="message">Obrigado por comprar conosco. Seu pagamento foi processado com sucesso.</p>
      
      ${ctaSection}
      
      <div class="order-details">
        <h2>Resumo do Pedido</h2>
        <div class="order-item">
          <span class="order-label">Produto</span>
          <span class="order-value">${data.productName}</span>
        </div>
        <div class="order-item">
          <span class="order-label">Nº do Pedido</span>
          <span class="order-value">#${data.orderId.substring(0, 8).toUpperCase()}</span>
        </div>
        ${paymentMethodRow}
        <div class="total-row">
          <span class="order-label">Total</span>
          <span class="order-value">${formatCurrency(data.amountCents)}</span>
        </div>
      </div>
      
      <p class="support-message">Em caso de dúvidas, entre em contato: <a href="mailto:${supportEmail}">${supportEmail}</a></p>
    </div>
    <div class="footer">
      ${data.sellerName ? `<p>Vendido por: <strong>${data.sellerName}</strong></p>` : ''}
      <p>Processado com segurança por <strong>Rise Checkout</strong></p>
      <p><a href="${siteUrl}">${siteDomain}</a></p>
    </div>
  `;

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
    ${content}
  </div>
</body>
</html>`;
}

// ============================================================================
// TEXT VERSION
// ============================================================================

export function getPurchaseConfirmationTextTemplate(data: PurchaseConfirmationData): string {
  const supportEmail = data.supportEmail || getSupportEmail();
  
  let text = `✓ COMPRA CONFIRMADA

Olá, ${data.customerName}!

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
Nº do Pedido: #${data.orderId.substring(0, 8).toUpperCase()}`;

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
