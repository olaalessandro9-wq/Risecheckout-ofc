/**
 * Token Manager - Public Exports
 * 
 * RISE Protocol V3: Unified Token Service
 * 
 * All authentication flows now use the unified service.
 * Legacy buyer/producer exports are deprecated aliases.
 */

// Types
export type { 
  TokenState, 
  TokenEvent, 
  TokenContext, 
  TokenType,
  TokenStateSubscriber,
  RefreshResponse,
} from "./types";

export { TOKEN_TIMING, STORAGE_KEYS } from "./types";

// Machine (for advanced usage/testing)
export { 
  transition, 
  canMakeApiCalls, 
  needsRefresh, 
  isExpired, 
  INITIAL_CONTEXT, 
  INITIAL_STATE,
} from "./machine";

// Persistence (for advanced usage/testing)
export type { PersistedState } from "./persistence";
export { persistTokenState, restoreTokenState, clearPersistedState } from "./persistence";

// Heartbeat (for advanced usage/testing)
export type { HeartbeatCallback } from "./heartbeat";
export { HeartbeatManager } from "./heartbeat";

// Refresh (for advanced usage/testing)
export type { RefreshResult } from "./refresh";
export { executeRefresh } from "./refresh";

// ============================================
// UNIFIED SERVICE (PRIMARY EXPORT)
// ============================================

export { 
  TokenService,
  unifiedTokenService,
} from "./service";

// ============================================
// LEGACY ALIASES (DEPRECATED)
// These exist only for backwards compatibility.
// All point to unifiedTokenService.
// ============================================

export { 
  producerTokenService,
  buyerTokenService,
  producerTokenManager,
  buyerTokenManager,
} from "./service";

// ============================================
// UNIFIED API HELPERS (RISE V3 - PREFERRED)
// ============================================

export {
  unifiedTokenService as tokenService,
  isAuthenticated,
  refreshToken,
  clearAuth,
  setAuthenticated,
  subscribeToAuth,
} from "./unified-service";
