/**
 * Token Manager - Public Exports
 * 
 * RISE Protocol V3: Session Commander Architecture (2026-01-26)
 * 
 * All authentication flows use the unified service + Session Commander.
 * 
 * Primary refresh path:
 *   TokenService.refresh() → SessionCommander.requestRefresh() → /request-refresh
 * 
 * For refresh operations, prefer:
 *   import { sessionCommander } from "@/lib/session-commander";
 *   await sessionCommander.requestRefresh();
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

// Refresh (DEPRECATED - use sessionCommander.requestRefresh() instead)
export type { RefreshResult } from "./refresh";
/** @deprecated Use sessionCommander.requestRefresh() from "@/lib/session-commander" */
export { executeRefresh } from "./refresh";

// ============================================
// UNIFIED SERVICE (PRIMARY EXPORT)
// ============================================

export { 
  TokenService,
  unifiedTokenService,
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
