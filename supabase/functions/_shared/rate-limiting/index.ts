/**
 * Rate Limiting Module
 * 
 * Barrel export para o sistema consolidado de rate limiting.
 * 
 * @version 1.0.0 - RISE V3 Compliant
 * @module rate-limiting
 */

// Types
export type {
  RateLimitConfig,
  RateLimitResult,
  BlocklistResult,
  RateLimitRecord,
  CheckRateLimitFn,
  CheckIPBlocklistFn,
} from "./types.ts";

// Configs
export * from "./configs.ts";
export { RATE_LIMIT_CONFIGS } from "./configs.ts";

// Service
export {
  checkRateLimit,
  createRateLimitResponse,
  getClientIP,
  getIdentifier,
} from "./service.ts";

// Blocklist
export {
  checkIPBlocklist,
  createBlocklistResponse,
} from "./blocklist.ts";

// Middleware
export {
  rateLimitMiddleware,
  blocklistMiddleware,
  rateLimitOnlyMiddleware,
} from "./middleware.ts";
