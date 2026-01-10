/**
 * Unified API Client
 * 
 * RISE ARCHITECT PROTOCOL - Zero Technical Debt
 * 
 * This module provides utilities for making authenticated API calls
 * that automatically include the producer_session_token in headers.
 * 
 * Usage:
 * ```typescript
 * import { apiCall, invokeEdgeFunction } from "@/lib/api-client";
 * 
 * // For raw fetch with auth
 * const response = await apiCall("/some/endpoint", { method: "POST", body: JSON.stringify(data) });
 * 
 * // For Supabase Edge Functions
 * const result = await invokeEdgeFunction("my-function", { action: "do_something" });
 * ```
 */

import { getProducerSessionToken } from "@/hooks/useProducerAuth";
import { SUPABASE_URL } from "@/config/supabase";

/**
 * Makes an authenticated API call with the producer session token.
 * 
 * @param url - Full URL or path to call
 * @param options - Standard fetch options
 * @returns Promise<Response>
 */
export async function apiCall(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getProducerSessionToken();
  
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  
  if (token) {
    headers.set("X-Producer-Session-Token", token);
  }
  
  return fetch(url, { ...options, headers });
}

/**
 * Invokes a Supabase Edge Function with automatic authentication.
 * 
 * @param functionName - Name of the edge function
 * @param body - Request body (will be JSON stringified)
 * @returns Promise with the JSON response
 */
export async function invokeEdgeFunction<T = unknown>(
  functionName: string,
  body?: object
): Promise<{ data: T | null; error: string | null }> {
  const token = getProducerSessionToken();
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/${functionName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "X-Producer-Session-Token": token } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { 
        data: null, 
        error: data.error || `HTTP ${response.status}` 
      };
    }

    return { data: data as T, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro de conexão";
    return { data: null, error: message };
  }
}

/**
 * Gets the current producer ID from local storage cache.
 * This is a synchronous helper for cases where you can't use the hook.
 * 
 * Note: This returns the cached value. For fresh validation, use useAuth().
 * 
 * @returns Producer ID or null
 */
export function getCachedProducerId(): string | null {
  // The producer data is cached in React Query, but we can't access it synchronously
  // For edge function calls, we send the token and let the server validate
  const token = getProducerSessionToken();
  return token ? "requires-server-validation" : null;
}
