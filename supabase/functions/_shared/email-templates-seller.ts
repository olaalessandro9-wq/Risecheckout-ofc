/**
 * Email Templates - Seller Notifications
 * 
 * Templates para notificações de vendedor (nova venda).
 * 
 * RISE Protocol Compliant - < 100 linhas
 */

import { NewSaleData, formatCurrency, getEmailWrapper } from "./email-templates-base.ts";

// ============================================================================
// NEW SALE (HTML)
// ============================================================================

export function getNewSaleTemplate(data: NewSaleData): string {
  const content = `
    <div class="header" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
      <span class="success-badge" style="background-color: rgba(255,255,255,0.2);">💰 Nova Venda!</span>
      <h1 style="margin-top: 16px;">Você realizou uma venda!</h1>
      <p class="subtitle">Parabéns pelo seu sucesso</p>
    </div>
    
    <div class="content">
      <p class="greeting">Olá, ${data.sellerName}!</p>
      
      <p class="message">
        Você acaba de realizar uma nova venda. Confira os detalhes abaixo.
      </p>
      
      <div class="order-box">
        <h3>Detalhes da Venda</h3>
        
        <div class="order-row">
          <span class="order-label">Produto</span>
          <span class="order-value">${data.productName}</span>
        </div>
        
        <div class="order-row">
          <span class="order-label">Cliente</span>
          <span class="order-value">${data.customerName}</span>
        </div>
        
        <div class="order-row">
          <span class="order-label">Email</span>
          <span class="order-value">${data.customerEmail}</span>
        </div>
        
        <div class="order-row">
          <span class="order-label">Nº do Pedido</span>
          <span class="order-value">#${data.orderId.substring(0, 8).toUpperCase()}</span>
        </div>
        
        ${data.paymentMethod ? `
        <div class="order-row">
          <span class="order-label">Forma de Pagamento</span>
          <span class="order-value">${data.paymentMethod}</span>
        </div>
        ` : ''}
        
        ${data.gateway ? `
        <div class="order-row">
          <span class="order-label">Gateway</span>
          <span class="order-value">${data.gateway}</span>
        </div>
        ` : ''}
        
        <div class="total-row" style="background-color: #10b981;">
          <div class="order-row" style="border: none; padding: 0;">
            <span class="order-label">Valor da Venda</span>
            <span class="order-value">${formatCurrency(data.amountCents)}</span>
          </div>
        </div>
      </div>
      
      <p class="message">
        Acesse seu painel para ver mais detalhes sobre esta e outras vendas.
      </p>
    </div>
    
    <div class="footer">
      <p>Rise Checkout - Sua plataforma de vendas</p>
    </div>
  `;
  
  return getEmailWrapper(content);
}

// ============================================================================
// NEW SALE (TEXT)
// ============================================================================

export function getNewSaleTextTemplate(data: NewSaleData): string {
  return `
💰 NOVA VENDA!

Olá, ${data.sellerName}!

Você acaba de realizar uma nova venda!

DETALHES DA VENDA
==================
Produto: ${data.productName}
Cliente: ${data.customerName}
Email: ${data.customerEmail}
Nº do Pedido: #${data.orderId.substring(0, 8).toUpperCase()}
${data.paymentMethod ? `Forma de Pagamento: ${data.paymentMethod}` : ''}
${data.gateway ? `Gateway: ${data.gateway}` : ''}
Valor da Venda: ${formatCurrency(data.amountCents)}

Acesse seu painel para ver mais detalhes.

Rise Checkout - Sua plataforma de vendas
  `.trim();
}
