/**
 * Email Templates - Payment Pending
 * 
 * Templates para pagamento pendente (PIX, boleto).
 * 
 * RISE Protocol Compliant - < 100 linhas
 */

import { PaymentPendingData, formatCurrency, getEmailWrapper } from "./email-templates-base.ts";

// ============================================================================
// PAYMENT PENDING (HTML)
// ============================================================================

export function getPaymentPendingTemplate(data: PaymentPendingData): string {
  const content = `
    <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
      <span class="success-badge" style="background-color: rgba(255,255,255,0.2);">⏳ Aguardando Pagamento</span>
      <h1 style="margin-top: 16px;">Pedido Criado com Sucesso!</h1>
      <p class="subtitle">Complete o pagamento para confirmar sua compra</p>
    </div>
    
    <div class="content">
      <p class="greeting">Olá, ${data.customerName}!</p>
      
      <p class="message">
        Seu pedido foi criado. Complete o pagamento para garantir sua compra.
      </p>
      
      <div class="order-box">
        <h3>Detalhes do Pedido</h3>
        
        <div class="order-row">
          <span class="order-label">Produto</span>
          <span class="order-value">${data.productName}</span>
        </div>
        
        <div class="order-row">
          <span class="order-label">Nº do Pedido</span>
          <span class="order-value">#${data.orderId.substring(0, 8).toUpperCase()}</span>
        </div>
        
        <div class="total-row" style="background-color: #f59e0b;">
          <div class="order-row" style="border: none; padding: 0;">
            <span class="order-label">Valor a Pagar</span>
            <span class="order-value">${formatCurrency(data.amountCents)}</span>
          </div>
        </div>
      </div>
      
      ${data.pixQrCode ? `
      <p class="message" style="text-align: center;">
        <strong>Escaneie o QR Code abaixo para pagar:</strong>
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <img src="data:image/png;base64,${data.pixQrCode}" alt="QR Code PIX" style="max-width: 200px; border-radius: 8px;"/>
      </div>
      ` : ''}
      
      <p class="message">
        ⚠️ O pagamento expira em algumas horas. Não perca sua compra!
      </p>
    </div>
    
    <div class="footer">
      <p>Processado com segurança por Rise Checkout</p>
    </div>
  `;
  
  return getEmailWrapper(content);
}

// ============================================================================
// PAYMENT PENDING (TEXT)
// ============================================================================

export function getPaymentPendingTextTemplate(data: PaymentPendingData): string {
  return `
⏳ AGUARDANDO PAGAMENTO

Olá, ${data.customerName}!

Seu pedido foi criado. Complete o pagamento para garantir sua compra.

DETALHES DO PEDIDO
==================
Produto: ${data.productName}
Nº do Pedido: #${data.orderId.substring(0, 8).toUpperCase()}
Valor a Pagar: ${formatCurrency(data.amountCents)}

⚠️ O pagamento expira em algumas horas. Não perca sua compra!

Processado com segurança por Rise Checkout
  `.trim();
}
