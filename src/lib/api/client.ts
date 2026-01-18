/**
 * API Client - Unified Edge Function Client
 * 
 * RISE ARCHITECT PROTOCOL - Zero Technical Debt
 * 
 * This is the ONLY way the frontend should communicate with the backend.
 * All database operations MUST go through Edge Functions.
 * 
 * Features:
 * - Automatic X-Producer-Session-Token injection
 * - Standardized error handling
 * - Request timeout
 * - Correlation ID for tracing
 * 
 * Usage:
 * ```typescript
 * import { api } from "@/lib/api";
 * 
 * const { data, error } = await api.call<ProductResponse>("products-api", {
 *   action: "list",
 *   params: { page: 1, pageSize: 10 }
 * });
 * ```
 */

import { SUPABASE_URL } from "@/config/supabase";
import type { ApiResponse, ApiError } from "./types";
import { parseHttpError, parseNetworkError, createApiError } from "./errors";

import { producerTokenManager } from "@/lib/token-manager";

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_TIMEOUT = 30000; // 30 seconds

// ============================================
// HELPERS
// ============================================

/**
 * Generates a unique correlation ID for request tracing
 */
function generateCorrelationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * Gets a valid producer session token (with auto-refresh)
 */
async function getSessionToken(): Promise<string | null> {
  return producerTokenManager.getValidAccessToken();
}

// ============================================
// REQUEST OPTIONS
// ============================================

export interface ApiCallOptions {
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Skip authentication header (for public endpoints) */
  public?: boolean;
  /** Custom headers to include */
  headers?: Record<string, string>;
}

// ============================================
// MAIN API CLIENT
// ============================================

/**
 * Makes an authenticated request to a Supabase Edge Function
 * 
 * @param functionName - Name of the Edge Function
 * @param body - Request body (will be JSON stringified)
 * @param options - Request options
 * @returns Standardized API response
 */
async function call<T>(
  functionName: string,
  body?: unknown,
  options: ApiCallOptions = {}
): Promise<ApiResponse<T>> {
  const { timeout = DEFAULT_TIMEOUT, public: isPublic = false, headers: customHeaders = {} } = options;
  
  const correlationId = generateCorrelationId();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Correlation-Id": correlationId,
    ...customHeaders,
  };
  
  // Add auth header if not public (with auto-refresh via TokenManager)
  if (!isPublic) {
    const token = await getSessionToken();
    if (token) {
      headers["X-Producer-Session-Token"] = token;
    }
  }
  
  try {
    const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // Parse response body
    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = null;
    }
    
    // Handle non-OK responses
    if (!response.ok) {
      const error = parseHttpError(response.status, responseBody);
      console.error(`[API] ${functionName} failed:`, {
        correlationId,
        status: response.status,
        error,
      });
      return { data: null, error };
    }
    
    // Success
    return { data: responseBody as T, error: null };
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    const apiError = parseNetworkError(error);
    console.error(`[API] ${functionName} network error:`, {
      correlationId,
      error: apiError,
    });
    
    return { data: null, error: apiError };
  }
}

/**
 * Makes a public (unauthenticated) request to a Supabase Edge Function
 */
async function publicCall<T>(
  functionName: string,
  body?: unknown,
  options: Omit<ApiCallOptions, "public"> = {}
): Promise<ApiResponse<T>> {
  return call<T>(functionName, body, { ...options, public: true });
}

// ============================================
// ERROR HELPERS (re-exported for convenience)
// ============================================

export { createApiError } from "./errors";
export { isAuthError, isRetryableError, getDisplayMessage } from "./errors";

// ============================================
// EXPORTED API OBJECT
// ============================================

/**
 * Unified API client
 * 
 * Usage:
 * ```typescript
 * import { api } from "@/lib/api";
 * 
 * // Authenticated call
 * const { data, error } = await api.call("products-api", { action: "list" });
 * 
 * // Public call (no auth)
 * const { data, error } = await api.publicCall("checkout-public", { slug: "abc" });
 * ```
 */
export const api = {
  call,
  publicCall,
} as const;

// Type export for external usage
export type { ApiResponse, ApiError } from "./types";
