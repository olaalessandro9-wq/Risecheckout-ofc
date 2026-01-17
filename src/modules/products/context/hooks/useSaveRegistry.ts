/**
 * useSaveRegistry - Registry Pattern para Save Handlers
 * 
 * Implementa Open/Closed Principle:
 * - Cada aba registra seu próprio handler de salvamento
 * - saveAll itera sobre todos os handlers registrados
 * - Adicionar nova aba = registrar handler (zero mudança no core)
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solução C (Nota 10/10)
 */

import { useRef, useCallback } from "react";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Função que executa o salvamento
 */
export type SaveHandler = () => Promise<void>;

/**
 * Função que valida antes do salvamento
 * Retorna true se válido, false se inválido
 */
export type ValidationHandler = () => boolean;

/**
 * Entrada no registry
 */
export interface SaveRegistryEntry {
  /** Nome identificador (para logs/debug) */
  key: string;
  /** Função de salvamento */
  save: SaveHandler;
  /** Função de validação (opcional) */
  validate?: ValidationHandler;
  /** Ordem de execução (menor = primeiro) */
  order: number;
}

/**
 * Opções ao registrar um handler
 */
export interface RegisterOptions {
  /** Função de validação (opcional) */
  validate?: ValidationHandler;
  /** Ordem de execução (default: 50) */
  order?: number;
}

/**
 * Resultado do saveAll
 */
export interface SaveAllResult {
  success: boolean;
  failedKey?: string;
  error?: Error;
}

// ============================================================================
// HOOK
// ============================================================================

export function useSaveRegistry() {
  // useRef para evitar re-renders quando handlers mudam
  const registryRef = useRef<Map<string, SaveRegistryEntry>>(new Map());

  /**
   * Registra um save handler
   * Retorna função de cleanup para useEffect
   */
  const registerSaveHandler = useCallback((
    key: string,
    save: SaveHandler,
    options?: RegisterOptions
  ): (() => void) => {
    const entry: SaveRegistryEntry = {
      key,
      save,
      validate: options?.validate,
      order: options?.order ?? 50,
    };

    registryRef.current.set(key, entry);
    console.log(`[SaveRegistry] Registered handler: ${key} (order: ${entry.order})`);

    // Retorna cleanup function
    return () => {
      registryRef.current.delete(key);
      console.log(`[SaveRegistry] Unregistered handler: ${key}`);
    };
  }, []);

  /**
   * Remove um handler manualmente
   */
  const unregisterSaveHandler = useCallback((key: string): void => {
    const existed = registryRef.current.delete(key);
    if (existed) {
      console.log(`[SaveRegistry] Manually unregistered: ${key}`);
    }
  }, []);

  /**
   * Verifica se há handlers com alterações pendentes
   * (Opcional: para integração futura com hasChanges)
   */
  const hasRegisteredHandlers = useCallback((): boolean => {
    return registryRef.current.size > 0;
  }, []);

  /**
   * Retorna a lista de handlers registrados (para debug)
   */
  const getRegisteredHandlers = useCallback((): string[] => {
    return Array.from(registryRef.current.keys());
  }, []);

  /**
   * Executa todos os handlers registrados
   * 
   * Fluxo:
   * 1. Ordena por prioridade (order)
   * 2. Valida todos primeiro
   * 3. Se todas validações passarem, executa saves em paralelo
   */
  const executeAll = useCallback(async (): Promise<SaveAllResult> => {
    const entries = Array.from(registryRef.current.entries())
      .map(([, entry]) => entry)
      .sort((a, b) => a.order - b.order);

    if (entries.length === 0) {
      console.log("[SaveRegistry] No handlers registered, nothing to save");
      return { success: true };
    }

    console.log(`[SaveRegistry] Executing ${entries.length} handlers:`, 
      entries.map(e => `${e.key}(${e.order})`).join(", "));

    // Fase 1: Validação
    for (const entry of entries) {
      if (entry.validate) {
        const isValid = entry.validate();
        if (!isValid) {
          console.warn(`[SaveRegistry] Validation failed for: ${entry.key}`);
          return {
            success: false,
            failedKey: entry.key,
            error: new Error(`Validation failed for ${entry.key}`),
          };
        }
      }
    }

    console.log("[SaveRegistry] All validations passed, executing saves...");

    // Fase 2: Execução em paralelo
    try {
      await Promise.all(entries.map(entry => entry.save()));
      console.log("[SaveRegistry] All handlers executed successfully");
      return { success: true };
    } catch (error) {
      console.error("[SaveRegistry] Error during save:", error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }, []);

  return {
    registerSaveHandler,
    unregisterSaveHandler,
    executeAll,
    hasRegisteredHandlers,
    getRegisteredHandlers,
  };
}

// ============================================================================
// EXPORT TYPE FOR CONTEXT
// ============================================================================

export type SaveRegistryHook = ReturnType<typeof useSaveRegistry>;
