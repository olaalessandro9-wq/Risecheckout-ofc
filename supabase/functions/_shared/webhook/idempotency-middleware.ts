/**
 * Webhook Idempotency Middleware - RISE V3 Modular
 * 
 * Higher-Order Function para adicionar idempotência a handlers de webhook.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../logger.ts";
import { IdempotencyContext, IdempotencyConfig, ContextExtractor } from "./types.ts";
import { checkWebhookIdempotency, recordWebhookEvent } from "./idempotency-core.ts";

const log = createLogger("webhook-middleware");

export interface WebhookHandlerContext {
  supabase: SupabaseClient;
  payload: unknown;
  headers: Headers;
}

export type WebhookHandler = (context: WebhookHandlerContext) => Promise<Response>;

/**
 * Middleware HOF que adiciona verificação de idempotência a um handler de webhook
 */
export function withWebhookIdempotency(
  handler: WebhookHandler,
  extractor: ContextExtractor,
  config: IdempotencyConfig = {}
): WebhookHandler {
  return async (context: WebhookHandlerContext): Promise<Response> => {
    const { supabase, payload } = context;
    
    // Extrai contexto de idempotência do payload
    const idempotencyContext = extractor(payload);
    
    if (!idempotencyContext) {
      log.warn("Could not extract idempotency context from payload");
      return handler(context);
    }
    
    // Verifica duplicata
    const result = await checkWebhookIdempotency(supabase, idempotencyContext, config);
    
    if (result.isDuplicate) {
      log.info(`Skipping duplicate webhook: ${idempotencyContext.gateway}/${idempotencyContext.eventId}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Event already processed",
          existingEventId: result.existingEventId,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Executa handler original
    let response: Response;
    let success = false;
    
    try {
      response = await handler(context);
      success = response.ok;
    } catch (error) {
      log.error("Webhook handler error:", error);
      response = new Response(
        JSON.stringify({ success: false, error: "Internal error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Registra evento processado
    await recordWebhookEvent(supabase, idempotencyContext, success, {
      statusCode: response.status,
    });
    
    return response;
  };
}
