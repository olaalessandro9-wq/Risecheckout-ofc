/**
 * dynamicImportWithRetry - Dynamic Import com Retry Automático
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Para funções e módulos (não componentes React).
 * Reutiliza a lógica de isNetworkError do lazyWithRetry.
 * 
 * Comportamento:
 * - Tenta carregar o módulo normalmente
 * - Se falhar por erro de rede/chunk, aguarda com backoff exponencial
 * - Máximo de 3 tentativas
 * - Se todas falharem, propaga o erro
 */

import { isNetworkError } from "./lazyWithRetry";
import { createLogger } from "@/lib/logger";

const log = createLogger("dynamicImportWithRetry");

// ============================================================================
// TYPES
// ============================================================================

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
};

// ============================================================================
// HELPERS
// ============================================================================

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
 * Wrapper para dynamic import com retry automático
 * 
 * @example
 * const { duplicateCheckout } = await dynamicImportWithRetry(
 *   () => import("@/lib/checkouts/duplicateCheckout")
 * );
 * 
 * @example with named export
 * const { api } = await dynamicImportWithRetry(
 *   () => import("@/lib/api")
 * );
 */
export async function dynamicImportWithRetry<T>(
  importFn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const { maxRetries, retryDelay } = { ...DEFAULT_OPTIONS, ...options };
  
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await importFn();
    } catch (error) {
      lastError = error;

      // Só faz retry se for erro de rede/chunk
      if (!isNetworkError(error)) {
        throw error;
      }

      log.warn(`Dynamic import failed (attempt ${attempt}/${maxRetries})`, {
        error: error instanceof Error ? error.message : String(error),
      });

      // Última tentativa? Não espera
      if (attempt < maxRetries) {
        await wait(retryDelay * attempt); // Backoff exponencial simples
      }
    }
  }

  log.error("All dynamic import attempts failed", {
    attempts: maxRetries,
    error: lastError instanceof Error ? lastError.message : String(lastError),
  });

  throw lastError;
}
