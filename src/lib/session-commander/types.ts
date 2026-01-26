/**
 * Session Commander Types
 * 
 * RISE ARCHITECT PROTOCOL V3 - Session Commander Architecture
 * 
 * Type definitions for the centralized session coordination system.
 */

// ============================================
// REFRESH RESULT TYPES
// ============================================

/**
 * Result of a refresh operation
 */
export interface RefreshResult {
  success: boolean;
  expiresIn?: number;
  reason?: RefreshFailureReason;
}

/**
 * Possible reasons for refresh failure
 */
export type RefreshFailureReason =
  | "expired"           // Refresh token expired - legitimate logout
  | "network_error"     // Transient network failure
  | "server_error"      // Server returned 5xx
  | "max_retries"       // Exceeded maximum retry attempts
  | "timeout"           // Request timed out
  | "unknown";          // Unknown error

// ============================================
// BACKEND RESPONSE TYPES
// ============================================

/**
 * Response from request-refresh endpoint
 */
export interface RequestRefreshResponse {
  status: "success" | "wait" | "unauthorized" | "error";
  message?: string;
  retryAfter?: number;
  expiresIn?: number;
  expiresAt?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

// ============================================
// COMMANDER STATE TYPES
// ============================================

/**
 * Current state of the Session Commander
 */
export type CommanderState =
  | "idle"           // No refresh in progress
  | "refreshing"     // Refresh in progress
  | "waiting"        // Waiting for other tab to complete
  | "reconnecting";  // Retrying after failure

/**
 * Session health status
 */
export interface SessionHealth {
  isHealthy: boolean;
  expiresAt: number | null;
  timeUntilExpiry: number | null;
  needsRefresh: boolean;
}

// ============================================
// CALLBACK TYPES
// ============================================

/**
 * Callback for session state changes
 */
export type SessionStateCallback = (health: SessionHealth) => void;

/**
 * Callback for reconnection events
 */
export type ReconnectingCallback = (attempt: number, maxAttempts: number) => void;

// ============================================
// CONFIGURATION TYPES
// ============================================

/**
 * Session Commander configuration
 */
export interface SessionCommanderConfig {
  /** Maximum retry attempts for refresh */
  maxRetries: number;
  
  /** Base delay for exponential backoff (ms) */
  baseDelayMs: number;
  
  /** Maximum delay for backoff (ms) */
  maxDelayMs: number;
  
  /** Timeout for refresh requests (ms) */
  requestTimeoutMs: number;
  
  /** Enable visual feedback (toasts) */
  enableFeedback: boolean;
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: SessionCommanderConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  requestTimeoutMs: 15000,
  enableFeedback: true,
};
