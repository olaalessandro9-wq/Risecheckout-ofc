/**
 * Token Manager Types - FSM Architecture
 * 
 * RISE Protocol V3: State Machine for Token Lifecycle
 * 
 * This module defines all types for the Token Lifecycle FSM,
 * ensuring impossible states cannot exist.
 */

// ============================================
// TOKEN STATES (Discriminated Union)
// ============================================

/**
 * All possible states of the token lifecycle
 * 
 * States form a directed graph with well-defined transitions.
 * No state can transition to itself except via explicit events.
 */
export type TokenState = 
  | "idle"           // Not authenticated
  | "authenticated"  // Token valid, timer running
  | "expiring"       // Token expiring soon (< threshold)
  | "refreshing"     // Refresh in progress
  | "expired"        // Token expired, needs re-login
  | "error";         // Unrecoverable error

// ============================================
// TOKEN EVENTS (Discriminated Union)
// ============================================

/**
 * All events that can trigger state transitions
 * 
 * Events are the ONLY way to change state.
 * Each event carries its own payload type.
 */
export type TokenEvent =
  | { type: "LOGIN_SUCCESS"; expiresIn: number }
  | { type: "TIMER_NEAR_EXPIRY" }
  | { type: "TIMER_EXPIRED" }
  | { type: "REFRESH_START" }
  | { type: "REFRESH_SUCCESS"; expiresIn: number }
  | { type: "REFRESH_FAILED"; error: string }
  | { type: "LOGOUT" }
  | { type: "CLEAR" }
  | { type: "RETRY_REFRESH" };

// ============================================
// TOKEN CONTEXT (Extended State)
// ============================================

/**
 * Extended state that persists across transitions
 * 
 * Context holds data that doesn't define the state
 * but is needed for business logic.
 */
export interface TokenContext {
  /** When the current token expires (ms since epoch) */
  expiresAt: number | null;
  /** Last time a refresh was attempted */
  lastRefreshAttempt: number | null;
  /** Error message from last failure */
  errorMessage: string | null;
  /** Number of consecutive refresh failures */
  refreshFailureCount: number;
}

// ============================================
// TOKEN TYPE (Domain Identifier)
// ============================================

/**
 * The two authentication domains in the system
 */
export type TokenType = "producer" | "buyer";

// ============================================
// LOCAL STORAGE KEYS
// ============================================

/**
 * Storage keys for persisted auth state
 * 
 * Note: We only store AUTH STATE, not tokens.
 * Tokens are in httpOnly cookies.
 */
export interface StorageKeys {
  readonly state: string;
  readonly expiresAt: string;
  readonly lastRefresh: string;
}

export const STORAGE_KEYS: Record<TokenType, StorageKeys> = {
  producer: {
    state: "producer_auth_state",
    expiresAt: "producer_auth_expires_at",
    lastRefresh: "producer_auth_last_refresh",
  },
  buyer: {
    state: "buyer_auth_state",
    expiresAt: "buyer_auth_expires_at",
    lastRefresh: "buyer_auth_last_refresh",
  },
} as const;

// ============================================
// TIMING CONSTANTS
// ============================================

/**
 * Timing constants for the FSM
 * 
 * These define when state transitions occur.
 */
export const TOKEN_TIMING = {
  /** Start refresh when this many ms remain before expiry */
  REFRESH_THRESHOLD_MS: 2 * 60 * 1000, // 2 minutes
  
  /** Maximum time to wait for refresh before timing out */
  REFRESH_TIMEOUT_MS: 10 * 1000, // 10 seconds
  
  /** Interval to check token status in background */
  HEARTBEAT_INTERVAL_MS: 30 * 1000, // 30 seconds
  
  /** Maximum consecutive refresh failures before going to error state */
  MAX_REFRESH_FAILURES: 3,
} as const;

// ============================================
// SUBSCRIBER TYPE
// ============================================

/**
 * Callback type for state change subscribers
 */
export type TokenStateSubscriber = (state: TokenState, context: TokenContext) => void;

// ============================================
// REFRESH RESPONSE TYPE
// ============================================

/**
 * Response from the refresh endpoint
 */
export interface RefreshResponse {
  success: boolean;
  expiresIn?: number;
  error?: string;
}
