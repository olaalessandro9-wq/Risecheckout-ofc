/**
 * Token Manager - Public Exports
 * 
 * RISE Protocol V3: FSM-based Token Lifecycle Management
 * 
 * Usage:
 * ```typescript
 * import { producerTokenService } from "@/lib/token-manager";
 * 
 * // Check auth state
 * const state = producerTokenService.getState();
 * 
 * // Get valid token (with auto-refresh)
 * const token = await producerTokenService.getValidAccessToken();
 * 
 * // Subscribe to state changes
 * const unsubscribe = producerTokenService.subscribe((state, context) => {
 *   console.log("Auth state changed:", state);
 * });
 * ```
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
export { transition, canMakeApiCalls, needsRefresh, isExpired, INITIAL_CONTEXT, INITIAL_STATE } from "./machine";

// Service (main API)
export { 
  TokenService,
  producerTokenService,
  buyerTokenService,
  // Backward compatibility
  producerTokenManager,
  buyerTokenManager,
} from "./service";
