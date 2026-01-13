/**
 * Handler para pagamentos PIX no Mercado Pago
 * Recebe parâmetros validados e retorna resultado padronizado
 * 
 * RISE Protocol V2 Compliant - Zero `any`
 * Version: 2.0.0
 */

import { logInfo, logError } from '../utils/logger.ts';

// ============================================
// INTERFACES
// ============================================

export interface PixPaymentParams {
  orderId: string;
  calculatedTotalCents: number;
  payerEmail: string;
  payerName?: string;
  payerDocument?: string;
  effectiveAccessToken: string;
  applicationFeeCents: number;
  // Campos para qualidade MP
  productId?: string;
  productName?: string;
  items?: OrderItem[];
}

interface OrderItem {
  product_id: string;
  product_name: string;
  amount_cents: number;
  quantity: number;
}

export interface PixPaymentResult {
  success: boolean;
  transactionId: string;
  status: string;
  qrCode?: string;
  qrCodeText?: string;
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

interface PixPayload {
  transaction_amount: number;
  description: string;
  payment_method_id: string;
  external_reference: string;
  notification_url: string;
  additional_info: {
    items: AdditionalInfoItem[];
  };
  payer: {
    email: string;
    first_name: string;
    last_name: string;
    identification?: PayerIdentification;
  };
  application_fee?: number;
}

interface MercadoPagoPixResponse {
  id: number;
  status: string;
  message?: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code_base64?: string;
      qr_code?: string;
    };
  };
}

// ============================================
// MAIN HANDLER
// ============================================

export async function handlePixPayment(params: PixPaymentParams): Promise<PixPaymentResult> {
  const { 
    orderId, 
    calculatedTotalCents, 
    payerEmail, 
    payerName, 
    payerDocument, 
    effectiveAccessToken, 
    applicationFeeCents,
    productId,
    productName,
    items
  } = params;

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

  const pixPayload: PixPayload = {
    transaction_amount: calculatedTotalCents / 100,
    description: `Pedido #${orderId.slice(0, 8)}`,
    payment_method_id: 'pix',
    
    // ✅ CAMPOS OBRIGATÓRIOS PARA QUALIDADE MP
    external_reference: orderId,
    notification_url: notificationUrl,
    
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

  const pixData = await pixResponse.json() as MercadoPagoPixResponse;

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
