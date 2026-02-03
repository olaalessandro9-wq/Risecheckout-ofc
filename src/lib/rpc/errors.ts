/**
 * RPC Error - Preserves error code from API layer
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * This module provides error classes and utilities for RPC error handling.
 * Errors preserve their original code for proper contextual treatment in UI.
 */

import type { ApiErrorCode } from "@/lib/api/types";

/**
 * Error class that preserves the ApiErrorCode for proper handling
 */
export class RpcError extends Error {
  readonly code: ApiErrorCode;
  readonly isAuthError: boolean;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = "RpcError";
    this.code = code;
    this.isAuthError = code === "UNAUTHORIZED" || code === "FORBIDDEN";
  }
}

/**
 * Creates an RpcError from an ApiError
 */
export function createRpcError(code: ApiErrorCode, message: string): RpcError {
  return new RpcError(code, message);
}

/**
 * Type guard to check if error is RpcError
 */
export function isRpcError(error: unknown): error is RpcError {
  return error instanceof RpcError;
}

/**
 * Checks if any error is an authentication error
 */
export function isRpcAuthError(error: unknown): boolean {
  if (error instanceof RpcError) {
    return error.isAuthError;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes("autenticado") || 
           msg.includes("sessão") || 
           msg.includes("authentication") ||
           msg.includes("unauthorized");
  }
  return false;
}

/**
 * Gets user-friendly message for RPC errors
 */
export function getRpcErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof RpcError) {
    if (error.isAuthError) {
      return "Sua sessão expirou. Faça login novamente.";
    }
    return error.message || fallback;
  }
  if (error instanceof Error) {
    if (isRpcAuthError(error)) {
      return "Sua sessão expirou. Faça login novamente.";
    }
    return error.message || fallback;
  }
  return fallback;
}
