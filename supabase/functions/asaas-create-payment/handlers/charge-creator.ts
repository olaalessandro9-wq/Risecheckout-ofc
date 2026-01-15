/**
 * Charge Creator Handler - asaas-create-payment
 * 
 * Responsável por criar cobranças na API do Asaas
 */

import { AsaasSplitRule } from "./split-builder.ts";

export interface ChargePayload {
  customer: string;
  billingType: 'PIX' | 'CREDIT_CARD';
  value: number;
  dueDate: string;
  externalReference: string;
  description: string;
  split?: AsaasSplitRule[];
  installmentCount?: number;
  creditCardToken?: string;
  creditCard?: Record<string, unknown>;
  creditCardHolderInfo?: Record<string, unknown>;
}

export interface ChargeResult {
  success: boolean;
  chargeData?: Record<string, unknown>;
  error?: string;
}

/**
 * Monta o payload da cobrança
 */
export function buildChargePayload(params: {
  customerId: string;
  orderId: string;
  amountCents: number;
  paymentMethod: 'pix' | 'credit_card';
  description?: string;
  splitRules: AsaasSplitRule[];
  cardToken?: string;
  installments?: number;
}): ChargePayload {
  const { customerId, orderId, amountCents, paymentMethod, description, splitRules, cardToken, installments } = params;
  
  const billingType = paymentMethod === 'pix' ? 'PIX' : 'CREDIT_CARD';
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 1);

  const payload: ChargePayload = {
    customer: customerId,
    billingType,
    value: amountCents / 100,
    dueDate: dueDate.toISOString().split('T')[0],
    externalReference: orderId,
    description: description || `Pedido ${orderId}`
  };

  if (splitRules.length > 0) {
    payload.split = splitRules;
    console.log(`[asaas-create-payment] 📦 Split: ${JSON.stringify(splitRules)}`);
  }

  if (paymentMethod === 'credit_card' && cardToken) {
    payload.installmentCount = installments || 1;
    
    try {
      const cardData = JSON.parse(cardToken);
      if (cardData.creditCardToken) {
        payload.creditCardToken = cardData.creditCardToken;
      } else {
        payload.creditCard = cardData.creditCard;
        payload.creditCardHolderInfo = cardData.creditCardHolderInfo;
      }
    } catch {
      payload.creditCardToken = cardToken;
    }
  }

  return payload;
}

/**
 * Cria a cobrança na API do Asaas
 */
export async function createAsaasCharge(
  baseUrl: string,
  apiKey: string,
  payload: ChargePayload
): Promise<ChargeResult> {
  console.log('[asaas-create-payment] Criando cobrança...');

  const response = await fetch(`${baseUrl}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey
    },
    body: JSON.stringify(payload)
  });

  const chargeData = await response.json();

  if (!response.ok) {
    console.error('[asaas-create-payment] Erro:', chargeData);
    const errorMsg = chargeData.errors?.[0]?.description || chargeData.message || 'Erro ao criar cobrança';
    return { success: false, error: errorMsg };
  }

  console.log('[asaas-create-payment] ✅ Cobrança criada:', chargeData.id);
  return { success: true, chargeData };
}

/**
 * Obtém QR Code PIX para a cobrança
 */
export async function getPixQrCode(
  baseUrl: string,
  apiKey: string,
  chargeId: string
): Promise<{ qrCode?: string; qrCodeText?: string }> {
  const response = await fetch(`${baseUrl}/payments/${chargeId}/pixQrCode`, {
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey
    }
  });

  if (response.ok) {
    const qrData = await response.json();
    console.log('[asaas-create-payment] QR Code obtido');
    return {
      qrCode: qrData.encodedImage,
      qrCodeText: qrData.payload
    };
  }

  return {};
}

/**
 * Dispara webhook pix_generated
 */
export async function triggerPixGeneratedWebhook(
  supabaseUrl: string,
  serviceRoleKey: string,
  orderId: string
): Promise<void> {
  try {
    const internalSecret = Deno.env.get('INTERNAL_WEBHOOK_SECRET') || 'default-internal-secret';
    
    console.log('[asaas-create-payment] Disparando webhook pix_generated...');
    
    const response = await fetch(
      `${supabaseUrl}/functions/v1/trigger-webhooks`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'X-Internal-Secret': internalSecret
        },
        body: JSON.stringify({
          order_id: orderId,
          event_type: 'pix_generated'
        })
      }
    );

    if (response.ok) {
      console.log('[asaas-create-payment] ✅ Webhook pix_generated disparado');
    } else {
      const errorText = await response.text();
      console.warn('[asaas-create-payment] ⚠️ Webhook pix_generated falhou:', errorText);
    }
  } catch (error) {
    console.warn('[asaas-create-payment] ⚠️ Erro ao disparar webhook:', error);
  }
}
