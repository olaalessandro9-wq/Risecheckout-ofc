/**
 * Retry Strategy - Exponential Backoff with Jitter
 * 
 * RISE ARCHITECT PROTOCOL V3 - Session Commander Architecture
 * 
 * Implements intelligent retry logic for refresh operations.
 */

import { DEFAULT_CONFIG } from "./types";

// ============================================
// EXPONENTIAL BACKOFF
// ============================================

/**
 * Calculate delay for exponential backoff with jitter
 * 
 * Formula: min(baseDelay * 2^attempt, maxDelay) ± 25% jitter
 * 
 * Example with base=1000, max=10000:
 * - Attempt 1: ~1000ms (750-1250ms)
 * - Attempt 2: ~2000ms (1500-2500ms)
 * - Attempt 3: ~4000ms (3000-5000ms)
 * - Attempt 4+: ~10000ms (7500-12500ms) - capped
 * 
 * @param attempt - Current attempt number (1-based)
 * @param baseDelayMs - Base delay in milliseconds
 * @param maxDelayMs - Maximum delay in milliseconds
 * @returns Delay in milliseconds with jitter applied
 */
export function getExponentialDelay(
  attempt: number,
  baseDelayMs: number = DEFAULT_CONFIG.baseDelayMs,
  maxDelayMs: number = DEFAULT_CONFIG.maxDelayMs
): number {
  // Calculate exponential delay: base * 2^(attempt-1)
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
  
  // Cap at maximum delay
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);
  
  // Add jitter (±25%) to prevent thundering herd
  const jitterFactor = 0.25;
  const jitter = cappedDelay * jitterFactor * (Math.random() * 2 - 1);
  
  return Math.round(cappedDelay + jitter);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Sleep for a specified duration
 * 
 * @param ms - Duration in milliseconds
 * @returns Promise that resolves after the delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a unique tab identifier
 * 
 * @returns Unique tab ID string
 */
export function generateTabId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `tab_${timestamp}_${random}`;
}

// ============================================
// RETRY HELPERS
// ============================================

/**
 * Determine if an error is retryable
 * 
 * @param reason - Failure reason
 * @returns true if the operation should be retried
 */
export function isRetryableFailure(reason: string): boolean {
  const retryableReasons = [
    "network_error",
    "server_error",
    "timeout",
  ];
  return retryableReasons.includes(reason);
}

/**
 * Format remaining time for display
 * 
 * @param ms - Milliseconds
 * @returns Human-readable time string
 */
export function formatTimeRemaining(ms: number): string {
  if (ms < 60000) {
    return `${Math.ceil(ms / 1000)}s`;
  }
  if (ms < 3600000) {
    return `${Math.ceil(ms / 60000)}min`;
  }
  return `${Math.ceil(ms / 3600000)}h`;
}
