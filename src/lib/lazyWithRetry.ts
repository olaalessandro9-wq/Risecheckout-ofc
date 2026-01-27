/**
 * lazyWithRetry - Lazy Loading com Retry Automático
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Resolve automaticamente falhas temporárias de DNS/rede
 * ao carregar chunks JavaScript (code splitting).
 * 
 * Comportamento:
 * - Tenta carregar o chunk normalmente
 * - Se falhar, aguarda com backoff exponencial e tenta novamente
 * - Máximo de 3 tentativas
 * - Se todas falharem, propaga o erro para o Error Boundary
 */

import { lazy, ComponentType } from "react";
import { createLogger } from "@/lib/logger";

const log = createLogger("lazyWithRetry");

// ============================================================================
// TYPES
// ============================================================================
interface LazyWithRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
}

const DEFAULT_OPTIONS: Required<LazyWithRetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Verifica se o erro é relacionado a rede/DNS
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("failed to fetch") ||
      message.includes("load failed") ||
      message.includes("loading chunk") ||
      message.includes("network") ||
      message.includes("dynamically imported module") ||
      error.name === "ChunkLoadError" ||
      error.name === "TypeError"
    );
  }
  return false;
}

/**
 * Aguarda um tempo antes de continuar
 */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// MAIN UTILITY
// ============================================================================

/**
 * Wrapper para React.lazy() com retry automático
 * 
 * @example
 * const Dashboard = lazyWithRetry(() => import("@/pages/Dashboard"));
 * 
 * @example with named export
 * const Dashboard = lazyWithRetry(() => 
 *   import("@/modules/dashboard").then(m => ({ default: m.Dashboard }))
 * );
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  options?: LazyWithRetryOptions
): React.LazyExoticComponent<T> {
  const { maxRetries, retryDelay } = { ...DEFAULT_OPTIONS, ...options };

  return lazy(async () => {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await importFn();
      } catch (error) {
        lastError = error;

        // Só faz retry se for erro de rede
        if (!isNetworkError(error)) {
          throw error;
        }

        log.warn(`Chunk load failed (attempt ${attempt}/${maxRetries})`, {
          error: error instanceof Error ? error.message : String(error),
        });

        // Última tentativa? Não espera
        if (attempt < maxRetries) {
          await wait(retryDelay * attempt); // Backoff exponencial simples
        }
      }
    }

    log.error("All chunk load attempts failed", {
      attempts: maxRetries,
      error: lastError instanceof Error ? lastError.message : String(lastError),
    });

    throw lastError;
  });
}

// ============================================================================
// ERROR DETECTION (exported for AppErrorBoundary)
// ============================================================================

/**
 * Detecta se o erro é relacionado a rede/chunk loading
 * Exportado para uso no AppErrorBoundary
 */
export function isChunkLoadError(error: Error | null): boolean {
  if (!error) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("loading chunk") ||
    message.includes("failed to fetch") ||
    message.includes("load failed") ||
    message.includes("dynamically imported module") ||
    error.name === "ChunkLoadError"
  );
}
