/**
 * Email Templates - Seller Notifications
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * Template para notificação de nova venda ao vendedor.
 * Usa <style> + classes (padrão unificado Gmail-compatible).
 * 
 * @version 2.0.0
 */

import { NewSaleData, formatCurrency, getLogoUrl } from "./email-templates-base.ts";
import { getSiteBaseUrl } from "./site-urls.ts";

// ============================================================================
// NEW SALE TEMPLATE (<style> + classes - Gmail Compatible)
// ============================================================================

export function getNewSaleTemplate(data: NewSaleData): string {
  const logoUrl = getLogoUrl();
  const siteUrl = getSiteBaseUrl('default');
  const siteDomain = siteUrl.replace('https://', '');

  const styles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background-color: #F8F9FA; color: #343A40; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      .container { max-width: 600px; margin: 40px auto; background-color: #FFFFFF; border: 1px solid #E9ECEF; border-radius: 8px; overflow: hidden; }
      .header { text-align: center; padding: 0; line-height: 0; }
      .header img { display: block; width: 100%; max-width: 400px; height: auto; margin: 0 auto; }
      .content { padding: 32px; }
      .success-banner { background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 24px; border-radius: 6px; text-align: center; margin-bottom: 24px; }
      .success-badge { display: inline-block; background-color: rgba(255,255,255,0.2); color: #FFFFFF; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
      .success-banner h1 { font-size: 22px; font-weight: 700; color: #FFFFFF; margin: 16px 0 4px; }
      .success-banner p { font-size: 14px; color: rgba(255,255,255,0.9); margin: 0; }
      .greeting { font-size: 18px; font-weight: 600; color: #212529; margin: 0 0 12px; }
      .message { font-size: 16px; line-height: 1.6; color: #495057; margin: 0 0 24px; }
      .order-details { border: 1px solid #E9ECEF; border-radius: 6px; overflow: hidden; }
      .order-details h2 { font-size: 14px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; padding: 16px 20px; background-color: #F8F9FA; border-bottom: 1px solid #E9ECEF; }
      .order-item { display: flex; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid #E9ECEF; }
      .order-item:last-of-type { border-bottom: none; }
      .order-label { font-size: 14px; color: #6B7280; }
      .order-value { font-size: 14px; font-weight: 500; color: #212529; }
      .total-row { display: flex; justify-content: space-between; padding: 16px 20px; background-color: #10B981; }
      .total-row .order-label, .total-row .order-value { color: #FFFFFF; font-weight: 600; font-size: 16px; }
      .cta-message { text-align: center; padding: 24px 0 0; font-size: 14px; color: #6C757D; }
      .footer { text-align: center; padding: 24px 32px; font-size: 12px; color: #6C757D; border-top: 1px solid #E9ECEF; }
      .footer p { margin: 0 0 4px; }
      .footer a { color: #495057; text-decoration: none; font-weight: 600; }
    </style>
  `;

  // Payment method row (optional)
  const paymentMethodRow = data.paymentMethod ? `
        <div class="order-item">
          <span class="order-label">Forma de Pagamento</span>
          <span class="order-value">${data.paymentMethod}</span>
        </div>` : '';

  // Gateway row (optional)
  const gatewayRow = data.gateway ? `
        <div class="order-item">
          <span class="order-label">Gateway</span>
          <span class="order-value">${data.gateway}</span>
        </div>` : '';

  const content = `
    <div class="header">
      <img src="${logoUrl}" alt="Rise Checkout" width="400">
    </div>
    <div class="content">
      <div class="success-banner">
        <span class="success-badge">💰 Nova Venda!</span>
        <h1>Você realizou uma venda!</h1>
        <p>Parabéns pelo seu sucesso</p>
      </div>
      
      <p class="greeting">Olá, ${data.sellerName}!</p>
      <p class="message">Você acaba de realizar uma nova venda. Confira os detalhes abaixo.</p>
      
      <div class="order-details">
        <h2>Detalhes da Venda</h2>
        <div class="order-item">
          <span class="order-label">Produto</span>
          <span class="order-value">${data.productName}</span>
        </div>
        <div class="order-item">
          <span class="order-label">Cliente</span>
          <span class="order-value">${data.customerName}</span>
        </div>
        <div class="order-item">
          <span class="order-label">Email</span>
          <span class="order-value">${data.customerEmail}</span>
        </div>
        <div class="order-item">
          <span class="order-label">Nº do Pedido</span>
          <span class="order-value">#${data.orderId.substring(0, 8).toUpperCase()}</span>
        </div>
        ${paymentMethodRow}
        ${gatewayRow}
        <div class="total-row">
          <span class="order-label">Valor da Venda</span>
          <span class="order-value">${formatCurrency(data.amountCents)}</span>
        </div>
      </div>
      
      <p class="cta-message">Acesse seu painel para ver mais detalhes sobre esta e outras vendas.</p>
    </div>
    <div class="footer">
      <p><strong>Rise Checkout</strong> - Sua plataforma de vendas</p>
      <p><a href="${siteUrl}">${siteDomain}</a></p>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nova Venda - Rise Checkout</title>
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

export function getNewSaleTextTemplate(data: NewSaleData): string {
  let text = `💰 NOVA VENDA!

Olá, ${data.sellerName}!

Você acaba de realizar uma nova venda!

DETALHES DA VENDA
==================
Produto: ${data.productName}
Cliente: ${data.customerName}
Email: ${data.customerEmail}
Nº do Pedido: #${data.orderId.substring(0, 8).toUpperCase()}`;

  if (data.paymentMethod) {
    text += `\nForma de Pagamento: ${data.paymentMethod}`;
  }
  if (data.gateway) {
    text += `\nGateway: ${data.gateway}`;
  }

  text += `\nValor da Venda: ${formatCurrency(data.amountCents)}

Acesse seu painel para ver mais detalhes.

Rise Checkout - Sua plataforma de vendas`;

  return text.trim();
}
