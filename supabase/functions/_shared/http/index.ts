/**
 * HTTP Module - RISE V3 Modular
 * 
 * Barrel export para o módulo HTTP unificado.
 */

// Types
export * from "./types.ts";

// Fetch utilities
export { 
  fetchWithTimeout, 
  safeJsonFetch, 
  sleep, 
  isRetryableError, 
  calculateBackoffDelay 
} from "./fetch-utils.ts";

// Gateway headers
export { createGatewayHeaders } from "./gateway-headers.ts";

// Gateway client
export { 
  createGatewayClient, 
  resetCircuitBreaker, 
  getCircuitBreakerState 
} from "./gateway-client.ts";
