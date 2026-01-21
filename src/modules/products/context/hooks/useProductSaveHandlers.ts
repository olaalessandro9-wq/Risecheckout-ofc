/**
 * useProductSaveHandlers - Save and Refresh Logic
 * 
 * Centraliza toda a lógica de salvamento e refresh.
 * Extraído do ProductContext para manter abaixo de 300 linhas.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 * @module products/context/hooks
 */

import { useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import type { ProductFormEvent } from "../../machines";
import type { TabValidationMap } from "../../types/tabValidation.types";

// ============================================================================
// TAB KEY MAPPING
// ============================================================================

/**
 * Mapeia tabKey para section de validationErrors
 * tabKey usa português (geral, configuracoes, upsell, afiliados)
 * section usa inglês (general, checkoutSettings, upsell, affiliate)
 */
export function tabKeyToSection(tabKey: string): string {
  const mapping: Record<string, string> = {
    geral: "general",
    configuracoes: "checkoutSettings",
    upsell: "upsell",
    afiliados: "affiliate",
  };
  return mapping[tabKey] ?? tabKey;
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

interface UseProductSaveHandlersProps {
  send: (event: ProductFormEvent) => void;
  executeRegistrySaves: () => Promise<{
    success: boolean;
    error?: Error;
    tabErrors?: TabValidationMap;
    firstFailedTabKey?: string;
  }>;
}

interface UseProductSaveHandlersReturn {
  saveAll: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useProductSaveHandlers({ 
  send, 
  executeRegistrySaves 
}: UseProductSaveHandlersProps): UseProductSaveHandlersReturn {
  
  const saveAll = useCallback(async () => {
    // 1. Transiciona para estado "saving" - ativa o spinner
    send({ type: "SAVE_ALL" });
    
    // 2. Limpa erros de validação anteriores
    send({ type: "CLEAR_VALIDATION_ERRORS" });
    
    // 3. Execute registry saves
    const result = await executeRegistrySaves();
    
    // 4. Check for errors
    if (!result.success) {
      // Dispara SAVE_ERROR para voltar ao estado dirty
      send({ type: "SAVE_ERROR", error: result.error?.message ?? "Erro de validação" });
      
      // Set tab errors from registry result (para toast/navegação)
      if (result.tabErrors) {
        send({ type: "SET_TAB_ERRORS", errors: result.tabErrors });
        
        // Propagar erros para validationErrors (para campos ficarem vermelhos)
        Object.entries(result.tabErrors).forEach(([tabKey, tabState]) => {
          if (tabState.errors) {
            const section = tabKeyToSection(tabKey);
            Object.entries(tabState.errors).forEach(([field, error]) => {
              if (error) {
                send({ 
                  type: "SET_VALIDATION_ERROR", 
                  section,
                  field,
                  error,
                });
              }
            });
          }
        });
      }
      
      // Navigate to first failed tab if available
      if (result.firstFailedTabKey) {
        send({ type: "SET_TAB", tab: result.firstFailedTabKey });
      }
      
      // Toast de erro
      toast({
        title: "Erro ao salvar",
        description: "Verifique os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    // 5. Trigger machine save success
    send({ type: "SAVE_SUCCESS" });
    
    // 6. Toast de sucesso
    toast({
      title: "Produto salvo",
      description: "Todas as alterações foram salvas com sucesso!",
    });
  }, [send, executeRegistrySaves]);
  
  const refreshAll = useCallback(async (): Promise<void> => {
    send({ type: "REFRESH" });
    return Promise.resolve();
  }, [send]);
  
  return {
    saveAll,
    refreshAll,
  };
}
