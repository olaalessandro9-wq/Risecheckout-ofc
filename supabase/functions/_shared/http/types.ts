/**
 * HTTP Client Types - RISE V3 Modular
 * 
 * Tipos e interfaces para o cliente HTTP unificado.
 */

import { GatewayId } from "../payment-gateways/types.ts";

// ============================================
// CONSTANTS
// ============================================

export const DEFAULT_TIMEOUT = 15000;
export const DEFAULT_RETRIES = 3;
export const DEFAULT_RETRY_DELAY = 1000;
export const MAX_RETRY_DELAY = 10000;

// ============================================
// INTERFACES
// ============================================

export interface HttpClientConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface HttpResponse<T = unknown> {
  ok: boolean;
  success: boolean; // Alias for ok (compatibility)
  status: number;
  statusText: string;
  data: T | null;
  error?: string;
  headers?: Headers;
}

export interface GatewayClientConfig {
  gatewayId?: GatewayId;
  gateway?: GatewayId; // Alias for gatewayId (compatibility)
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  defaultHeaders?: Record<string, string>;
}

export interface GatewayHttpClient {
  get<T>(path: string, options?: FetchOptions): Promise<HttpResponse<T>>;
  post<T>(path: string, body: unknown, options?: FetchOptions): Promise<HttpResponse<T>>;
  put<T>(path: string, body: unknown, options?: FetchOptions): Promise<HttpResponse<T>>;
  delete<T>(path: string, options?: FetchOptions): Promise<HttpResponse<T>>;
  patch<T>(path: string, body: unknown, options?: FetchOptions): Promise<HttpResponse<T>>;
  getCircuitState?(): string;
}

export type RetryableError = {
  status: number;
  retryable: boolean;
  message: string;
};
