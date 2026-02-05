/**
 * Email Templates - Purchase Confirmation
 * 
 * RISE Protocol V3 - 10.0/10 (Gmail Anti-Clipping Edition)
 * 
 * Templates para confirmação de compra com CSS 100% inline.
 * Eliminates Gmail clipping by using inline styles only.
 * No external fonts, no <style> tags = maximum compatibility.
 * 
 * @version 3.0.0
 */

import { PurchaseConfirmationData, formatCurrency } from "./email-templates-base.ts";
import { getSiteBaseUrl } from "./site-urls.ts";
import { getSupportEmail } from "./email-config.ts";

// ============================================================================
// PURCHASE CONFIRMATION (HTML) - 100% INLINE CSS
// ============================================================================

export function getPurchaseConfirmationTemplate(data: PurchaseConfirmationData): string {
  const siteUrl = getSiteBaseUrl('default');
  const siteDomain = siteUrl.replace('https://', '');
  const supportEmail = data.supportEmail || getSupportEmail();

  // CTA section (only if deliveryUrl exists)
  const ctaSection = data.deliveryUrl ? `
<div style="background-color:#F1F3F5;padding:24px;border-radius:6px;text-align:center;margin-bottom:32px;">
<h2 style="font-size:18px;font-weight:600;color:#212529;margin:0 0 8px;">Seu acesso está liberado!</h2>
<p style="font-size:14px;color:#495057;margin:0 0 20px;">Clique no botão abaixo para acessar o conteúdo que você adquiriu.</p>
<a href="${data.deliveryUrl}" style="display:inline-block;background-color:#007BFF;color:#FFFFFF;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Acessar meu produto</a>
</div>` : '';

  // Payment method row (only if exists)
  const paymentRow = data.paymentMethod ? `
<tr>
<td style="padding:16px 20px;border-bottom:1px solid #E9ECEF;font-size:14px;color:#495057;">Forma de Pagamento: </td>
<td style="padding:16px 20px;border-bottom:1px solid #E9ECEF;font-size:14px;font-weight:600;color:#212529;">${data.paymentMethod}</td>
</tr>` : '';

  // Seller name line (only if exists)
  const sellerLine = data.sellerName 
    ? `<p style="margin:0 0 4px;font-size:12px;">Vendido por: <strong>${data.sellerName}</strong></p>` 
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Confirmação de Compra</title>
</head>
<body style="font-family:Arial,Helvetica,sans-serif;margin:0;padding:0;background-color:#F8F9FA;color:#343A40;">
<div style="max-width:600px;margin:40px auto;background-color:#FFFFFF;border:1px solid #E9ECEF;border-radius:8px;overflow:hidden;">
<div style="text-align:center;padding:0;line-height:0;">
<img src="${data.logoUrl || 'https://risecheckout.com/lovable-uploads/7f44fc00-73de-45fd-ab65-63b9a7f89339.png'}" alt="Logo" style="display:block;width:100%;max-width:400px;height:auto;margin:0 auto;">
</div>
<div style="padding:32px;">
<h1 style="font-size:24px;font-weight:700;color:#212529;margin:0 0 12px;">Sua compra foi confirmada!</h1>
<p style="font-size:16px;line-height:1.6;margin:0 0 24px;color:#495057;">Olá, ${data.customerName}, obrigado por comprar conosco. Seu pagamento foi processado com sucesso e os detalhes do seu pedido estão logo abaixo.</p>
${ctaSection}
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E9ECEF;border-radius:6px;border-collapse:separate;border-spacing:0;">
<tr>
<td colspan="2" style="font-size:18px;font-weight:700;color:#212529;padding:20px;border-bottom:1px solid #E9ECEF;">Resumo do Pedido</td>
</tr>
<tr>
<td style="padding:16px 20px;border-bottom:1px solid #E9ECEF;font-size:14px;color:#495057;">Produto: </td>
<td style="padding:16px 20px;border-bottom:1px solid #E9ECEF;font-size:14px;font-weight:600;color:#212529;">${data.productName}</td>
</tr>
<tr>
<td style="padding:16px 20px;border-bottom:1px solid #E9ECEF;font-size:14px;color:#495057;">Nº do Pedido: </td>
<td style="padding:16px 20px;border-bottom:1px solid #E9ECEF;font-size:14px;font-weight:600;color:#212529;">#${data.orderId.substring(0, 8).toUpperCase()}</td>
</tr>
${paymentRow}
<tr>
<td style="padding:20px;background-color:#F8F9FA;font-size:18px;font-weight:700;color:#212529;">Total: </td>
<td style="padding:20px;background-color:#F8F9FA;font-size:18px;font-weight:700;color:#212529;text-align:right;">${formatCurrency(data.amountCents)}</td>
</tr>
</table>
</div>
<div style="text-align:center;padding:24px 32px;font-size:14px;color:#6C757D;border-top:1px solid #E9ECEF;">
<p style="margin:0 0 16px;">Em caso de dúvidas sobre sua compra, responda a este email ou entre em contato diretamente com o vendedor através do email: <a href="mailto:${supportEmail}" style="color:#007BFF;text-decoration:none;font-weight:600;">${supportEmail}</a>.</p>
${sellerLine}
<p style="margin:0 0 4px;font-size:12px;">Pagamento processado com segurança por <strong>Rise Checkout</strong>.</p>
<p style="margin:0;font-size:12px;"><a href="${siteUrl}" style="color:#495057;text-decoration:none;font-weight:600;">${siteDomain}</a></p>
</div>
</div>
</body>
</html>`;
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
