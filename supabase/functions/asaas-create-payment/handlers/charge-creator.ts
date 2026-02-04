/**
 * Charge Creator Handler - asaas-create-payment
 * 
 * Responsável por criar cobranças na API do Asaas
 * 
 * @version 2.0.0 - RISE Protocol V3 + UTMify Backend SSOT
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AsaasSplitRule } from "./split-builder.ts";
import { createLogger } from "../../_shared/logger.ts";
import { fetchWithTimeout } from "../../_shared/http/index.ts";

const log = createLogger("asaas-create-payment");
const API_TIMEOUT = 15000; // 15 segundos

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
    log.info(`Split: ${JSON.stringify(splitRules)}`);
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
 * Cria a cobrança na API do Asaas (com timeout RISE V3)
 */
export async function createAsaasCharge(
  baseUrl: string,
  apiKey: string,
  payload: ChargePayload
): Promise<ChargeResult> {
  log.info("Creating charge...");

  const response = await fetchWithTimeout(`${baseUrl}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey
    },
    body: JSON.stringify(payload)
  }, API_TIMEOUT);

  const chargeData = await response.json();

  if (!response.ok) {
    log.error("Error:", chargeData);
    const errorMsg = chargeData.errors?.[0]?.description || chargeData.message || 'Erro ao criar cobrança';
    return { success: false, error: errorMsg };
  }

  log.info(`Charge created: ${chargeData.id}`);
  return { success: true, chargeData };
}

/**
 * Obtém QR Code PIX para a cobrança (com timeout RISE V3)
 */
export async function getPixQrCode(
  baseUrl: string,
  apiKey: string,
  chargeId: string
): Promise<{ qrCode?: string; qrCodeText?: string }> {
  const response = await fetchWithTimeout(`${baseUrl}/payments/${chargeId}/pixQrCode`, {
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey
    }
  }, API_TIMEOUT);

  if (response.ok) {
    const qrData = await response.json();
    log.info("QR Code obtained");
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
    
    log.info("Triggering pix_generated webhook...");
    
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
      log.info("Webhook pix_generated triggered successfully");
    } else {
      const errorText = await response.text();
      log.warn("Webhook pix_generated failed:", errorText);
    }
  } catch (error) {
    log.warn("Error triggering webhook:", error);
  }
}

// ============================================================================
// UTMIFY PIX_GENERATED EVENT (RISE V3 - Backend SSOT)
// ============================================================================

import { dispatchUTMifyEventForOrder } from "../../_shared/utmify-dispatcher.ts";

/**
 * Dispara evento pix_generated para UTMify
 */
export async function dispatchAsaasPixGeneratedUTMify(
  supabase: SupabaseClient,
  orderId: string
): Promise<void> {
  try {
    log.info(`Disparando UTMify pix_generated para order ${orderId}`);
    
    const result = await dispatchUTMifyEventForOrder(supabase, orderId, "pix_generated");
    
    if (result.success && !result.skipped) {
      log.info(`✅ UTMify pix_generated disparado com sucesso`);
    } else if (result.skipped) {
      log.info(`UTMify pulado: ${result.reason}`);
    } else {
      log.warn(`Erro ao disparar UTMify: ${result.error}`);
    }
  } catch (error) {
    log.warn("Exceção ao disparar UTMify pix_generated (não crítico):", error);
  }
}
