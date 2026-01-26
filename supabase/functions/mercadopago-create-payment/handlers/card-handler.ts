/**
 * Handler para pagamentos com Cartão de Crédito no Mercado Pago
 * Recebe parâmetros validados e retorna resultado padronizado
 * 
 * @version 2.0.0 - RISE ARCHITECT PROTOCOL V3 - 10.0/10 (Zero any)
 */

import { createLogger } from '../../_shared/logger.ts';
import { fetchWithTimeout } from '../../_shared/http-client.ts';

const log = createLogger('mercadopago-card-handler');
const API_TIMEOUT = 15000; // 15 segundos

// === INTERFACES (Zero any) ===

export interface CardPaymentParams {
  orderId: string;
  calculatedTotalCents: number;
  payerEmail: string;
  payerName?: string;
  payerDocument?: string;
  token: string;
  installments: number;
  paymentMethodId: string;
  issuerId?: string;
  effectiveAccessToken: string;
  applicationFeeCents: number;
  productId?: string;
  productName?: string;
  items?: Array<{
    product_id: string;
    product_name: string;
    amount_cents: number;
    quantity: number;
  }>;
}

export interface CardPaymentResult {
  success: boolean;
  transactionId: string;
  status: string;
}

interface AdditionalInfoItem {
  id: string;
  title: string;
  description: string;
  category_id: string;
  quantity: number;
  unit_price: number;
}

interface PayerIdentification {
  type: string;
  number: string;
}

interface CardPayload {
  transaction_amount: number;
  token: string;
  description: string;
  installments: number;
  payment_method_id: string;
  external_reference: string;
  notification_url: string;
  statement_descriptor: string;
  additional_info: {
    items: AdditionalInfoItem[];
  };
  payer: {
    email: string;
    first_name: string;
    last_name: string;
    identification?: PayerIdentification;
  };
  issuer_id?: number;
  application_fee?: number;
}

interface MercadoPagoCardResponse {
  id: number;
  status: string;
  message?: string;
  cause?: unknown;
}

// === MAIN HANDLER ===

export async function handleCardPayment(params: CardPaymentParams): Promise<CardPaymentResult> {
  const { 
    orderId, 
    calculatedTotalCents, 
    payerEmail, 
    payerName, 
    payerDocument,
    token, 
    installments, 
    paymentMethodId, 
    issuerId, 
    effectiveAccessToken, 
    applicationFeeCents,
    productId,
    productName,
    items
  } = params;

  // Validação crítica - paymentMethodId é OBRIGATÓRIO
  if (!paymentMethodId) {
    log.error('paymentMethodId não foi fornecido', { orderId });
    throw { 
      code: 'INVALID_REQUEST', 
      message: 'Bandeira do cartão (paymentMethodId) não identificada. Verifique o número do cartão.' 
    };
  }

  // ✅ Montar additional_info.items para qualidade MP
  const additionalInfoItems: AdditionalInfoItem[] = items && items.length > 0 
    ? items.map(item => ({
        id: item.product_id.slice(0, 50),
        title: (item.product_name || 'Produto').slice(0, 256),
        description: (item.product_name || 'Produto digital').slice(0, 256),
        category_id: 'digital_goods',
        quantity: item.quantity,
        unit_price: item.amount_cents / 100
      }))
    : [{
        id: productId?.slice(0, 50) || orderId.slice(0, 8),
        title: (productName || `Pedido ${orderId.slice(0, 8)}`).slice(0, 256),
        description: (productName || 'Produto digital').slice(0, 256),
        category_id: 'digital_goods',
        quantity: 1,
        unit_price: calculatedTotalCents / 100
      }];

  // ✅ URL do webhook para notificações
  const notificationUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`;

  const cardPayload: CardPayload = {
    transaction_amount: calculatedTotalCents / 100,
    token: token,
    description: `Pedido #${orderId.slice(0, 8)}`,
    installments: installments || 1,
    payment_method_id: paymentMethodId,
    
    // ✅ CAMPOS OBRIGATÓRIOS PARA QUALIDADE MP
    external_reference: orderId,
    notification_url: notificationUrl,
    statement_descriptor: 'RISECHECKOUT',
    
    // ✅ ADDITIONAL_INFO COM ITEMS
    additional_info: {
      items: additionalInfoItems
    },
    
    payer: {
      email: payerEmail,
      first_name: payerName?.split(' ')[0] || 'Cliente',
      last_name: payerName?.split(' ').slice(1).join(' ') || '',
      identification: payerDocument ? {
        type: payerDocument.length <= 11 ? 'CPF' : 'CNPJ',
        number: payerDocument.replace(/\D/g, '')
      } : undefined
    }
  };

  // Adicionar issuer_id se disponível
  if (issuerId) {
    cardPayload.issuer_id = Number(issuerId);
  }

  // SPLIT via application_fee (Modelo CAKTO)
  if (applicationFeeCents > 0) {
    cardPayload.application_fee = applicationFeeCents / 100;
    log.info('application_fee ADICIONADO', {
      cents: applicationFeeCents,
      reais: applicationFeeCents / 100,
      modelo: 'CAKTO'
    });
  }

  log.info('Enviando para Mercado Pago', {
    amount: cardPayload.transaction_amount,
    installments: cardPayload.installments,
    payment_method_id: cardPayload.payment_method_id,
    issuer_id: cardPayload.issuer_id || 'não informado',
    has_payer_document: !!payerDocument,
    has_application_fee: applicationFeeCents > 0
  });

  // RISE V3: HTTP com timeout
  const cardResponse = await fetchWithTimeout('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${effectiveAccessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `${orderId}-card`
    },
    body: JSON.stringify(cardPayload)
  }, API_TIMEOUT);

  const cardData: MercadoPagoCardResponse = await cardResponse.json();

  if (!cardResponse.ok) {
    log.error('Erro na API do Mercado Pago (Cartão)', {
      message: cardData.message,
      status: cardData.status,
      cause: cardData.cause,
      payment_method_id_usado: cardPayload.payment_method_id,
      issuer_id_usado: cardPayload.issuer_id
    });
    throw { 
      code: 'GATEWAY_API_ERROR', 
      message: cardData.message || 'Erro ao processar cartão', 
      details: cardData 
    };
  }

  log.info('Pagamento criado', { 
    id: cardData.id, 
    status: cardData.status 
  });

  return {
    success: true,
    transactionId: String(cardData.id),
    status: cardData.status
  };
}
