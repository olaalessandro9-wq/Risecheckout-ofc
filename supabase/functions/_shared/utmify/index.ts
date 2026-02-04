/**
 * ============================================================================
 * UTMify Module - Barrel Export
 * ============================================================================
 * 
 * @module _shared/utmify
 * @version 1.0.0 - RISE Protocol V3
 * 
 * Re-exporta todas as funções e tipos do módulo UTMify.
 * ============================================================================
 */

// Types
export * from "./types.ts";

// Constants
export * from "./constants.ts";

// Token Normalization (SSOT)
export { 
  normalizeUTMifyToken, 
  computeTokenFingerprint 
} from "./token-normalizer.ts";

// Helpers
export { formatDateUTC } from "./date-formatter.ts";
export { mapPaymentMethod } from "./payment-mapper.ts";

// Core Functions
export { isEventEnabled } from "./config-checker.ts";
export { getUTMifyToken } from "./token-retriever.ts";
export { fetchOrderForUTMify } from "./order-fetcher.ts";
export { buildUTMifyPayload, buildUTMifyOrderData } from "./payload-builder.ts";

// Main Dispatcher
export { 
  dispatchUTMifyEvent, 
  dispatchUTMifyEventForOrder 
} from "./dispatcher.ts";
