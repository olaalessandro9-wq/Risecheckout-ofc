/**
 * HTTP Client Resiliente
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Cliente HTTP centralizado com:
 * - Timeout configurável via AbortController
 * - Integração com Circuit Breaker
 * - Logging estruturado de todas operações
 * - Retry automático com backoff exponencial
 * - Safe JSON parsing
 * 
 * @module _shared/http-client
 */

import { createLogger } from "./logger.ts";
import { CircuitBreaker, CircuitBreakerConfig } from "./circuit-breaker.ts";

const log = createLogger("http-client");

// ============================================================================
// TYPES
// ============================================================================

export interface HttpClientConfig {
  /** Timeout em milissegundos (default: 10000) */
  timeout?: number;
  /** Número de retries (default: 0) */
  retries?: number;
  /** Delay base entre retries em ms (default: 1000) */
  retryDelay?: number;
  /** Prefixo para logging */
  logPrefix?: string;
  /** Headers padrão */
  defaultHeaders?: Record<string, string>;
}

export interface FetchOptions extends RequestInit {
  /** Override de timeout para esta request específica */
  timeout?: number;
}

export interface HttpResponse<T = unknown> {
  success: boolean;
  data?: T;
  status: number;
  statusText: string;
  headers: Headers;
  error?: string;
  retryCount?: number;
}

export interface GatewayClientConfig extends HttpClientConfig {
  /** URL base da API do gateway */
  baseUrl: string;
  /** Nome do gateway para logging/circuit breaker */
  gateway: string;
  /** Configuração do Circuit Breaker */
  circuitBreaker?: Partial<CircuitBreakerConfig>;
}

/** Tipo do cliente HTTP retornado por createGatewayClient */
export interface GatewayHttpClient {
  get<T = unknown>(path: string, options?: FetchOptions): Promise<HttpResponse<T>>;
  post<T = unknown>(path: string, body?: unknown, options?: FetchOptions): Promise<HttpResponse<T>>;
  put<T = unknown>(path: string, body?: unknown, options?: FetchOptions): Promise<HttpResponse<T>>;
  delete<T = unknown>(path: string, options?: FetchOptions): Promise<HttpResponse<T>>;
  patch<T = unknown>(path: string, body?: unknown, options?: FetchOptions): Promise<HttpResponse<T>>;
  getCircuitState(): string;
  resetCircuit(): void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_TIMEOUT = 10000; // 10 segundos
const DEFAULT_RETRIES = 0;
const DEFAULT_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30000;

// Configurações de Circuit Breaker por gateway
const GATEWAY_CIRCUIT_CONFIGS: Record<string, Partial<CircuitBreakerConfig>> = {
  asaas: {
    failureThreshold: 5,
    timeout: 30000,
    successThreshold: 2,
  },
  mercadopago: {
    failureThreshold: 5,
    timeout: 30000,
    successThreshold: 2,
  },
  stripe: {
    failureThreshold: 5,
    timeout: 30000,
    successThreshold: 2,
  },
  pushinpay: {
    failureThreshold: 5,
    timeout: 30000,
    successThreshold: 2,
  },
};

// Cache de circuit breakers por gateway
const circuitBreakers = new Map<string, CircuitBreaker>();

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Fetch com timeout usando AbortController
 * 
 * @example
 * const response = await fetchWithTimeout('https://api.example.com/data', {
 *   method: 'POST',
 *   body: JSON.stringify({ key: 'value' }),
 * }, 5000);
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeout}ms: ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch com parsing JSON seguro e tratamento de erros
 * 
 * @example
 * const result = await safeJsonFetch<ApiResponse>('https://api.example.com/data', {
 *   method: 'GET',
 *   headers: { 'Authorization': 'Bearer token' },
 * });
 * 
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 */
export async function safeJsonFetch<T = unknown>(
  url: string,
  options: FetchOptions = {},
  config: HttpClientConfig = {}
): Promise<HttpResponse<T>> {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    logPrefix = "http",
  } = config;

  let lastError: Error | null = null;
  let retryCount = 0;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const startTime = Date.now();
      
      const response = await fetchWithTimeout(url, options, timeout);
      
      const duration = Date.now() - startTime;
      log.info(`[${logPrefix}] ${options.method || "GET"} ${url} → ${response.status} (${duration}ms)`);

      // Parse JSON
      let data: T | undefined;
      const contentType = response.headers.get("content-type");
      
      if (contentType?.includes("application/json")) {
        try {
          data = await response.json();
        } catch {
          log.warn(`[${logPrefix}] Failed to parse JSON response from ${url}`);
        }
      }

      return {
        success: response.ok,
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
        retryCount,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      retryCount = attempt;

      // Não fazer retry se for o último attempt
      if (attempt < retries) {
        const delay = Math.min(retryDelay * Math.pow(2, attempt), MAX_RETRY_DELAY);
        log.warn(`[${logPrefix}] Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${retries}): ${lastError.message}`);
        await sleep(delay);
      }
    }
  }

  log.error(`[${logPrefix}] Request failed after ${retries + 1} attempts: ${lastError?.message}`);
  
  return {
    success: false,
    status: 0,
    statusText: "Network Error",
    headers: new Headers(),
    error: lastError?.message || "Unknown error",
    retryCount,
  };
}

// ============================================================================
// GATEWAY CLIENT FACTORY
// ============================================================================

/**
 * Cria um cliente HTTP especializado para um gateway de pagamento
 * 
 * Inclui:
 * - Circuit Breaker integrado
 * - Timeout padrão do gateway
 * - Logging com prefixo do gateway
 * - Headers padrão (auth, content-type)
 * 
 * @example
 * const asaasClient = createGatewayClient({
 *   gateway: 'asaas',
 *   baseUrl: 'https://api.asaas.com/v3',
 *   defaultHeaders: { 'access_token': apiKey },
 * });
 * 
 * const result = await asaasClient.post('/payments', { customer: 'cus_123' });
 */
export function createGatewayClient(config: GatewayClientConfig) {
  const {
    gateway,
    baseUrl,
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    defaultHeaders = {},
    circuitBreaker: cbConfig,
  } = config;

  // Obter ou criar Circuit Breaker para este gateway
  let breaker = circuitBreakers.get(gateway);
  if (!breaker) {
    const gatewayConfig = GATEWAY_CIRCUIT_CONFIGS[gateway] || {};
    breaker = new CircuitBreaker({
      name: `gateway-${gateway}`,
      failureThreshold: 5,
      timeout: 30000,
      successThreshold: 2,
      windowSize: 60000,
      ...gatewayConfig,
      ...cbConfig,
    });
    circuitBreakers.set(gateway, breaker);
  }

  const clientConfig: HttpClientConfig = {
    timeout,
    retries,
    retryDelay,
    logPrefix: gateway,
    defaultHeaders,
  };

  /**
   * Executa request com Circuit Breaker
   */
  async function executeWithBreaker<T>(
    method: string,
    path: string,
    options: FetchOptions = {}
  ): Promise<HttpResponse<T>> {
    const url = `${baseUrl}${path}`;
    
    const fetchOptions: FetchOptions = {
      ...options,
      method,
      headers: {
        "Content-Type": "application/json",
        ...defaultHeaders,
        ...options.headers,
      },
    };

    // Executar através do Circuit Breaker
    try {
      const result = await breaker!.execute(async () => {
        const response = await safeJsonFetch<T>(url, fetchOptions, clientConfig);
        
        // Se a request falhou com erro de rede ou 5xx, propagar para o circuit breaker
        if (!response.success && (response.status === 0 || response.status >= 500)) {
          throw new Error(response.error || "Request failed");
        }
        
        return response;
      });
      
      return result;
    } catch (error) {
      // Circuit está aberto ou request falhou
      if (error instanceof Error && error.message.includes("Circuit breaker is open")) {
        log.error(`[${gateway}] Circuit breaker OPEN - rejecting request to ${path}`);
        return {
          success: false,
          status: 503,
          statusText: "Service Unavailable",
          headers: new Headers(),
          error: `Gateway ${gateway} temporarily unavailable (circuit breaker open)`,
        };
      }
      
      throw error;
    }
  }

  return {
    /**
     * GET request
     */
    async get<T = unknown>(path: string, options?: FetchOptions): Promise<HttpResponse<T>> {
      return executeWithBreaker<T>("GET", path, options);
    },

    /**
     * POST request
     */
    async post<T = unknown>(
      path: string,
      body?: unknown,
      options?: FetchOptions
    ): Promise<HttpResponse<T>> {
      return executeWithBreaker<T>("POST", path, {
        ...options,
        body: body ? JSON.stringify(body) : undefined,
      });
    },

    /**
     * PUT request
     */
    async put<T = unknown>(
      path: string,
      body?: unknown,
      options?: FetchOptions
    ): Promise<HttpResponse<T>> {
      return executeWithBreaker<T>("PUT", path, {
        ...options,
        body: body ? JSON.stringify(body) : undefined,
      });
    },

    /**
     * DELETE request
     */
    async delete<T = unknown>(path: string, options?: FetchOptions): Promise<HttpResponse<T>> {
      return executeWithBreaker<T>("DELETE", path, options);
    },

    /**
     * PATCH request
     */
    async patch<T = unknown>(
      path: string,
      body?: unknown,
      options?: FetchOptions
    ): Promise<HttpResponse<T>> {
      return executeWithBreaker<T>("PATCH", path, {
        ...options,
        body: body ? JSON.stringify(body) : undefined,
      });
    },

    /**
     * Retorna estado atual do Circuit Breaker
     */
    getCircuitState(): string {
      return breaker!.getState();
    },

    /**
     * Força reset do Circuit Breaker (usar com cuidado)
     */
    resetCircuit(): void {
      breaker!.reset();
      log.info(`[${gateway}] Circuit breaker manually reset`);
    },
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper para criar headers de autenticação por gateway
 */
export function createGatewayHeaders(
  gateway: string,
  apiKey: string
): Record<string, string> {
  switch (gateway.toLowerCase()) {
    case "asaas":
      return { access_token: apiKey };
    case "mercadopago":
      return { Authorization: `Bearer ${apiKey}` };
    case "stripe":
      return { Authorization: `Bearer ${apiKey}` };
    case "pushinpay":
      return { Authorization: `Bearer ${apiKey}` };
    default:
      return { Authorization: `Bearer ${apiKey}` };
  }
}
