/**
 * Email Templates - Purchase Confirmation
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * Templates para confirmação de compra (cliente).
 * Uses centralized helpers for zero hardcoded URLs/emails.
 * 
 * @version 2.0.0
 */

import { PurchaseConfirmationData, formatCurrency, getLogoUrl } from "./email-templates-base.ts";
import { getSiteBaseUrl } from "./site-urls.ts";
import { getSupportEmail } from "./email-config.ts";

// ============================================================================
// PURCHASE CONFIRMATION (HTML)
// ============================================================================

export function getPurchaseConfirmationTemplate(data: PurchaseConfirmationData): string {
  const styles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background-color: #F8F9FA; color: #343A40; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      .container { max-width: 600px; margin: 40px auto; background-color: #FFFFFF; border: 1px solid #E9ECEF; border-radius: 8px; overflow: hidden; }
      .header { text-align: center; padding: 0; border-bottom: 1px solid #E9ECEF; line-height: 0; }
      .header img { display: block; width: 100%; height: auto; }
      .content { padding: 32px; }
      .content h1 { font-size: 24px; font-weight: 700; color: #212529; margin: 0 0 12px; }
      .content p { font-size: 16px; line-height: 1.6; margin: 0 0 24px; color: #495057; }
      .cta-section { background-color: #F1F3F5; padding: 24px; border-radius: 6px; text-align: center; margin-bottom: 32px; }
      .cta-section h2 { font-size: 18px; font-weight: 600; color: #212529; margin: 0 0 8px; }
      .cta-section p { font-size: 14px; color: #495057; margin: 0 0 20px; }
      .cta-button { display: inline-block; background-color: #007BFF; color: #FFFFFF; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; }
       .order-details { border: 1px solid #E9ECEF; border-radius: 6px; border-collapse: separate; border-spacing: 0; }
       .order-header td { font-size: 18px; font-weight: 700; color: #212529; padding: 20px; border-bottom: 1px solid #E9ECEF; }
       .order-item td { padding: 16px 20px; border-bottom: 1px solid #E9ECEF; }
      .order-label { font-size: 14px; color: #495057; }
      .order-value { font-size: 14px; font-weight: 600; color: #212529; }
       .total-row td { padding: 20px; background-color: #F8F9FA; font-size: 18px; font-weight: 700; color: #212529; }
       .support { text-align: center; padding: 24px 32px 16px; font-size: 14px; color: #6C757D; border-top: 1px solid #E9ECEF; }
      .support a { color: #007BFF; text-decoration: none; font-weight: 600; }
       .footer { background-color: transparent; padding: 0 24px 24px; text-align: center; font-size: 12px; color: #6C757D; }
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
      <p>Olá, ${data.customerName}, obrigado por comprar conosco. Seu pagamento foi processado com sucesso e os detalhes do seu pedido estão logo abaixo.</p>
      
      ${data.deliveryUrl ? `
      <div class="cta-section">
        <h2>Seu acesso está liberado!</h2>
        <p>Clique no botão abaixo para acessar o conteúdo que você adquiriu.</p>
        <a href="${data.deliveryUrl}" class="cta-button">Acessar meu produto</a>
      </div>
      ` : ''}

       <table class="order-details" width="100%" cellpadding="0" cellspacing="0">
         <tr class="order-header">
           <td colspan="2">Resumo do Pedido</td>
         </tr>
         <tr class="order-item">
           <td class="order-label">Produto: </td>
           <td class="order-value">${data.productName}</td>
         </tr>
         <tr class="order-item">
           <td class="order-label">Nº do Pedido: </td>
           <td class="order-value">#${data.orderId.substring(0, 8).toUpperCase()}</td>
         </tr>
         ${data.paymentMethod ? `
         <tr class="order-item">
           <td class="order-label">Forma de Pagamento: </td>
           <td class="order-value">${data.paymentMethod}</td>
         </tr>
         ` : ''}
         <tr class="total-row">
           <td>Total: </td>
           <td style="text-align: right;">${formatCurrency(data.amountCents)}</td>
         </tr>
       </table>
    </div>
    <div class="support">
      <p>Em caso de dúvidas sobre sua compra, responda a este email ou entre em contato diretamente com o vendedor através do email: <a href="mailto:${data.supportEmail || getSupportEmail()}">${data.supportEmail || getSupportEmail()}</a>.</p>
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
      <title>Confirmação de Compra - Rise Checkout</title>
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
// PURCHASE CONFIRMATION (TEXT)
// ============================================================================

export function getPurchaseConfirmationTextTemplate(data: PurchaseConfirmationData): string {
  let text = `
COMPRA CONFIRMADA ✓

Olá, ${data.customerName}!

Seu pagamento foi confirmado e sua compra foi processada com sucesso.
`;

  if (data.deliveryUrl) {
    text += `
🎉 SEU ACESSO ESTÁ LIBERADO!
Acesse seu produto: ${data.deliveryUrl}
`;
  }

  text += `
DETALHES DO PEDIDO
==================
Produto: ${data.productName}
Nº do Pedido: #${data.orderId.substring(0, 8).toUpperCase()}
${data.paymentMethod ? `Forma de Pagamento: ${data.paymentMethod}` : ''}
Total Pago: ${formatCurrency(data.amountCents)}

Em caso de dúvidas, entre em contato: ${data.supportEmail || getSupportEmail()}

${data.sellerName ? `Vendido por: ${data.sellerName}` : ''}
Processado com segurança por Rise Checkout
  `;
  
  return text.trim();
}
