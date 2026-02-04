/**
 * ============================================================================
 * UTMify Event Dispatcher
 * ============================================================================
 * 
 * @module _shared/utmify/dispatcher
 * @version 1.0.0 - RISE Protocol V3
 * 
 * Orquestra o disparo de eventos para UTMify:
 * 1. Verifica configuração
 * 2. Recupera token
 * 3. Constrói payload
 * 4. Envia para API
 * ============================================================================
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../logger.ts";
import { UTMIFY_API_URL } from "./constants.ts";
import { isEventEnabled } from "./config-checker.ts";
import { getUTMifyToken } from "./token-retriever.ts";
import { buildUTMifyPayload, buildUTMifyOrderData } from "./payload-builder.ts";
import { fetchOrderForUTMify } from "./order-fetcher.ts";
import type { UTMifyEventType, UTMifyOrderData, UTMifyDispatchResult } from "./types.ts";

const log = createLogger("UTMifyDispatcher");

/**
 * Dispara evento para UTMify
 * 
 * @param supabase - Cliente Supabase com service role
 * @param eventType - Tipo do evento
 * @param orderData - Dados do pedido
 * @param productIds - IDs dos produtos (para filtro multi-item)
 * @returns Resultado do disparo
 */
export async function dispatchUTMifyEvent(
  supabase: SupabaseClient,
  eventType: UTMifyEventType,
  orderData: UTMifyOrderData,
  productIds?: string[]
): Promise<UTMifyDispatchResult> {
  const { vendorId, orderId } = orderData;

  // 1. Verificar se evento está habilitado
  const enabled = await isEventEnabled(supabase, vendorId, eventType, productIds);
  if (!enabled) {
    log.info(`UTMify ${eventType} não habilitado para vendor ${vendorId}`);
    return { success: true, skipped: true, reason: "not_enabled" };
  }

  // 2. Recuperar token com fingerprint
  const tokenResult = await getUTMifyToken(supabase, vendorId);
  if (!tokenResult.token) {
    log.info(`Nenhum token UTMify configurado para vendor ${vendorId}`);
    return { success: true, skipped: true, reason: "no_token" };
  }

  // 3. Construir payload
  const payload = buildUTMifyPayload(orderData, eventType);

  // 4. Enviar para UTMify
  try {
    log.info(`Disparando UTMify ${eventType} para order ${orderId}`, {
      fingerprint: tokenResult.fingerprint,
      payloadSize: JSON.stringify(payload).length
    });

    const response = await fetch(UTMIFY_API_URL, {
      method: "POST",
      headers: {
        "x-api-token": tokenResult.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      log.error(`UTMify API error (${response.status}):`, {
        orderId,
        eventType,
        fingerprint: tokenResult.fingerprint,
        statusCode: response.status,
        response: responseText.slice(0, 500)
      });
      return { 
        success: false, 
        error: `API Error ${response.status}: ${responseText}`,
        fingerprint: tokenResult.fingerprint || undefined
      };
    }

    log.info(`✅ UTMify ${eventType} enviado para order ${orderId}`, {
      fingerprint: tokenResult.fingerprint
    });
    return { success: true, fingerprint: tokenResult.fingerprint || undefined };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    log.error(`Erro ao enviar para UTMify:`, { 
      orderId, 
      eventType, 
      fingerprint: tokenResult.fingerprint,
      error: errMsg 
    });
    return { success: false, error: errMsg, fingerprint: tokenResult.fingerprint || undefined };
  }
}

/**
 * Busca o pedido e dispara evento UTMify em uma única operação
 * 
 * RISE V3: Suporta múltiplos produtos (pedido com bumps)
 * 
 * @param supabase - Cliente Supabase
 * @param orderId - ID do pedido
 * @param eventType - Tipo do evento
 * @param overrides - Campos para sobrescrever (opcional)
 * @returns Resultado do disparo
 */
export async function dispatchUTMifyEventForOrder(
  supabase: SupabaseClient,
  orderId: string,
  eventType: UTMifyEventType,
  overrides?: Partial<UTMifyOrderData>
): Promise<UTMifyDispatchResult> {
  const order = await fetchOrderForUTMify(supabase, orderId);
  
  if (!order) {
    return { success: true, skipped: true, reason: "order_not_found" };
  }

  const orderData = buildUTMifyOrderData(order, overrides);
  
  // RISE V3: Passar TODOS os product_ids para filtro multi-item
  const productIds = order.order_items?.map(item => item.product_id) || [];

  return dispatchUTMifyEvent(supabase, eventType, orderData, productIds);
}
