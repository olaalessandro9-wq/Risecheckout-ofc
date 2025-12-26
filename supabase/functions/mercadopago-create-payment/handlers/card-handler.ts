/**
 * Handler para pagamentos com Cartão de Crédito no Mercado Pago
 * Recebe parâmetros validados e retorna resultado padronizado
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

export interface CardPaymentResult {
  success: boolean;
  transactionId: string;
  status: string;
}

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
    applicationFeeCents 
  } = params;

  // Validação crítica - paymentMethodId é OBRIGATÓRIO
  if (!paymentMethodId) {
    logError('❌ [CARTÃO] paymentMethodId não foi fornecido!', { orderId });
    throw { 
      code: 'INVALID_REQUEST', 
      message: 'Bandeira do cartão (paymentMethodId) não identificada. Verifique o número do cartão.' 
    };
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

  // Adicionar issuer_id se disponível
  if (issuerId) {
    cardPayload.issuer_id = Number(issuerId);
  }

  // SPLIT via application_fee (Modelo CAKTO)
  if (applicationFeeCents > 0) {
    cardPayload.application_fee = applicationFeeCents / 100;
    logInfo('✅ [MP SPLIT CARTÃO] application_fee ADICIONADO', {
      cents: applicationFeeCents,
      reais: applicationFeeCents / 100,
      modelo: 'CAKTO'
    });
  }

  logInfo('📦 [CARTÃO] Enviando para Mercado Pago', {
    amount: cardPayload.transaction_amount,
    installments: cardPayload.installments,
    payment_method_id: cardPayload.payment_method_id,
    issuer_id: cardPayload.issuer_id || 'não informado',
    has_payer_document: !!payerDocument,
    has_application_fee: applicationFeeCents > 0
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

  logInfo('✅ [CARTÃO] Pagamento criado', { 
    id: cardData.id, 
    status: cardData.status 
  });

  return {
    success: true,
    transactionId: String(cardData.id),
    status: cardData.status
  };
}
