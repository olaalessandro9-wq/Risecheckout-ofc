/**
 * Email Templates - Payment Pending
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * Template para pagamento pendente (PIX, boleto).
 * Usa <style> + classes (padrão unificado Gmail-compatible).
 * 
 * @version 2.0.0
 */

import { PaymentPendingData, formatCurrency, getLogoUrl } from "./email-templates-base.ts";
import { getSiteBaseUrl } from "./site-urls.ts";

// ============================================================================
// PAYMENT PENDING TEMPLATE (<style> + classes - Gmail Compatible)
// ============================================================================

export function getPaymentPendingTemplate(data: PaymentPendingData): string {
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
      .pending-banner { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 24px; border-radius: 6px; text-align: center; margin-bottom: 24px; }
      .pending-badge { display: inline-block; background-color: rgba(255,255,255,0.2); color: #FFFFFF; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
      .pending-banner h1 { font-size: 22px; font-weight: 700; color: #FFFFFF; margin: 16px 0 4px; }
      .pending-banner p { font-size: 14px; color: rgba(255,255,255,0.9); margin: 0; }
      .greeting { font-size: 18px; font-weight: 600; color: #212529; margin: 0 0 12px; }
      .message { font-size: 16px; line-height: 1.6; color: #495057; margin: 0 0 24px; }
      .order-details { border: 1px solid #E9ECEF; border-radius: 6px; overflow: hidden; margin-bottom: 24px; }
      .order-details h2 { font-size: 14px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; padding: 16px 20px; background-color: #F8F9FA; border-bottom: 1px solid #E9ECEF; }
      .order-item { display: flex; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid #E9ECEF; }
      .order-item:last-of-type { border-bottom: none; }
      .order-label { font-size: 14px; color: #6B7280; }
      .order-value { font-size: 14px; font-weight: 500; color: #212529; }
      .total-row { display: flex; justify-content: space-between; padding: 16px 20px; background-color: #F59E0B; }
      .total-row .order-label, .total-row .order-value { color: #FFFFFF; font-weight: 600; font-size: 16px; }
      .qr-section { text-align: center; margin: 24px 0; }
      .qr-section p { font-size: 14px; font-weight: 600; color: #212529; margin: 0 0 16px; }
      .qr-section img { max-width: 200px; border-radius: 8px; border: 1px solid #E9ECEF; }
      .warning-message { font-size: 14px; color: #B45309; background-color: #FEF3C7; padding: 16px; border-radius: 6px; text-align: center; margin: 0; }
      .footer { text-align: center; padding: 24px 32px; font-size: 12px; color: #6C757D; border-top: 1px solid #E9ECEF; }
      .footer p { margin: 0 0 4px; }
      .footer a { color: #495057; text-decoration: none; font-weight: 600; }
    </style>
  `;

  // QR Code section (optional)
  const qrSection = data.pixQrCode ? `
      <div class="qr-section">
        <p>Escaneie o QR Code abaixo para pagar:</p>
        <img src="data:image/png;base64,${data.pixQrCode}" alt="QR Code PIX">
      </div>` : '';

  const content = `
    <div class="header">
      <img src="${logoUrl}" alt="Rise Checkout" width="400">
    </div>
    <div class="content">
      <div class="pending-banner">
        <span class="pending-badge">⏳ Aguardando Pagamento</span>
        <h1>Pedido Criado com Sucesso!</h1>
        <p>Complete o pagamento para confirmar sua compra</p>
      </div>
      
      <p class="greeting">Olá, ${data.customerName}!</p>
      <p class="message">Seu pedido foi criado. Complete o pagamento para garantir sua compra.</p>
      
      <div class="order-details">
        <h2>Detalhes do Pedido</h2>
        <div class="order-item">
          <span class="order-label">Produto</span>
          <span class="order-value">${data.productName}</span>
        </div>
        <div class="order-item">
          <span class="order-label">Nº do Pedido</span>
          <span class="order-value">#${data.orderId.substring(0, 8).toUpperCase()}</span>
        </div>
        <div class="total-row">
          <span class="order-label">Valor a Pagar</span>
          <span class="order-value">${formatCurrency(data.amountCents)}</span>
        </div>
      </div>
      
      ${qrSection}
      
      <p class="warning-message">⚠️ O pagamento expira em algumas horas. Não perca sua compra!</p>
    </div>
    <div class="footer">
      <p>Processado com segurança por <strong>Rise Checkout</strong></p>
      <p><a href="${siteUrl}">${siteDomain}</a></p>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pagamento Pendente - Rise Checkout</title>
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

export function getPaymentPendingTextTemplate(data: PaymentPendingData): string {
  return `⏳ AGUARDANDO PAGAMENTO

Olá, ${data.customerName}!

Seu pedido foi criado. Complete o pagamento para garantir sua compra.

DETALHES DO PEDIDO
==================
Produto: ${data.productName}
Nº do Pedido: #${data.orderId.substring(0, 8).toUpperCase()}
Valor a Pagar: ${formatCurrency(data.amountCents)}

⚠️ O pagamento expira em algumas horas. Não perca sua compra!

Processado com segurança por Rise Checkout`.trim();
}
