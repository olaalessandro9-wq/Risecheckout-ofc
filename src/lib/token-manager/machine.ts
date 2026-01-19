/**
 * Token Lifecycle FSM - State Machine Implementation
 * 
 * RISE Protocol V3: Deterministic State Management
 * 
 * This module implements the core state machine logic.
 * All state transitions are explicit and type-safe.
 */

import type { 
  TokenState, 
  TokenEvent, 
  TokenContext,
} from "./types";
import { TOKEN_TIMING } from "./types";
import { createLogger } from "@/lib/logger";

const log = createLogger("TokenFSM");

// ============================================
// INITIAL STATE
// ============================================

export const INITIAL_CONTEXT: TokenContext = {
  expiresAt: null,
  lastRefreshAttempt: null,
  errorMessage: null,
  refreshFailureCount: 0,
};

export const INITIAL_STATE: TokenState = "idle";

// ============================================
// STATE TRANSITION TABLE
// ============================================

/**
 * Transition function: (state, event) → (nextState, context)
 * 
 * This is the heart of the FSM. Every possible transition
 * is explicitly defined here. Invalid transitions return null.
 */
export function transition(
  state: TokenState,
  event: TokenEvent,
  context: TokenContext
): { nextState: TokenState; nextContext: TokenContext } | null {
  
  log.debug(`Transition: ${state} + ${event.type}`);
  
  switch (state) {
    // ========== IDLE STATE ==========
    case "idle": {
      if (event.type === "LOGIN_SUCCESS") {
        return {
          nextState: "authenticated",
          nextContext: {
            ...context,
            expiresAt: Date.now() + event.expiresIn * 1000,
            errorMessage: null,
            refreshFailureCount: 0,
          },
        };
      }
      return null; // No other events valid in idle
    }
    
    // ========== AUTHENTICATED STATE ==========
    case "authenticated": {
      switch (event.type) {
        case "TIMER_NEAR_EXPIRY":
          return {
            nextState: "expiring",
            nextContext: context,
          };
          
        case "TIMER_EXPIRED":
          return {
            nextState: "expired",
            nextContext: {
              ...context,
              errorMessage: "Token expired",
            },
          };
          
        case "LOGOUT":
          return {
            nextState: "idle",
            nextContext: INITIAL_CONTEXT,
          };
          
        default:
          return null;
      }
    }
    
    // ========== EXPIRING STATE ==========
    case "expiring": {
      switch (event.type) {
        case "REFRESH_START":
          return {
            nextState: "refreshing",
            nextContext: {
              ...context,
              lastRefreshAttempt: Date.now(),
            },
          };
          
        case "TIMER_EXPIRED":
          return {
            nextState: "expired",
            nextContext: {
              ...context,
              errorMessage: "Token expired while waiting for refresh",
            },
          };
          
        case "LOGOUT":
          return {
            nextState: "idle",
            nextContext: INITIAL_CONTEXT,
          };
          
        default:
          return null;
      }
    }
    
    // ========== REFRESHING STATE ==========
    case "refreshing": {
      switch (event.type) {
        case "REFRESH_SUCCESS":
          return {
            nextState: "authenticated",
            nextContext: {
              ...context,
              expiresAt: Date.now() + event.expiresIn * 1000,
              errorMessage: null,
              refreshFailureCount: 0,
            },
          };
          
        case "REFRESH_FAILED": {
          const newFailureCount = context.refreshFailureCount + 1;
          
          // Too many failures → error state
          if (newFailureCount >= TOKEN_TIMING.MAX_REFRESH_FAILURES) {
            return {
              nextState: "error",
              nextContext: {
                ...context,
                errorMessage: event.error,
                refreshFailureCount: newFailureCount,
              },
            };
          }
          
          // Can still retry → back to expiring
          return {
            nextState: "expired",
            nextContext: {
              ...context,
              errorMessage: event.error,
              refreshFailureCount: newFailureCount,
            },
          };
        }
        
        case "LOGOUT":
          return {
            nextState: "idle",
            nextContext: INITIAL_CONTEXT,
          };
          
        default:
          return null;
      }
    }
    
    // ========== EXPIRED STATE ==========
    case "expired": {
      switch (event.type) {
        case "RETRY_REFRESH":
          return {
            nextState: "refreshing",
            nextContext: {
              ...context,
              lastRefreshAttempt: Date.now(),
            },
          };
          
        case "LOGIN_SUCCESS":
          return {
            nextState: "authenticated",
            nextContext: {
              ...context,
              expiresAt: Date.now() + event.expiresIn * 1000,
              errorMessage: null,
              refreshFailureCount: 0,
            },
          };
          
        case "CLEAR":
        case "LOGOUT":
          return {
            nextState: "idle",
            nextContext: INITIAL_CONTEXT,
          };
          
        default:
          return null;
      }
    }
    
    // ========== ERROR STATE ==========
    case "error": {
      switch (event.type) {
        case "CLEAR":
        case "LOGOUT":
          return {
            nextState: "idle",
            nextContext: INITIAL_CONTEXT,
          };
          
        case "LOGIN_SUCCESS":
          return {
            nextState: "authenticated",
            nextContext: {
              ...context,
              expiresAt: Date.now() + event.expiresIn * 1000,
              errorMessage: null,
              refreshFailureCount: 0,
            },
          };
          
        default:
          return null;
      }
    }
    
    default:
      return null;
  }
}

// ============================================
// STATE PREDICATES
// ============================================

/**
 * Check if current state allows API calls
 */
export function canMakeApiCalls(state: TokenState): boolean {
  return state === "authenticated" || state === "expiring" || state === "refreshing";
}

/**
 * Check if refresh is needed based on context
 */
export function needsRefresh(context: TokenContext): boolean {
  if (!context.expiresAt) return false;
  
  const timeUntilExpiry = context.expiresAt - Date.now();
  return timeUntilExpiry <= TOKEN_TIMING.REFRESH_THRESHOLD_MS;
}

/**
 * Check if token is fully expired
 */
export function isExpired(context: TokenContext): boolean {
  if (!context.expiresAt) return true;
  return Date.now() >= context.expiresAt;
}
