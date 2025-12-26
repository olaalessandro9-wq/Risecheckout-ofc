/**
 * Handlers para pagamentos Mercado Pago - Cartão de Crédito
 */

import { logInfo, logError } from '../utils/logger.ts';

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
}

export async function handleCardPayment(params: CardPaymentParams) {
  const { 
    orderId, calculatedTotalCents, payerEmail, payerName, payerDocument,
    token, installments, paymentMethodId, issuerId, effectiveAccessToken, applicationFeeCents 
  } = params;

  if (!paymentMethodId) {
    logError('❌ [CARTÃO] paymentMethodId não foi fornecido!', { orderId });
    throw { code: 'INVALID_REQUEST', message: 'Bandeira do cartão não identificada.' };
  }

  const cardPayload: any = {
    transaction_amount: calculatedTotalCents / 100,
    token: token,
    description: `Pedido #${orderId.slice(0, 8)}`,
    installments: installments || 1,
    payment_method_id: paymentMethodId,
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

  if (issuerId) {
    cardPayload.issuer_id = Number(issuerId);
  }

  if (applicationFeeCents > 0) {
    cardPayload.application_fee = applicationFeeCents / 100;
    logInfo('✅ [MP SPLIT CARTÃO] application_fee ADICIONADO', { cents: applicationFeeCents });
  }

  logInfo('📦 [CARTÃO] Payload para MP', {
    amount: cardPayload.transaction_amount,
    installments: cardPayload.installments,
    payment_method_id: cardPayload.payment_method_id,
    has_payer_document: !!payerDocument
  });

  const cardResponse = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${effectiveAccessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `${orderId}-card`
    },
    body: JSON.stringify(cardPayload)
  });

  const cardData = await cardResponse.json();

  if (!cardResponse.ok) {
    logError('Erro na API do Mercado Pago (Cartão)', {
      message: cardData.message,
      cause: cardData.cause,
      payment_method_id_usado: cardPayload.payment_method_id
    });
    throw { code: 'GATEWAY_API_ERROR', message: cardData.message || 'Erro ao processar cartão', details: cardData };
  }

  return {
    success: true,
    transactionId: String(cardData.id),
    status: cardData.status
  };
}
