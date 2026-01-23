/**
 * Gateway HTTP Client - RISE V3 Modular
 * 
 * Factory para criar clientes HTTP específicos de gateway com Circuit Breaker.
 */

import { createLogger } from "../logger.ts";
import { CircuitBreaker, GATEWAY_CIRCUIT_CONFIGS } from "../circuit-breaker.ts";
import { GatewayClientConfig, GatewayHttpClient, HttpResponse, FetchOptions, DEFAULT_TIMEOUT } from "./types.ts";
import { safeJsonFetch } from "./fetch-utils.ts";
import { createGatewayHeaders } from "./gateway-headers.ts";

const log = createLogger("gateway-client");

// Cache de Circuit Breakers por gateway
const circuitBreakers = new Map<string, CircuitBreaker>();

/**
 * Obtém ou cria CircuitBreaker para um gateway
 */
function getOrCreateCircuitBreaker(gatewayId: string): CircuitBreaker {
  if (!circuitBreakers.has(gatewayId)) {
    const config = GATEWAY_CIRCUIT_CONFIGS[gatewayId];
    if (config) {
      circuitBreakers.set(gatewayId, new CircuitBreaker(config));
    } else {
      circuitBreakers.set(gatewayId, new CircuitBreaker({ 
        name: `${gatewayId}-api`,
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 30000,
        windowSize: 60000
      }));
    }
  }
  return circuitBreakers.get(gatewayId)!;
}

/**
 * Factory para criar cliente HTTP específico de gateway
 */
export function createGatewayClient(config: GatewayClientConfig): GatewayHttpClient {
  // Support both gatewayId and gateway (alias)
  const gatewayId = config.gatewayId || config.gateway || 'unknown';
  const { baseUrl, apiKey, timeout = DEFAULT_TIMEOUT, retries = 2, defaultHeaders } = config;
  
  const headers = defaultHeaders || (apiKey ? createGatewayHeaders(gatewayId, apiKey) : {});
  const circuitBreaker = getOrCreateCircuitBreaker(gatewayId);
  
  const buildUrl = (path: string): string => {
    const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  };
  
  const request = async <T>(
    method: string,
    path: string,
    body?: unknown,
    options?: FetchOptions
  ): Promise<HttpResponse<T>> => {
    const url = buildUrl(path);
    
    try {
      const response = await circuitBreaker.execute(async () => {
        return await safeJsonFetch<T>(url, {
          method,
          headers: { ...headers, ...options?.headers },
          body: body ? JSON.stringify(body) : undefined,
          timeout: options?.timeout ?? timeout,
          retries: options?.retries ?? retries,
          ...options,
        });
      });
      // Add success alias
      return { ...response, success: response.ok };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error(`Request failed for ${gatewayId}: ${errorMessage}`);
      return {
        ok: false,
        success: false,
        status: 503,
        statusText: "Service Unavailable",
        data: null,
        error: errorMessage,
      };
    }
  };
  
  return {
    get: <T>(path: string, options?: FetchOptions) => 
      request<T>("GET", path, undefined, options),
      
    post: <T>(path: string, body: unknown, options?: FetchOptions) => 
      request<T>("POST", path, body, options),
      
    put: <T>(path: string, body: unknown, options?: FetchOptions) => 
      request<T>("PUT", path, body, options),
      
    delete: <T>(path: string, options?: FetchOptions) => 
      request<T>("DELETE", path, undefined, options),
      
    patch: <T>(path: string, body: unknown, options?: FetchOptions) => 
      request<T>("PATCH", path, body, options),
    
    getCircuitState: () => circuitBreaker.getState(),
  };
}

export function resetCircuitBreaker(gatewayId: string): void {
  const breaker = circuitBreakers.get(gatewayId);
  if (breaker) breaker.reset();
}

export function getCircuitBreakerState(gatewayId: string): string | null {
  const breaker = circuitBreakers.get(gatewayId);
  return breaker ? breaker.getState() : null;
}
