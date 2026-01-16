/**
 * API Errors - Unified Error Handling
 * 
 * RISE ARCHITECT PROTOCOL - Zero Technical Debt
 * 
 * This module provides error handling utilities for the API layer.
 * All errors are normalized to a consistent format.
 */

import type { ApiError, ApiErrorCode } from "./types";

// ============================================
// ERROR FACTORY
// ============================================

/**
 * Creates a standardized API error
 */
export function createApiError(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>
): ApiError {
  return { code, message, details };
}

// ============================================
// ERROR PARSING
// ============================================

/**
 * HTTP status to error code mapping
 */
const HTTP_STATUS_TO_ERROR_CODE: Record<number, ApiErrorCode> = {
  400: "VALIDATION_ERROR",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  429: "RATE_LIMITED",
  500: "INTERNAL_ERROR",
  502: "INTERNAL_ERROR",
  503: "INTERNAL_ERROR",
  504: "TIMEOUT",
};

/**
 * Parses an HTTP response into a standardized API error
 */
export function parseHttpError(status: number, body?: unknown): ApiError {
  const code = HTTP_STATUS_TO_ERROR_CODE[status] || "UNKNOWN";
  
  // Try to extract message from response body
  let message = "Erro desconhecido";
  if (body && typeof body === "object") {
    const bodyObj = body as Record<string, unknown>;
    if (typeof bodyObj.error === "string") {
      message = bodyObj.error;
    } else if (typeof bodyObj.message === "string") {
      message = bodyObj.message;
    }
  }
  
  return createApiError(code, message);
}

/**
 * Parses a network/fetch error into a standardized API error
 */
export function parseNetworkError(error: unknown): ApiError {
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return createApiError("TIMEOUT", "Tempo limite da requisição excedido");
    }
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return createApiError("NETWORK_ERROR", "Erro de conexão com o servidor");
    }
    return createApiError("UNKNOWN", error.message);
  }
  return createApiError("UNKNOWN", "Erro desconhecido");
}

// ============================================
// ERROR DISPLAY HELPERS
// ============================================

/**
 * User-friendly error messages by code
 */
const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  UNAUTHORIZED: "Sua sessão expirou. Faça login novamente.",
  FORBIDDEN: "Você não tem permissão para realizar esta ação.",
  NOT_FOUND: "O recurso solicitado não foi encontrado.",
  VALIDATION_ERROR: "Os dados informados são inválidos.",
  CONFLICT: "Esta operação conflita com dados existentes.",
  RATE_LIMITED: "Muitas requisições. Aguarde um momento.",
  INTERNAL_ERROR: "Erro interno do servidor. Tente novamente.",
  NETWORK_ERROR: "Erro de conexão. Verifique sua internet.",
  TIMEOUT: "A requisição demorou muito. Tente novamente.",
  UNKNOWN: "Ocorreu um erro inesperado.",
};

/**
 * Gets a user-friendly message for an error code
 */
export function getErrorMessage(code: ApiErrorCode): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN;
}

/**
 * Gets display message from an API error
 * Uses the error's message if available, falls back to code-based message
 */
export function getDisplayMessage(error: ApiError): string {
  // If the error has a specific message that isn't generic, use it
  if (error.message && error.message !== "Erro desconhecido") {
    return error.message;
  }
  return getErrorMessage(error.code);
}

// ============================================
// ERROR CHECKING UTILITIES
// ============================================

/**
 * Checks if an error is an authentication error
 */
export function isAuthError(error: ApiError): boolean {
  return error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN";
}

/**
 * Checks if an error is retryable
 */
export function isRetryableError(error: ApiError): boolean {
  return (
    error.code === "NETWORK_ERROR" ||
    error.code === "TIMEOUT" ||
    error.code === "INTERNAL_ERROR" ||
    error.code === "RATE_LIMITED"
  );
}
