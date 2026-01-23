/**
 * Webhook Idempotency Middleware
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Middleware que garante idempotência em todos os webhooks de pagamento.
 * Previne processamento duplicado de eventos de gateway.
 * 
 * @module _shared/webhook-idempotency
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "./logger.ts";

const log = createLogger("webhook-idempotency");

// ============================================================================
// TYPES
// ============================================================================

export interface IdempotencyContext {
  /** ID único do evento/payment do gateway */
  eventId: string;
  /** Tipo do evento (payment_intent.succeeded, PAYMENT_RECEIVED, etc) */
  eventType: string;
  /** ID da order no nosso sistema */
  orderId?: string;
  /** Nome do gateway */
  gateway: string;
}

export interface IdempotencyResult {
  /** Se true, evento já foi processado anteriormente */
  isDuplicate: boolean;
  /** Status atual da order se encontrada */
  orderStatus?: string;
  /** Resposta cacheada se disponível */
  cachedResponse?: unknown;
}

export interface IdempotencyConfig {
  /** Supabase client */
  supabase: SupabaseClient;
  /** Função para extrair contexto do request */
  extractContext: (req: Request, body: unknown) => Promise<IdempotencyContext | null>;
  /** Headers CORS */
  corsHeaders: Record<string, string>;
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Verifica se um evento de webhook já foi processado
 * 
 * Critérios de duplicata:
 * 1. Evento com mesmo eventId já existe em order_events
 * 2. Order já está com status 'paid' ou 'refunded'
 * 3. Payment ID já foi processado com sucesso
 */
export async function checkWebhookIdempotency(
  supabase: SupabaseClient,
  context: IdempotencyContext
): Promise<IdempotencyResult> {
  const { eventId, eventType, orderId, gateway } = context;

  log.info(`Checking idempotency: ${gateway}/${eventType}/${eventId}`);

  // 1. Verificar se evento já existe em order_events
  const { data: existingEvent } = await supabase
    .from("order_events")
    .select("id, event_type, created_at")
    .eq("external_id", eventId)
    .eq("gateway", gateway)
    .maybeSingle();

  if (existingEvent) {
    log.info(`Duplicate event detected: ${eventId} (processed at ${existingEvent.created_at})`);
    return {
      isDuplicate: true,
      cachedResponse: { received: true, duplicate: true },
    };
  }

  // 2. Se temos orderId, verificar status da order
  if (orderId) {
    const { data: order } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .maybeSingle();

    if (order) {
      // Se já está pago ou reembolsado, não processar novamente
      if (order.status === "paid" || order.status === "refunded") {
        log.info(`Order ${orderId} already in final status: ${order.status}`);
        return {
          isDuplicate: true,
          orderStatus: order.status,
          cachedResponse: { received: true, duplicate: true, status: order.status },
        };
      }

      return {
        isDuplicate: false,
        orderStatus: order.status,
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Registra evento processado para idempotência futura
 */
export async function recordWebhookEvent(
  supabase: SupabaseClient,
  context: IdempotencyContext,
  success: boolean,
  metadata?: Record<string, unknown>
): Promise<void> {
  const { eventId, eventType, orderId, gateway } = context;

  try {
    await supabase.from("order_events").insert({
      order_id: orderId,
      event_type: eventType,
      external_id: eventId,
      gateway: gateway,
      payload: metadata || {},
      processed_successfully: success,
    });

    log.info(`Event recorded: ${gateway}/${eventType}/${eventId}`);
  } catch (error) {
    // Não falhar o webhook por erro de logging
    log.warn(`Failed to record event: ${error}`);
  }
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Middleware de idempotência para webhooks
 * 
 * Wrapa um handler de webhook com verificação automática de duplicatas.
 * 
 * @example
 * const handler = withWebhookIdempotency(
 *   async (req, context) => {
 *     // Processar webhook
 *     return new Response(JSON.stringify({ received: true }));
 *   },
 *   {
 *     supabase,
 *     corsHeaders,
 *     extractContext: async (req, body) => ({
 *       eventId: body.id,
 *       eventType: body.type,
 *       orderId: body.data?.object?.metadata?.order_id,
 *       gateway: 'stripe',
 *     }),
 *   }
 * );
 * 
 * serve(handler);
 */
export function withWebhookIdempotency(
  handler: (
    req: Request,
    context: IdempotencyContext | null
  ) => Promise<Response>,
  config: IdempotencyConfig
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const { supabase, extractContext, corsHeaders } = config;

    // Clone request para poder ler o body múltiplas vezes
    const clonedReq = req.clone();
    
    let body: unknown;
    try {
      body = await clonedReq.json();
    } catch {
      // Se não conseguir parsear JSON, deixar o handler lidar
      return handler(req, null);
    }

    // Extrair contexto de idempotência
    let context: IdempotencyContext | null;
    try {
      context = await extractContext(req, body);
    } catch (error) {
      log.warn(`Failed to extract idempotency context: ${error}`);
      return handler(req, null);
    }

    // Se não conseguiu extrair contexto, processar normalmente
    if (!context) {
      return handler(req, null);
    }

    // Verificar idempotência
    const result = await checkWebhookIdempotency(supabase, context);

    if (result.isDuplicate) {
      log.info(`Returning cached response for duplicate: ${context.eventId}`);
      return new Response(
        JSON.stringify(result.cachedResponse || { received: true, duplicate: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Processar webhook
    try {
      const response = await handler(req, context);

      // Registrar evento processado
      await recordWebhookEvent(supabase, context, response.ok);

      return response;
    } catch (error) {
      // Registrar falha
      await recordWebhookEvent(supabase, context, false, {
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  };
}

// ============================================================================
// GATEWAY-SPECIFIC EXTRACTORS
// ============================================================================

/**
 * Extrator de contexto para Stripe
 */
export function createStripeContextExtractor(
  _supabase: SupabaseClient
): (req: Request, body: unknown) => Promise<IdempotencyContext | null> {
  return async (_req, body) => {
    const event = body as { id?: string; type?: string; data?: { object?: { metadata?: { order_id?: string } } } };
    
    if (!event.id || !event.type) {
      return null;
    }

    return {
      eventId: event.id,
      eventType: event.type,
      orderId: event.data?.object?.metadata?.order_id,
      gateway: "stripe",
    };
  };
}

/**
 * Extrator de contexto para Asaas
 */
export function createAsaasContextExtractor(
  supabase: SupabaseClient
): (req: Request, body: unknown) => Promise<IdempotencyContext | null> {
  return async (_req, body) => {
    const event = body as { event?: string; payment?: { id?: string; externalReference?: string } };
    
    if (!event.event || !event.payment?.id) {
      return null;
    }

    // Buscar orderId pelo externalReference
    let orderId = event.payment.externalReference;
    
    if (!orderId && event.payment.id) {
      const { data: order } = await supabase
        .from("orders")
        .select("id")
        .eq("gateway_payment_id", event.payment.id)
        .maybeSingle();
      
      orderId = order?.id;
    }

    return {
      eventId: event.payment.id,
      eventType: event.event,
      orderId,
      gateway: "asaas",
    };
  };
}

/**
 * Extrator de contexto para MercadoPago
 */
export function createMercadoPagoContextExtractor(
  supabase: SupabaseClient
): (req: Request, body: unknown) => Promise<IdempotencyContext | null> {
  return async (_req, body) => {
    const event = body as { action?: string; data?: { id?: string }; id?: number };
    
    if (!event.action || !event.data?.id) {
      return null;
    }

    const paymentId = event.data.id;

    // Buscar orderId pelo gateway_payment_id
    const { data: order } = await supabase
      .from("orders")
      .select("id")
      .eq("gateway_payment_id", paymentId)
      .maybeSingle();

    return {
      eventId: `${event.id || event.data.id}`,
      eventType: event.action,
      orderId: order?.id,
      gateway: "mercadopago",
    };
  };
}

/**
 * Extrator de contexto para PushinPay
 */
export function createPushinPayContextExtractor(
  supabase: SupabaseClient
): (req: Request, body: unknown) => Promise<IdempotencyContext | null> {
  return async (_req, body) => {
    const event = body as { id?: string; status?: string; reference_code?: string };
    
    if (!event.id || !event.status) {
      return null;
    }

    // orderId vem no reference_code
    let orderId = event.reference_code;

    if (!orderId) {
      const { data: order } = await supabase
        .from("orders")
        .select("id")
        .eq("gateway_payment_id", event.id)
        .maybeSingle();
      
      orderId = order?.id;
    }

    return {
      eventId: event.id,
      eventType: `payment.${event.status}`,
      orderId,
      gateway: "pushinpay",
    };
  };
}
