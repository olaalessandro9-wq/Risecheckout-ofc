/**
 * Unit Tests: API Errors
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for error factory, parsing, and utility functions.
 * 
 * @module lib/api/errors.test
 */

import { describe, it, expect } from "vitest";
import {
  createApiError,
  parseHttpError,
  parseNetworkError,
  getErrorMessage,
  getDisplayMessage,
  isAuthError,
  isRetryableError,
} from "./errors";
import type { ApiError, ApiErrorCode } from "./types";

// ============================================================================
// createApiError
// ============================================================================

describe("createApiError", () => {
  it("should create an error with code and message", () => {
    const error = createApiError("NOT_FOUND", "Resource not found");
    
    expect(error.code).toBe("NOT_FOUND");
    expect(error.message).toBe("Resource not found");
    expect(error.details).toBeUndefined();
  });

  it("should create an error with optional details", () => {
    const details = { field: "email", constraint: "unique" };
    const error = createApiError("VALIDATION_ERROR", "Invalid input", details);
    
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.message).toBe("Invalid input");
    expect(error.details).toEqual(details);
  });

  it("should handle all error codes", () => {
    const codes: ApiErrorCode[] = [
      "UNAUTHORIZED",
      "FORBIDDEN",
      "NOT_FOUND",
      "VALIDATION_ERROR",
      "CONFLICT",
      "RATE_LIMITED",
      "INTERNAL_ERROR",
      "NETWORK_ERROR",
      "TIMEOUT",
      "UNKNOWN",
    ];

    codes.forEach((code) => {
      const error = createApiError(code, `Test ${code}`);
      expect(error.code).toBe(code);
    });
  });
});

// ============================================================================
// parseHttpError
// ============================================================================

describe("parseHttpError", () => {
  it("should map 400 to VALIDATION_ERROR", () => {
    const error = parseHttpError(400);
    expect(error.code).toBe("VALIDATION_ERROR");
  });

  it("should map 401 to UNAUTHORIZED", () => {
    const error = parseHttpError(401);
    expect(error.code).toBe("UNAUTHORIZED");
  });

  it("should map 403 to FORBIDDEN", () => {
    const error = parseHttpError(403);
    expect(error.code).toBe("FORBIDDEN");
  });

  it("should map 404 to NOT_FOUND", () => {
    const error = parseHttpError(404);
    expect(error.code).toBe("NOT_FOUND");
  });

  it("should map 409 to CONFLICT", () => {
    const error = parseHttpError(409);
    expect(error.code).toBe("CONFLICT");
  });

  it("should map 429 to RATE_LIMITED", () => {
    const error = parseHttpError(429);
    expect(error.code).toBe("RATE_LIMITED");
  });

  it("should map 500 to INTERNAL_ERROR", () => {
    const error = parseHttpError(500);
    expect(error.code).toBe("INTERNAL_ERROR");
  });

  it("should map 502 to INTERNAL_ERROR", () => {
    const error = parseHttpError(502);
    expect(error.code).toBe("INTERNAL_ERROR");
  });

  it("should map 503 to INTERNAL_ERROR", () => {
    const error = parseHttpError(503);
    expect(error.code).toBe("INTERNAL_ERROR");
  });

  it("should map 504 to TIMEOUT", () => {
    const error = parseHttpError(504);
    expect(error.code).toBe("TIMEOUT");
  });

  it("should map unknown status to UNKNOWN", () => {
    const error = parseHttpError(418); // I'm a teapot
    expect(error.code).toBe("UNKNOWN");
  });

  it("should extract error message from body.error", () => {
    const body = { error: "Email already exists" };
    const error = parseHttpError(409, body);
    
    expect(error.message).toBe("Email already exists");
  });

  it("should extract error message from body.message", () => {
    const body = { message: "Invalid token" };
    const error = parseHttpError(401, body);
    
    expect(error.message).toBe("Invalid token");
  });

  it("should prefer body.error over body.message", () => {
    const body = { error: "Primary error", message: "Secondary message" };
    const error = parseHttpError(400, body);
    
    expect(error.message).toBe("Primary error");
  });

  it("should use default message when body is null", () => {
    const error = parseHttpError(500, null);
    expect(error.message).toBe("Erro desconhecido");
  });

  it("should use default message when body is not an object", () => {
    const error = parseHttpError(500, "string body");
    expect(error.message).toBe("Erro desconhecido");
  });

  it("should use default message when body has no error/message", () => {
    const error = parseHttpError(500, { data: "something" });
    expect(error.message).toBe("Erro desconhecido");
  });
});

// ============================================================================
// parseNetworkError
// ============================================================================

describe("parseNetworkError", () => {
  it("should parse AbortError as TIMEOUT", () => {
    const abortError = new Error("Request aborted");
    abortError.name = "AbortError";
    
    const error = parseNetworkError(abortError);
    
    expect(error.code).toBe("TIMEOUT");
    expect(error.message).toBe("Tempo limite da requisição excedido");
  });

  it("should parse fetch error as NETWORK_ERROR", () => {
    const fetchError = new Error("fetch failed");
    
    const error = parseNetworkError(fetchError);
    
    expect(error.code).toBe("NETWORK_ERROR");
    expect(error.message).toBe("Erro de conexão com o servidor");
  });

  it("should parse network error as NETWORK_ERROR", () => {
    const networkError = new Error("network request failed");
    
    const error = parseNetworkError(networkError);
    
    expect(error.code).toBe("NETWORK_ERROR");
  });

  it("should parse generic Error as UNKNOWN with message", () => {
    const genericError = new Error("Something went wrong");
    
    const error = parseNetworkError(genericError);
    
    expect(error.code).toBe("UNKNOWN");
    expect(error.message).toBe("Something went wrong");
  });

  it("should handle non-Error objects as UNKNOWN", () => {
    const error = parseNetworkError("string error");
    
    expect(error.code).toBe("UNKNOWN");
    expect(error.message).toBe("Erro desconhecido");
  });

  it("should handle null as UNKNOWN", () => {
    const error = parseNetworkError(null);
    
    expect(error.code).toBe("UNKNOWN");
    expect(error.message).toBe("Erro desconhecido");
  });

  it("should handle undefined as UNKNOWN", () => {
    const error = parseNetworkError(undefined);
    
    expect(error.code).toBe("UNKNOWN");
    expect(error.message).toBe("Erro desconhecido");
  });
});

// ============================================================================
// getErrorMessage
// ============================================================================

describe("getErrorMessage", () => {
  it("should return user-friendly message for UNAUTHORIZED", () => {
    const message = getErrorMessage("UNAUTHORIZED");
    expect(message).toBe("Sua sessão expirou. Faça login novamente.");
  });

  it("should return user-friendly message for FORBIDDEN", () => {
    const message = getErrorMessage("FORBIDDEN");
    expect(message).toBe("Você não tem permissão para realizar esta ação.");
  });

  it("should return user-friendly message for NOT_FOUND", () => {
    const message = getErrorMessage("NOT_FOUND");
    expect(message).toBe("O recurso solicitado não foi encontrado.");
  });

  it("should return user-friendly message for VALIDATION_ERROR", () => {
    const message = getErrorMessage("VALIDATION_ERROR");
    expect(message).toContain("dados informados são inválidos");
  });

  it("should return user-friendly message for CONFLICT", () => {
    const message = getErrorMessage("CONFLICT");
    expect(message).toBe("Este dado já existe no sistema.");
  });

  it("should return user-friendly message for RATE_LIMITED", () => {
    const message = getErrorMessage("RATE_LIMITED");
    expect(message).toContain("Muitas tentativas");
  });

  it("should return user-friendly message for INTERNAL_ERROR", () => {
    const message = getErrorMessage("INTERNAL_ERROR");
    expect(message).toContain("Erro interno do servidor");
  });

  it("should return user-friendly message for NETWORK_ERROR", () => {
    const message = getErrorMessage("NETWORK_ERROR");
    expect(message).toContain("Erro de conexão");
  });

  it("should return user-friendly message for TIMEOUT", () => {
    const message = getErrorMessage("TIMEOUT");
    expect(message).toContain("conexão demorou muito");
  });

  it("should return user-friendly message for UNKNOWN", () => {
    const message = getErrorMessage("UNKNOWN");
    expect(message).toContain("erro inesperado");
  });
});

// ============================================================================
// getDisplayMessage
// ============================================================================

describe("getDisplayMessage", () => {
  it("should use error message if not generic", () => {
    const error: ApiError = {
      code: "VALIDATION_ERROR",
      message: "Email é obrigatório",
    };
    
    const message = getDisplayMessage(error);
    expect(message).toBe("Email é obrigatório");
  });

  it("should fall back to code message if error message is generic", () => {
    const error: ApiError = {
      code: "UNAUTHORIZED",
      message: "Erro desconhecido",
    };
    
    const message = getDisplayMessage(error);
    expect(message).toBe("Sua sessão expirou. Faça login novamente.");
  });

  it("should fall back to code message if error message is empty", () => {
    const error: ApiError = {
      code: "NOT_FOUND",
      message: "",
    };
    
    const message = getDisplayMessage(error);
    // Empty string is falsy, so should fall back
    expect(message).toBe("O recurso solicitado não foi encontrado.");
  });
});

// ============================================================================
// isAuthError
// ============================================================================

describe("isAuthError", () => {
  it("should return true for UNAUTHORIZED", () => {
    const error: ApiError = { code: "UNAUTHORIZED", message: "Test" };
    expect(isAuthError(error)).toBe(true);
  });

  it("should return true for FORBIDDEN", () => {
    const error: ApiError = { code: "FORBIDDEN", message: "Test" };
    expect(isAuthError(error)).toBe(true);
  });

  it("should return false for NOT_FOUND", () => {
    const error: ApiError = { code: "NOT_FOUND", message: "Test" };
    expect(isAuthError(error)).toBe(false);
  });

  it("should return false for VALIDATION_ERROR", () => {
    const error: ApiError = { code: "VALIDATION_ERROR", message: "Test" };
    expect(isAuthError(error)).toBe(false);
  });

  it("should return false for NETWORK_ERROR", () => {
    const error: ApiError = { code: "NETWORK_ERROR", message: "Test" };
    expect(isAuthError(error)).toBe(false);
  });
});

// ============================================================================
// isRetryableError
// ============================================================================

describe("isRetryableError", () => {
  it("should return true for NETWORK_ERROR", () => {
    const error: ApiError = { code: "NETWORK_ERROR", message: "Test" };
    expect(isRetryableError(error)).toBe(true);
  });

  it("should return true for TIMEOUT", () => {
    const error: ApiError = { code: "TIMEOUT", message: "Test" };
    expect(isRetryableError(error)).toBe(true);
  });

  it("should return true for INTERNAL_ERROR", () => {
    const error: ApiError = { code: "INTERNAL_ERROR", message: "Test" };
    expect(isRetryableError(error)).toBe(true);
  });

  it("should return true for RATE_LIMITED", () => {
    const error: ApiError = { code: "RATE_LIMITED", message: "Test" };
    expect(isRetryableError(error)).toBe(true);
  });

  it("should return false for UNAUTHORIZED", () => {
    const error: ApiError = { code: "UNAUTHORIZED", message: "Test" };
    expect(isRetryableError(error)).toBe(false);
  });

  it("should return false for FORBIDDEN", () => {
    const error: ApiError = { code: "FORBIDDEN", message: "Test" };
    expect(isRetryableError(error)).toBe(false);
  });

  it("should return false for VALIDATION_ERROR", () => {
    const error: ApiError = { code: "VALIDATION_ERROR", message: "Test" };
    expect(isRetryableError(error)).toBe(false);
  });

  it("should return false for NOT_FOUND", () => {
    const error: ApiError = { code: "NOT_FOUND", message: "Test" };
    expect(isRetryableError(error)).toBe(false);
  });

  it("should return false for CONFLICT", () => {
    const error: ApiError = { code: "CONFLICT", message: "Test" };
    expect(isRetryableError(error)).toBe(false);
  });

  it("should return false for UNKNOWN", () => {
    const error: ApiError = { code: "UNKNOWN", message: "Test" };
    expect(isRetryableError(error)).toBe(false);
  });
});
