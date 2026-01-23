/**
 * Unified API Client (Legacy)
 * 
 * RISE ARCHITECT PROTOCOL V3 - DEPRECATED
 * 
 * @deprecated Use `api` from "@/lib/api" instead.
 * This file is kept for backward compatibility only.
 * 
 * RISE V3: Uses credentials: 'include' for httpOnly cookies
 */

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
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  
  // RISE V3: Cookies httpOnly - credentials: include faz o browser enviar automaticamente
  return fetch(url, { ...options, headers, credentials: 'include' });
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
  try {
    // RISE V3: Cookies httpOnly - credentials: include faz o browser enviar automaticamente
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/${functionName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro de conexão";
    return { data: null, error: message };
  }
}

/**
 * Gets the current producer ID from local storage cache.
 * 
 * @deprecated Use useUnifiedAuth() hook instead
 * @returns Always returns null - use hook for proper auth state
 */
export function getCachedProducerId(): string | null {
  // RISE V3: With httpOnly cookies, we can't check auth state synchronously
  // Use useUnifiedAuth() hook for proper auth state
  return null;
}
