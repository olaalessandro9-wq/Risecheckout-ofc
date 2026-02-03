/**
 * Email Templates - Members Area Delivery
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * Template para confirmação de compra com acesso à área de membros.
 * O link é gerado automaticamente para /minha-conta/produtos/{productId}
 * Uses centralized helpers for zero hardcoded URLs/emails.
 * 
 * @version 2.0.0
 */

import { PurchaseConfirmationData, formatCurrency, getLogoUrl } from "./email-templates-base.ts";
import { getSiteBaseUrl } from "./site-urls.ts";
import { getSupportEmail } from "./email-config.ts";

// ============================================================================
// MEMBERS AREA CONFIRMATION (HTML)
// ============================================================================

export function getMembersAreaConfirmationTemplate(data: PurchaseConfirmationData): string {
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
      .cta-section { background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 24px; border-radius: 6px; text-align: center; margin-bottom: 32px; }
      .cta-section h2 { font-size: 18px; font-weight: 600; color: #FFFFFF; margin: 0 0 8px; }
      .cta-section p { font-size: 14px; color: rgba(255,255,255,0.9); margin: 0 0 20px; }
      .cta-button { display: inline-block; background-color: #FFFFFF; color: #059669; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; }
      .info-box { background-color: #F0FDF4; border: 1px solid #86EFAC; padding: 16px; border-radius: 6px; margin-bottom: 24px; }
      .info-box p { font-size: 14px; color: #166534; margin: 0; }
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
      <img src="${getLogoUrl()}" alt="Rise Checkout Logo">
    </div>
    <div class="content">
      <h1>Sua compra foi confirmada!</h1>
      <p>Olá, ${data.customerName}, obrigado por comprar conosco. Seu pagamento foi processado com sucesso e seu acesso à área de membros está liberado!</p>
      
      <div class="cta-section">
        <h2>🎓 Acesse sua Área de Membros</h2>
        <p>Clique no botão abaixo para acessar todo o conteúdo do seu curso ou produto.</p>
        <a href="${data.deliveryUrl}" class="cta-button">Acessar Área de Membros</a>
      </div>
      
      <div class="info-box">
        <p>💡 <strong>Dica:</strong> Se for seu primeiro acesso, você precisará definir uma senha. Use o mesmo email desta compra para fazer login.</p>
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
      <p>Em caso de dúvidas sobre sua compra ou acesso, entre em contato: <a href="mailto:${data.supportEmail || getSupportEmail()}">${data.supportEmail || getSupportEmail()}</a>.</p>
    </div>
    <div class="footer">
      ${data.sellerName ? `<p>Vendido por: <strong>${data.sellerName}</strong></p>` : ''}
      <p>Pagamento processado com segurança por <strong>Rise Checkout</strong>.</p>
      <p><a href="${getSiteBaseUrl('default')}">${getSiteBaseUrl('default').replace('https://', '')}</a></p>
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Acesso Liberado - Rise Checkout</title>
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
// MEMBERS AREA CONFIRMATION (TEXT)
// ============================================================================

export function getMembersAreaConfirmationTextTemplate(data: PurchaseConfirmationData): string {
  return `
COMPRA CONFIRMADA ✓ - ACESSO LIBERADO!

Olá, ${data.customerName}!

Seu pagamento foi confirmado e seu acesso à área de membros está liberado!

🎓 ACESSE SUA ÁREA DE MEMBROS
${data.deliveryUrl}

💡 Dica: Se for seu primeiro acesso, você precisará definir uma senha.
Use o mesmo email desta compra para fazer login.

DETALHES DO PEDIDO
==================
Produto: ${data.productName}
Nº do Pedido: #${data.orderId.substring(0, 8).toUpperCase()}
${data.paymentMethod ? `Forma de Pagamento: ${data.paymentMethod}` : ''}
Total Pago: ${formatCurrency(data.amountCents)}

Em caso de dúvidas, entre em contato: ${data.supportEmail || getSupportEmail()}

${data.sellerName ? `Vendido por: ${data.sellerName}` : ''}
Processado com segurança por Rise Checkout
  `.trim();
}
