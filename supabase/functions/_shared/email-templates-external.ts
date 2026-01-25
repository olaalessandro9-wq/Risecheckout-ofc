/**
 * Email Templates - External Delivery Confirmation
 * 
 * Template para confirmação de compra quando a entrega é externa.
 * O vendedor fará a entrega por sistema próprio (webhook, N8N, etc).
 * 
 * IMPORTANTE: Este template NÃO inclui botão de acesso ao produto.
 * 
 * RISE Protocol Compliant - < 150 linhas
 */

import { PurchaseConfirmationData, formatCurrency } from "./email-templates-base.ts";

// ============================================================================
// EXTERNAL DELIVERY CONFIRMATION (HTML)
// ============================================================================

export function getExternalDeliveryConfirmationTemplate(data: PurchaseConfirmationData): string {
  const styles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background-color: #F8F9FA; color: #343A40; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      .container { max-width: 600px; margin: 40px auto; background-color: #FFFFFF; border: 1px solid #E9ECEF; border-radius: 8px; overflow: hidden; }
      .header { text-align: center; padding: 40px 20px; border-bottom: 1px solid #E9ECEF; }
      .header img { max-width: 180px; }
      .content { padding: 32px; }
      .content h1 { font-size: 24px; font-weight: 700; color: #212529; margin: 0 0 12px; }
      .content p { font-size: 16px; line-height: 1.6; margin: 0 0 24px; color: #495057; }
      .info-section { background-color: #E8F4FD; border: 1px solid #B8DAFF; padding: 24px; border-radius: 6px; text-align: center; margin-bottom: 32px; }
      .info-section h2 { font-size: 18px; font-weight: 600; color: #0D6EFD; margin: 0 0 8px; }
      .info-section p { font-size: 14px; color: #495057; margin: 0; }
      .order-details { border: 1px solid #E9ECEF; border-radius: 6px; }
      .order-details h2 { font-size: 18px; font-weight: 700; color: #212529; margin: 0; padding: 20px; border-bottom: 1px solid #E9ECEF; }
      .order-item { display: flex; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #E9ECEF; }
      .order-item:last-child { border-bottom: none; }
      .order-label { font-size: 14px; color: #495057; }
      .order-value { font-size: 14px; font-weight: 600; color: #212529; }
      .total-row { display: flex; justify-content: space-between; padding: 20px; background-color: #F8F9FA; font-size: 18px; font-weight: 700; }
      .support { text-align: center; padding: 32px; font-size: 14px; color: #6C757D; }
      .support a { color: #007BFF; text-decoration: none; font-weight: 600; }
      .footer { background-color: #F8F9FA; padding: 24px; text-align: center; font-size: 12px; color: #6C757D; }
      .footer p { margin: 0 0 4px; }
      .footer a { color: #495057; text-decoration: none; font-weight: 600; }
    </style>
  `;

  const content = `
    <div class="header">
      <img src="https://www.risecheckout.com/logo-risecheckout-v2.png" alt="Rise Checkout Logo">
    </div>
    <div class="content">
      <h1>Pagamento confirmado!</h1>
      <p>Olá, ${data.customerName}, obrigado por comprar conosco. Seu pagamento foi processado com sucesso.</p>
      
      <div class="info-section">
        <h2>📦 Sobre a entrega do seu produto</h2>
        <p>O vendedor entrará em contato em breve para realizar a entrega do seu produto.</p>
        <p style="margin-top: 8px; font-size: 13px; color: #6C757D;">
          Se não receber contato em até 24 horas, entre em contato diretamente com o suporte abaixo.
        </p>
      </div>

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
        ${data.paymentMethod ? `
        <div class="order-item">
          <span class="order-label">Forma de Pagamento</span>
          <span class="order-value">${data.paymentMethod}</span>
        </div>
        ` : ''}
        <div class="total-row">
          <span>Total</span>
          <span>${formatCurrency(data.amountCents)}</span>
        </div>
      </div>
    </div>
    <div class="support">
      <p>Em caso de dúvidas sobre sua compra ou entrega, entre em contato diretamente com o vendedor através do email: <a href="mailto:${data.supportEmail || 'suporte@risecheckout.com'}">${data.supportEmail || 'suporte@risecheckout.com'}</a>.</p>
    </div>
    <div class="footer">
      ${data.sellerName ? `<p>Vendido por: <strong>${data.sellerName}</strong></p>` : ''}
      <p>Pagamento processado com segurança por <strong>Rise Checkout</strong>.</p>
      <p><a href="https://risecheckout.com">risecheckout.com</a></p>
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pagamento Confirmado - Rise Checkout</title>
      ${styles}
    </head>
    <body>
      <div class="container">
        ${content}
      </div>
    </body>
    </html>
  `;
}

// ============================================================================
// EXTERNAL DELIVERY CONFIRMATION (TEXT)
// ============================================================================

export function getExternalDeliveryConfirmationTextTemplate(data: PurchaseConfirmationData): string {
  return `
PAGAMENTO CONFIRMADO ✓

Olá, ${data.customerName}!

Seu pagamento foi confirmado e sua compra foi processada com sucesso.

📦 SOBRE A ENTREGA DO SEU PRODUTO
O vendedor entrará em contato em breve para realizar a entrega do seu produto.
Se não receber contato em até 24 horas, entre em contato diretamente com o suporte.

DETALHES DO PEDIDO
==================
Produto: ${data.productName}
Nº do Pedido: #${data.orderId.substring(0, 8).toUpperCase()}
${data.paymentMethod ? `Forma de Pagamento: ${data.paymentMethod}` : ''}
Total Pago: ${formatCurrency(data.amountCents)}

Em caso de dúvidas sobre sua compra ou entrega, entre em contato: ${data.supportEmail || 'suporte@risecheckout.com'}

${data.sellerName ? `Vendido por: ${data.sellerName}` : ''}
Processado com segurança por Rise Checkout
  `.trim();
}
