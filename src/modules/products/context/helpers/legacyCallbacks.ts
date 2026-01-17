/**
 * legacyCallbacks - Factory para callbacks de compatibilidade
 * 
 * Estes callbacks existem apenas para manter compatibilidade
 * com código legado que ainda os referencia. Todos são no-ops
 * pois o Reducer é agora o Single Source of Truth.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Compatibilidade
 */

import type { ProductFormDispatch } from "../../types/productForm.types";
import { formActions } from "../productFormReducer";

export interface LegacyCallbacks {
  markCoreUnsaved: () => void;
  markSettingsSaved: () => void;
  updateGeneralModified: () => void;
  updateSettingsModified: () => void;
  updateUpsellModified: () => void;
  resetDirtySources: () => void;
}

/**
 * Cria callbacks legados para compatibilidade
 * Todos são no-ops exceto markSettingsSaved e resetDirtySources
 * que ainda têm efeito real no Reducer
 */
export function createLegacyCallbacks(formDispatch: ProductFormDispatch): LegacyCallbacks {
  return {
    // No-ops (estado agora gerenciado pelo Reducer)
    markCoreUnsaved: () => {},
    updateGeneralModified: () => {},
    updateSettingsModified: () => {},
    updateUpsellModified: () => {},
    
    // Ainda funcionais (disparam ações no Reducer)
    markSettingsSaved: () => {
      formDispatch(formActions.markSaved());
    },
    resetDirtySources: () => {
      formDispatch(formActions.resetToServer());
    },
  };
}
