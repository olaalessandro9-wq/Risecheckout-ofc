/**
 * ============================================================================
 * EMAIL TEMPLATES - Rise Checkout
 * ============================================================================
 * 
 * Templates HTML profissionais para emails transacionais.
 * Todos os templates são responsivos e compatíveis com os principais clientes de email.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PurchaseConfirmationData {
  customerName: string;
  productName: string;
  amountCents: number;
  orderId: string;
  paymentMethod?: string;
  sellerName?: string;
  supportEmail?: string;
  deliveryUrl?: string;
}

export interface PaymentPendingData {
  customerName: string;
  productName: string;
  amountCents: number;
  orderId: string;
  pixQrCode?: string;
}

export interface NewSaleData {
  sellerName: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  amountCents: number;
  orderId: string;
  paymentMethod?: string;
  gateway?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(amountCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amountCents / 100);
}

function getBaseStyles(): string {
  return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #1a1a1a;
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
      }
      
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
      }
      
      .header {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        padding: 40px 30px;
        text-align: center;
      }
      
      .header h1 {
        color: #ffffff;
        margin: 0;
        font-size: 24px;
        font-weight: 700;
      }
      
      .header .subtitle {
        color: rgba(255, 255, 255, 0.9);
        margin-top: 8px;
        font-size: 14px;
      }
      
      .content {
        padding: 40px 30px;
      }
      
      .greeting {
        font-size: 18px;
        font-weight: 600;
        color: #1a1a1a;
        margin-bottom: 16px;
      }
      
      .message {
        color: #4a4a4a;
        margin-bottom: 24px;
      }
      
      .order-box {
        background-color: #f8f9fa;
        border-radius: 12px;
        padding: 24px;
        margin: 24px 0;
      }
      
      .order-box h3 {
        margin: 0 0 16px 0;
        font-size: 14px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .order-row {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .order-row:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
      
      .order-label {
        color: #6b7280;
        font-size: 14px;
      }
      
      .order-value {
        color: #1a1a1a;
        font-weight: 500;
        font-size: 14px;
      }
      
      .total-row {
        background-color: #6366f1;
        color: #ffffff;
        margin: -24px;
        margin-top: 16px;
        padding: 16px 24px;
        border-radius: 0 0 12px 12px;
      }
      
      .total-row .order-label,
      .total-row .order-value {
        color: #ffffff;
        font-weight: 600;
        font-size: 16px;
      }
      
      .success-badge {
        display: inline-block;
        background-color: #10b981;
        color: #ffffff;
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .footer {
        background-color: #f8f9fa;
        padding: 30px;
        text-align: center;
        border-top: 1px solid #e5e7eb;
      }
      
      .footer p {
        color: #6b7280;
        font-size: 12px;
        margin: 4px 0;
      }
      
      .footer a {
        color: #6366f1;
        text-decoration: none;
      }
      
      .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: #ffffff;
        padding: 14px 32px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        font-size: 14px;
        margin: 24px 0;
      }
    </style>
  `;
}

function getEmailWrapper(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${getBaseStyles()}
    </head>
    <body>
      <div class="email-container">
        ${content}
      </div>
    </body>
    </html>
  `;
}

// ============================================================================
// TEMPLATES
// ============================================================================

/**
 * Template: Confirmação de Compra (para cliente)
 */
export function getPurchaseConfirmationTemplate(data: PurchaseConfirmationData): string {
  const content = `
    <div class="header">
      <span class="success-badge">✓ Pagamento Confirmado</span>
      <h1 style="margin-top: 16px;">Compra Realizada com Sucesso!</h1>
      <p class="subtitle">Obrigado por sua compra</p>
    </div>
    
    <div class="content">
      <p class="greeting">Olá, ${data.customerName}!</p>
      
      <p class="message">
        Seu pagamento foi confirmado e sua compra foi processada com sucesso. 
        Abaixo estão os detalhes do seu pedido.
      </p>
      
      ${data.deliveryUrl ? `
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; border-radius: 16px; margin: 24px 0; text-align: center;">
        <h3 style="color: #ffffff; margin: 0 0 8px 0; font-size: 18px; font-weight: 700;">🎉 Seu acesso está liberado!</h3>
        <p style="color: rgba(255,255,255,0.9); margin: 0 0 20px 0; font-size: 14px;">Clique no botão abaixo para acessar seu produto</p>
        <a href="${data.deliveryUrl}" style="display: inline-block; background: #ffffff; color: #059669; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(0,0,0,0.15);">
          Acessar Produto
        </a>
      </div>
      ` : ''}
      
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
        
        ${data.paymentMethod ? `
        <div class="order-row">
          <span class="order-label">Forma de Pagamento</span>
          <span class="order-value">${data.paymentMethod}</span>
        </div>
        ` : ''}
        
        <div class="total-row">
          <div class="order-row" style="border: none; padding: 0;">
            <span class="order-label">Total Pago</span>
            <span class="order-value">${formatCurrency(data.amountCents)}</span>
          </div>
        </div>
      </div>
      
      <p class="message">
        Em caso de dúvidas, entre em contato conosco através do email 
        <a href="mailto:${data.supportEmail || 'suporte@risecheckout.com'}" style="color: #6366f1;">
          ${data.supportEmail || 'suporte@risecheckout.com'}
        </a>
      </p>
    </div>
    
    <div class="footer">
      ${data.sellerName ? `<p><strong>Vendido por:</strong> ${data.sellerName}</p>` : ''}
      <p>Processado com segurança por Rise Checkout</p>
      <p style="margin-top: 16px;">
        <a href="https://risecheckout.com">Rise Checkout</a> • 
        Plataforma de Pagamentos
      </p>
    </div>
  `;
  
  return getEmailWrapper(content);
}

/**
 * Template: Texto plano para confirmação de compra
 */
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

Em caso de dúvidas, entre em contato: ${data.supportEmail || 'suporte@risecheckout.com'}

${data.sellerName ? `Vendido por: ${data.sellerName}` : ''}
Processado com segurança por Rise Checkout
  `;
  
  return text.trim();
}

/**
 * Template: Nova Venda (para vendedor)
 */
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

/**
 * Template: Texto plano para nova venda
 */
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

/**
 * Template: Pagamento Pendente/PIX Gerado (para cliente)
 */
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

/**
 * Template: Texto plano para pagamento pendente
 */
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
