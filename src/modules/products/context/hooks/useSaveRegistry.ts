/**
 * useSaveRegistry - Registry Pattern para Save Handlers (Estendido)
 * 
 * @version 3.0.0 - RISE Protocol V3 - Zero console.log
 * 
 * Implementa Open/Closed Principle:
 * - Cada aba registra seu próprio handler de salvamento
 * - saveAll itera sobre todos os handlers registrados
 * - Adicionar nova aba = registrar handler (zero mudança no core)
 * 
 * Estendido para suportar:
 * - Validação com erros por campo
 * - Identificação de aba (tabKey) para navegação automática
 * - Retorno detalhado de erros por aba
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Sistema de Validação Global
 */

import { useRef, useCallback } from "react";
import { createLogger } from "@/lib/logger";
import type { 
  SaveHandler, 
  ValidationHandler,
  RegisterSaveHandlerOptions,
  SaveRegistryEntry,
  SaveAllResult,
} from "../../types/saveRegistry.types";
import type { 
  TabValidationMap,
  TabValidationState,
  ValidationResultExtended,
} from "../../types/tabValidation.types";
import { TAB_ORDER } from "../../types/tabValidation.types";

const log = createLogger("SaveRegistry");

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
    options?: RegisterSaveHandlerOptions
  ): (() => void) => {
    const entry: SaveRegistryEntry = {
      key,
      save,
      validate: options?.validate,
      order: options?.order ?? 50,
      tabKey: options?.tabKey,
    };

    registryRef.current.set(key, entry);
    log.trace(`Registered handler: ${key} (order: ${entry.order}, tab: ${entry.tabKey || 'N/A'})`);

    // Retorna cleanup function
    return () => {
      registryRef.current.delete(key);
      log.trace(`Unregistered handler: ${key}`);
    };
  }, []);

  /**
   * Remove um handler manualmente
   */
  const unregisterSaveHandler = useCallback((key: string): void => {
    const existed = registryRef.current.delete(key);
    if (existed) {
      log.trace(`Manually unregistered: ${key}`);
    }
  }, []);

  /**
   * Verifica se há handlers com alterações pendentes
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
   * Normaliza resultado de validação para formato estendido
   */
  const normalizeValidationResult = (
    result: ValidationResultExtended | boolean,
    tabKey?: string
  ): ValidationResultExtended => {
    if (typeof result === "boolean") {
      return {
        isValid: result,
        errors: {},
        tabKey,
      };
    }
    return {
      ...result,
      tabKey: result.tabKey || tabKey,
    };
  };

  /**
   * Executa todos os handlers registrados
   * 
   * Fluxo:
   * 1. Ordena por prioridade (order)
   * 2. Valida todos primeiro, coletando TODOS os erros
   * 3. Se houver erro, retorna com detalhes de abas
   * 4. Se todas validações passarem, executa saves em paralelo
   */
  const executeAll = useCallback(async (): Promise<SaveAllResult> => {
    const entries = Array.from(registryRef.current.entries())
      .map(([, entry]) => entry)
      .sort((a, b) => a.order - b.order);

    if (entries.length === 0) {
      log.trace("No handlers registered, nothing to save");
      return { success: true };
    }

    log.trace(`Executing ${entries.length} handlers:`, 
      entries.map(e => `${e.key}(${e.order})`).join(", "));

    // Fase 1: Validação - coleta TODOS os erros
    const tabErrors: TabValidationMap = {};
    let hasAnyError = false;
    let firstFailedTabKey: string | undefined;

    for (const entry of entries) {
      if (entry.validate) {
        const rawResult = entry.validate();
        const result = normalizeValidationResult(rawResult, entry.tabKey);
        
        if (!result.isValid) {
          hasAnyError = true;
          log.warn(`Validation failed for: ${entry.key} (tab: ${entry.tabKey})`);
          
          // Registra erros para esta tab
          if (entry.tabKey) {
            const existingState = tabErrors[entry.tabKey];
            const newErrors = { ...existingState?.errors, ...result.errors };
            const newFields = Object.keys(newErrors);
            
            tabErrors[entry.tabKey] = {
              hasError: true,
              fields: newFields,
              errors: newErrors,
            };

            // Determina primeira tab com erro seguindo ordem da UI
            if (!firstFailedTabKey) {
              firstFailedTabKey = entry.tabKey;
            } else {
              // Compara ordem para pegar a mais à esquerda
              const currentIndex = TAB_ORDER.indexOf(entry.tabKey);
              const firstIndex = TAB_ORDER.indexOf(firstFailedTabKey);
              if (currentIndex !== -1 && (firstIndex === -1 || currentIndex < firstIndex)) {
                firstFailedTabKey = entry.tabKey;
              }
            }
          }
        }
      }
    }

    // Se houver erros, retorna sem executar saves
    if (hasAnyError) {
      log.warn(`Validation failed. First failed tab: ${firstFailedTabKey}`);
      log.warn("Tab errors:", tabErrors);
      
      return {
        success: false,
        firstFailedTabKey,
        tabErrors,
        error: new Error("Validação falhou em um ou mais campos"),
      };
    }

    log.trace("All validations passed, executing saves...");

    // Fase 2: Execução em paralelo
    try {
      await Promise.all(entries.map(entry => entry.save()));
      log.debug("All handlers executed successfully");
      return { success: true };
    } catch (error) {
      log.error("Error during save:", error);
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
