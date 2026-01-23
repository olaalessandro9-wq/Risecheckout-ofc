/**
 * Webhook Idempotency Core - RISE V3 Modular
 * 
 * Funções core para verificação e registro de idempotência.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../logger.ts";
import { IdempotencyContext, IdempotencyResult, IdempotencyConfig } from "./types.ts";

const log = createLogger("webhook-idempotency");

/**
 * Verifica se um evento de webhook já foi processado
 */
export async function checkWebhookIdempotency(
  supabase: SupabaseClient,
  context: IdempotencyContext,
  config: IdempotencyConfig = {}
): Promise<IdempotencyResult> {
  const { gateway, eventId, eventType, orderId } = context;
  const { skipDuplicateCheck = false, logDuplicates = true } = config;
  
  if (skipDuplicateCheck) {
    return { isDuplicate: false };
  }
  
  if (!eventId || !gateway) {
    log.warn("Missing eventId or gateway for idempotency check");
    return { isDuplicate: false };
  }
  
  try {
    // Busca evento existente
    const { data: existingEvent, error } = await supabase
      .from("order_events")
      .select("id, processed_successfully, created_at")
      .eq("gateway", gateway)
      .eq("gateway_event_id", eventId)
      .maybeSingle();
    
    if (error) {
      log.error("Error checking webhook idempotency:", error);
      return { isDuplicate: false };
    }
    
    if (existingEvent) {
      if (logDuplicates) {
        log.info(`Duplicate webhook detected: ${gateway}/${eventId} (type: ${eventType})`);
      }
      
      return {
        isDuplicate: true,
        existingEventId: existingEvent.id,
        processedAt: existingEvent.created_at,
      };
    }
    
    return { isDuplicate: false };
    
  } catch (error) {
    log.error("Exception in checkWebhookIdempotency:", error);
    return { isDuplicate: false };
  }
}

/**
 * Registra um evento de webhook como processado
 */
export async function recordWebhookEvent(
  supabase: SupabaseClient,
  context: IdempotencyContext,
  success: boolean,
  additionalData?: Record<string, unknown>
): Promise<string | null> {
  const { gateway, eventId, eventType, orderId } = context;
  
  if (!eventId || !gateway) {
    log.warn("Cannot record webhook event: missing eventId or gateway");
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from("order_events")
      .insert({
        gateway,
        gateway_event_id: eventId,
        type: eventType,
        order_id: orderId || null,
        vendor_id: additionalData?.vendorId as string || "system",
        occurred_at: new Date().toISOString(),
        processed_successfully: success,
        data: additionalData || null,
      })
      .select("id")
      .single();
    
    if (error) {
      // Ignore duplicate key errors (concurrent processing)
      if (error.code === "23505") {
        log.info(`Concurrent webhook processing detected: ${gateway}/${eventId}`);
        return null;
      }
      log.error("Error recording webhook event:", error);
      return null;
    }
    
    log.info(`Webhook event recorded: ${gateway}/${eventId} (success: ${success})`);
    return data?.id || null;
    
  } catch (error) {
    log.error("Exception in recordWebhookEvent:", error);
    return null;
  }
}
