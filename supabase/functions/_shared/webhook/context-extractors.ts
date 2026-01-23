/**
 * Webhook Context Extractors - RISE V3 Modular
 * 
 * Extractors de contexto de idempotência específicos para cada gateway.
 */

import { IdempotencyContext, ContextExtractor } from "./types.ts";

/**
 * Extractor para webhooks do Stripe
 */
export function createStripeContextExtractor(): ContextExtractor {
  return (payload: unknown): IdempotencyContext | null => {
    if (!payload || typeof payload !== "object") return null;
    
    const event = payload as Record<string, unknown>;
    const id = event.id as string;
    const type = event.type as string;
    
    if (!id || !type) return null;
    
    // Extrai order_id do metadata se disponível
    let orderId: string | undefined;
    const data = event.data as Record<string, unknown> | undefined;
    const object = data?.object as Record<string, unknown> | undefined;
    const metadata = object?.metadata as Record<string, string> | undefined;
    
    if (metadata?.order_id) {
      orderId = metadata.order_id;
    }
    
    return {
      gateway: "stripe",
      eventId: id,
      eventType: type,
      orderId,
      timestamp: event.created ? new Date((event.created as number) * 1000).toISOString() : undefined,
    };
  };
}

/**
 * Extractor para webhooks do Asaas
 */
export function createAsaasContextExtractor(): ContextExtractor {
  return (payload: unknown): IdempotencyContext | null => {
    if (!payload || typeof payload !== "object") return null;
    
    const event = payload as Record<string, unknown>;
    const eventType = event.event as string;
    const payment = event.payment as Record<string, unknown> | undefined;
    
    if (!eventType) return null;
    
    // Asaas não envia event ID, usamos payment.id + event type
    const paymentId = payment?.id as string;
    const externalReference = payment?.externalReference as string;
    
    if (!paymentId) return null;
    
    return {
      gateway: "asaas",
      eventId: `${paymentId}_${eventType}`,
      eventType,
      orderId: externalReference || undefined,
      timestamp: payment?.dateCreated as string,
    };
  };
}

/**
 * Extractor para webhooks do Mercado Pago
 */
export function createMercadoPagoContextExtractor(): ContextExtractor {
  return (payload: unknown): IdempotencyContext | null => {
    if (!payload || typeof payload !== "object") return null;
    
    const event = payload as Record<string, unknown>;
    const id = event.id as string | number;
    const type = event.type as string;
    const action = event.action as string;
    
    if (!id) return null;
    
    // Mercado Pago pode ter data.id como referência ao payment
    const data = event.data as Record<string, unknown> | undefined;
    const dataId = data?.id as string;
    
    return {
      gateway: "mercadopago",
      eventId: String(id),
      eventType: action || type || "unknown",
      orderId: undefined, // Precisa buscar via API
      timestamp: event.date_created as string,
    };
  };
}

/**
 * Extractor para webhooks do PushinPay
 */
export function createPushinPayContextExtractor(): ContextExtractor {
  return (payload: unknown): IdempotencyContext | null => {
    if (!payload || typeof payload !== "object") return null;
    
    const event = payload as Record<string, unknown>;
    const transactionId = event.transaction_id as string || event.id as string;
    const status = event.status as string;
    const reference = event.reference_id as string || event.external_reference as string;
    
    if (!transactionId) return null;
    
    return {
      gateway: "pushinpay",
      eventId: `${transactionId}_${status || "update"}`,
      eventType: status ? `payment.${status}` : "payment.update",
      orderId: reference || undefined,
      timestamp: event.updated_at as string || event.created_at as string,
    };
  };
}

/**
 * Factory para obter extractor por gateway
 */
export function getContextExtractor(gateway: string): ContextExtractor {
  switch (gateway.toLowerCase()) {
    case "stripe":
      return createStripeContextExtractor();
    case "asaas":
      return createAsaasContextExtractor();
    case "mercadopago":
      return createMercadoPagoContextExtractor();
    case "pushinpay":
      return createPushinPayContextExtractor();
    default:
      return () => null;
  }
}
