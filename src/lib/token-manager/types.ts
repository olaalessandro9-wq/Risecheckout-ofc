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
 * The authentication domain (RISE V3: Single Identity)
 */
export type TokenType = "unified";

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
  unified: {
    state: "unified_auth_state",
    expiresAt: "unified_auth_expires_at",
    lastRefresh: "unified_auth_last_refresh",
  },
} as const;

// ============================================
// TIMING CONSTANTS (SESSION COMMANDER)
// ============================================

/**
 * Timing constants for the FSM
 * 
 * SESSION COMMANDER ARCHITECTURE - RISE V3 2026-01-26
 * 
 * Updated to align with 4-hour access token duration:
 * - 30 min threshold = 3h30min effective session
 * - Longer timeout for slow networks
 */
export const TOKEN_TIMING = {
  /** 
   * Start refresh when this many ms remain before expiry
   * 30 minutes before expiry (aligned with 4-hour access token)
   */
  REFRESH_THRESHOLD_MS: 30 * 60 * 1000, // 30 minutes
  
  /** Maximum time to wait for refresh before timing out (increased for slow networks) */
  REFRESH_TIMEOUT_MS: 15 * 1000, // 15 seconds
  
  /** 
   * Interval to check token status in background
   * (Session Commander uses event-driven monitoring, this is fallback)
   */
  HEARTBEAT_INTERVAL_MS: 60 * 1000, // 60 seconds
  
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
