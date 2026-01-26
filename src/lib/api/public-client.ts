/**
 * Public API Client - Isolated from Auth System
 * 
 * RISE ARCHITECT PROTOCOL V3 - Zero Secrets in Frontend (10.0/10)
 * 
 * This client is completely isolated from the authentication system.
 * It has ZERO imports from TokenService, SessionCommander, or any auth module.
 * 
 * ARCHITECTURE:
 * - Calls go to api.risecheckout.com (Cloudflare Worker)
 * - Worker injects apikey header (from Secret)
 * - Frontend sends NO secrets
 * - No credentials: 'include' for maximum CORS compatibility
 * 
 * Use this for public-facing features that don't require authentication:
 * - Public checkout
 * - Payment links
 * - Public product pages
 * - Webhook receivers
 * 
 * @module lib/api/public-client
 */

import { API_GATEWAY_URL } from "@/config/supabase";
import type { ApiResponse, ApiError } from "./types";
import { parseHttpError, parseNetworkError } from "./errors";

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

// ============================================
// OPTIONS
// ============================================

export interface PublicApiCallOptions {
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Custom headers to include */
  headers?: Record<string, string>;
}

// ============================================
// PUBLIC API CLIENT
// ============================================

/**
 * Makes a public (unauthenticated) request to a Supabase Edge Function.
 * 
 * This function is COMPLETELY ISOLATED from authentication modules.
 * It does NOT:
 * - Import TokenService
 * - Import SessionCommander
 * - Attempt any token refresh
 * - Display any auth-related toasts
 * - Send any apikey (Worker injects)
 * 
 * @param functionName - Name of the Edge Function
 * @param body - Request body (will be JSON stringified)
 * @param options - Request options
 * @returns Standardized API response
 */
async function call<T>(
  functionName: string,
  body?: unknown,
  options: PublicApiCallOptions = {}
): Promise<ApiResponse<T>> {
  const { 
    timeout = DEFAULT_TIMEOUT, 
    headers: customHeaders = {},
  } = options;
  
  const correlationId = generateCorrelationId();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  // Build headers - NO apikey (Worker injects)
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Correlation-Id": correlationId,
    ...customHeaders,
  };
  
  const url = `${API_GATEWAY_URL}/functions/v1/${functionName}`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      // No credentials for public calls - avoids CORS issues with wildcards
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
      return { data: null, error };
    }
    
    // Success
    return { data: responseBody as T, error: null };
    
  } catch (error) {
    clearTimeout(timeoutId);
    const apiError = parseNetworkError(error);
    return { data: null, error: apiError };
  }
}

// ============================================
// EXPORTED API OBJECT
// ============================================

/**
 * Public API client - completely isolated from auth
 * 
 * Use this for all public checkout and payment operations.
 * 
 * Usage:
 * ```typescript
 * import { publicApi } from "@/lib/api/public-client";
 * 
 * const { data, error } = await publicApi.call("checkout-public-data", { 
 *   action: "resolve-and-load",
 *   slug: "abc123" 
 * });
 * ```
 */
export const publicApi = {
  call,
} as const;
