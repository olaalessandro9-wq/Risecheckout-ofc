/**
 * Webhook Module - RISE V3 Modular
 * 
 * Barrel export para o módulo de idempotência de webhooks.
 */

// Types
export * from "./types.ts";

// Core functions
export { 
  checkWebhookIdempotency, 
  recordWebhookEvent 
} from "./idempotency-core.ts";

// Middleware
export { 
  withWebhookIdempotency,
  type WebhookHandlerContext,
  type WebhookHandler 
} from "./idempotency-middleware.ts";

// Context extractors
export {
  createStripeContextExtractor,
  createAsaasContextExtractor,
  createMercadoPagoContextExtractor,
  createPushinPayContextExtractor,
  getContextExtractor,
} from "./context-extractors.ts";
