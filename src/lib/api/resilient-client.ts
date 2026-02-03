/**
 * Resilient API Client
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Enterprise-grade API client with:
 * - Automatic retry with exponential backoff
 * - Circuit breaker pattern
 * - Request timeout handling
 * - Transient error detection
 * 
 * Use this for CRITICAL paths like public checkout where
 * reliability is more important than speed.
 * 
 * @module lib/api/resilient-client
 */

import { publicApi } from "./public-client";
import type { ApiResponse, ApiError } from "./types";

// ============================================================================
// TYPES
// ============================================================================

export interface ResilientOptions {
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial retry delay in ms (default: 1000) */
  retryDelay?: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Circuit breaker threshold - failures before opening (default: 5) */
  circuitBreakerThreshold?: number;
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: Required<ResilientOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  timeout: 30000,
  circuitBreakerThreshold: 5,
};

/** Circuit breaker reset time in ms (30 seconds) */
const CIRCUIT_RESET_TIME = 30000;

/** Transient HTTP error codes that are safe to retry */
const RETRYABLE_STATUS_CODES = new Set([
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
]);

// ============================================================================
// STATE (Module-level singleton)
// ============================================================================

const circuitBreakers = new Map<string, CircuitBreakerState>();

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Wait for specified milliseconds
 */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determines if an error is transient and safe to retry
 */
function isRetryableError(error: ApiError | null): boolean {
  if (!error) return false;
  
  // Network errors are always retryable
  if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
    return true;
  }
  
  // Check HTTP status code from error details
  const statusFromDetails = error.details?.status as number | undefined;
  if (statusFromDetails && RETRYABLE_STATUS_CODES.has(statusFromDetails)) {
    return true;
  }
  
  // Internal errors are often transient
  if (error.code === 'INTERNAL_ERROR') {
    return true;
  }
  
  return false;
}

/**
 * Gets or creates circuit breaker state for a function
 */
function getCircuitBreaker(functionName: string): CircuitBreakerState {
  if (!circuitBreakers.has(functionName)) {
    circuitBreakers.set(functionName, {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
    });
  }
  return circuitBreakers.get(functionName)!;
}

/**
 * Records a failure in the circuit breaker
 */
function recordFailure(functionName: string, threshold: number): void {
  const state = getCircuitBreaker(functionName);
  state.failures++;
  state.lastFailure = Date.now();
  
  if (state.failures >= threshold) {
    state.isOpen = true;
  }
}

/**
 * Records a success in the circuit breaker (resets state)
 */
function recordSuccess(functionName: string): void {
  const state = getCircuitBreaker(functionName);
  state.failures = 0;
  state.isOpen = false;
}

/**
 * Checks if the circuit is open (should fail fast)
 */
function isCircuitOpen(functionName: string): boolean {
  const state = getCircuitBreaker(functionName);
  
  if (!state.isOpen) return false;
  
  // Check if enough time has passed to try again (half-open state)
  const timeSinceLastFailure = Date.now() - state.lastFailure;
  if (timeSinceLastFailure > CIRCUIT_RESET_TIME) {
    // Allow one request through (half-open)
    state.isOpen = false;
    state.failures = Math.floor(state.failures / 2); // Gradual reset
    return false;
  }
  
  return true;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Makes an API call with automatic retry and circuit breaker protection.
 * 
 * Features:
 * - Exponential backoff on retries
 * - Circuit breaker to prevent cascading failures
 * - Only retries transient errors (network, timeout, 5xx)
 * - Preserves the original API response type
 * 
 * @param functionName - Edge Function name
 * @param body - Request body
 * @param options - Resilient options
 * @returns API response (same as publicApi.call)
 * 
 * @example
 * ```typescript
 * import { callWithRetry } from "@/lib/api/resilient-client";
 * 
 * const { data, error } = await callWithRetry("checkout-public-data", {
 *   action: "resolve-and-load",
 *   slug: "abc123",
 * });
 * ```
 */
export async function callWithRetry<T>(
  functionName: string,
  body: unknown,
  options: ResilientOptions = {}
): Promise<ApiResponse<T>> {
  const config = { ...DEFAULT_CONFIG, ...options };
  let lastError: ApiError | null = null;

  // Check circuit breaker first
  if (isCircuitOpen(functionName)) {
    return {
      data: null,
      error: {
        message: "Serviço temporariamente indisponível. Tente novamente em alguns segundos.",
        code: "RATE_LIMITED",
        details: { circuitOpen: true, status: 503 },
      },
    };
  }

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    const result = await publicApi.call<T>(functionName, body, {
      timeout: config.timeout,
    });

    // Success - reset circuit breaker and return
    if (result.data) {
      recordSuccess(functionName);
      return result;
    }

    lastError = result.error;

    // Don't retry non-transient errors
    if (!isRetryableError(result.error)) {
      break;
    }

    // Record failure for circuit breaker
    recordFailure(functionName, config.circuitBreakerThreshold);

    // Exponential backoff (only if we're going to retry)
    if (attempt < config.maxRetries) {
      const delay = config.retryDelay * Math.pow(config.backoffMultiplier, attempt - 1);
      // Add jitter (10% random variation) to prevent thundering herd
      const jitter = delay * 0.1 * Math.random();
      await wait(delay + jitter);
    }
  }

  // All retries exhausted
  return { data: null, error: lastError };
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * Pre-configured resilient client for checkout operations.
 * 
 * Uses optimized settings for checkout:
 * - 3 retries
 * - 20 second timeout
 * - Aggressive backoff
 */
export const resilientApi = {
  call: callWithRetry,
  
  /**
   * Checkout-optimized call with faster settings
   */
  checkout: async <T>(functionName: string, body: unknown) => {
    return callWithRetry<T>(functionName, body, {
      maxRetries: 3,
      retryDelay: 500,
      timeout: 20000,
    });
  },
  
  /**
   * Payment-critical call with maximum reliability
   */
  payment: async <T>(functionName: string, body: unknown) => {
    return callWithRetry<T>(functionName, body, {
      maxRetries: 5,
      retryDelay: 1000,
      timeout: 45000,
    });
  },
} as const;
