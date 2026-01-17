/**
 * createSaveAll - Factory para função saveAll
 * 
 * Extrai a lógica do saveAll do ProductContext para manter < 300 linhas.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Regra de 300 linhas
 */

import { toast } from "sonner";
import type { ProductFormDispatch } from "../../types/productForm.types";
import type { TabValidationMap } from "../../types/tabValidation.types";
import { formActions } from "../productFormReducer";

// ============================================================================
// TYPES
// ============================================================================

interface SaveAllDependencies {
  /** Setter para estado de salvamento */
  setSaving: (saving: boolean) => void;
  /** Limpa erros de abas */
  clearTabErrors: () => void;
  /** Dispatch do reducer de formulário */
  formDispatch: ProductFormDispatch;
  /** Executa todos os handlers registrados no Save Registry */
  executeRegistrySaves: () => Promise<{
    success: boolean;
    tabErrors?: TabValidationMap;
    firstFailedTabKey?: string;
  }>;
  /** Setter para erros de abas */
  setTabErrors: (errors: TabValidationMap) => void;
  /** Setter para aba ativa */
  setActiveTab: (tab: string) => void;
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Cria a função saveAll que:
 * 1. Limpa erros anteriores
 * 2. Executa todos os handlers de save registrados
 * 3. Propaga erros para o reducer (campos ficarem vermelhos)
 * 4. Navega para primeira aba com erro
 * 5. Exibe toast de sucesso/erro
 */
export function createSaveAll(deps: SaveAllDependencies): () => Promise<void> {
  const {
    setSaving,
    clearTabErrors,
    formDispatch,
    executeRegistrySaves,
    setTabErrors,
    setActiveTab,
  } = deps;

  return async () => {
    setSaving(true);
    
    // Limpa erros anteriores
    clearTabErrors();
    formDispatch({ type: 'CLEAR_VALIDATION_ERRORS' });
    
    try {
      const result = await executeRegistrySaves();
      
      if (!result.success) {
        // Popula erros de validação por aba (para indicadores de tab)
        if (result.tabErrors) {
          setTabErrors(result.tabErrors);
          
          // Propagar erros para o reducer (para campos ficarem vermelhos)
          // Mapeia os erros de cada tab para a seção correspondente no FormValidationErrors
          const tabToSection: Record<string, 'general' | 'upsell' | 'affiliate' | 'checkoutSettings'> = {
            'geral': 'general',
            'configuracoes': 'checkoutSettings',
            'upsell': 'upsell',
            'afiliados': 'affiliate',
          };
          
          Object.entries(result.tabErrors).forEach(([tabKey, tabState]) => {
            const section = tabToSection[tabKey];
            if (section && tabState.errors) {
              Object.entries(tabState.errors).forEach(([field, error]) => {
                if (error) {
                  formDispatch({
                    type: 'SET_VALIDATION_ERROR',
                    payload: { section, field, error }
                  });
                }
              });
            }
          });
        }
        
        // Navega para primeira aba com erro
        if (result.firstFailedTabKey) {
          setActiveTab(result.firstFailedTabKey);
        }
        
        toast.error("Corrija os campos obrigatórios antes de salvar");
        return;
      }

      formDispatch(formActions.markSaved());
      toast.success("Todas as alterações foram salvas!");
    } catch (error) {
      console.error("[ProductContext] Error saving all:", error);
      toast.error("Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  };
}
