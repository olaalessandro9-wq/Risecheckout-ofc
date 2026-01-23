/**
 * Fetch Utilities - RISE V3 Modular
 * 
 * Funções utilitárias para fetch com timeout e retry.
 */

import { createLogger } from "../logger.ts";
import { 
  FetchOptions, 
  HttpResponse, 
  DEFAULT_TIMEOUT, 
  DEFAULT_RETRIES, 
  DEFAULT_RETRY_DELAY,
  MAX_RETRY_DELAY 
} from "./types.ts";

const log = createLogger("http-fetch-utils");

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isRetryableError(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

export function calculateBackoffDelay(attempt: number, baseDelay: number): number {
  const delay = baseDelay * Math.pow(2, attempt);
  return Math.min(delay, MAX_RETRY_DELAY);
}

/**
 * Fetch com timeout usando AbortController
 * Compatível com assinatura antiga: (url, options, timeout?)
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {},
  timeoutOverride?: number
): Promise<Response> {
  const timeout = timeoutOverride ?? options.timeout ?? DEFAULT_TIMEOUT;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch seguro com retry automático e parsing JSON
 */
export async function safeJsonFetch<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<HttpResponse<T>> {
  const retries = options.retries ?? DEFAULT_RETRIES;
  const retryDelay = options.retryDelay ?? DEFAULT_RETRY_DELAY;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);
      
      let data: T | null = null;
      const contentType = response.headers.get("content-type");
      
      if (contentType?.includes("application/json")) {
        try {
          data = await response.json() as T;
        } catch {
          log.warn("Failed to parse JSON response");
        }
      }
      
      if (!response.ok && isRetryableError(response.status) && attempt < retries) {
        const delay = calculateBackoffDelay(attempt, retryDelay);
        log.warn(`Retryable error ${response.status}, retrying in ${delay}ms`);
        await sleep(delay);
        continue;
      }
      
      return {
        ok: response.ok,
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data,
        headers: response.headers,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      };
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (lastError.name === "AbortError") {
        return { ok: false, success: false, status: 408, statusText: "Request Timeout", data: null, error: "Request timed out" };
      }
      
      if (attempt < retries) {
        const delay = calculateBackoffDelay(attempt, retryDelay);
        log.warn(`Network error, retrying in ${delay}ms: ${lastError.message}`);
        await sleep(delay);
        continue;
      }
    }
  }
  
  return { ok: false, success: false, status: 0, statusText: "Network Error", data: null, error: lastError?.message ?? "Unknown error" };
}
