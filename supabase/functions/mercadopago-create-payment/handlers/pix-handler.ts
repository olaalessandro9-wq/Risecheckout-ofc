/**
 * Handler para pagamentos PIX no Mercado Pago
 * Recebe parâmetros validados e retorna resultado padronizado
 */

import { logInfo, logError } from '../utils/logger.ts';

export interface PixPaymentParams {
  orderId: string;
  calculatedTotalCents: number;
  payerEmail: string;
  payerName?: string;
  payerDocument?: string;
  effectiveAccessToken: string;
  applicationFeeCents: number;
}

export interface PixPaymentResult {
  success: boolean;
  transactionId: string;
  status: string;
  qrCode?: string;
  qrCodeText?: string;
}

export async function handlePixPayment(params: PixPaymentParams): Promise<PixPaymentResult> {
  const { 
    orderId, 
    calculatedTotalCents, 
    payerEmail, 
    payerName, 
    payerDocument, 
    effectiveAccessToken, 
    applicationFeeCents 
  } = params;

  const pixPayload: any = {
    transaction_amount: calculatedTotalCents / 100,
    description: `Pedido #${orderId.slice(0, 8)}`,
    payment_method_id: 'pix',
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

  // SPLIT via application_fee (Modelo CAKTO)
  if (applicationFeeCents > 0) {
    pixPayload.application_fee = applicationFeeCents / 100;
    logInfo('✅ [MP SPLIT PIX] application_fee ADICIONADO', {
      cents: applicationFeeCents,
      reais: applicationFeeCents / 100,
      modelo: 'CAKTO'
    });
  }

  logInfo('📦 [PIX] Enviando para Mercado Pago', {
    amount: pixPayload.transaction_amount,
    has_application_fee: applicationFeeCents > 0
  });

  const pixResponse = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${effectiveAccessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `${orderId}-pix`
    },
    body: JSON.stringify(pixPayload)
  });

  const pixData = await pixResponse.json();

  if (!pixResponse.ok) {
    logError('Erro na API do Mercado Pago (PIX)', pixData);
    throw { 
      code: 'GATEWAY_API_ERROR', 
      message: pixData.message || 'Erro ao criar PIX', 
      details: pixData 
    };
  }

  logInfo('✅ [PIX] Pagamento criado', { 
    id: pixData.id, 
    status: pixData.status 
  });

  return {
    success: true,
    transactionId: String(pixData.id),
    status: pixData.status,
    qrCode: pixData.point_of_interaction?.transaction_data?.qr_code_base64,
    qrCodeText: pixData.point_of_interaction?.transaction_data?.qr_code
  };
}
