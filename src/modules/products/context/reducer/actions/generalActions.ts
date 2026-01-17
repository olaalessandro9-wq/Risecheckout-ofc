/**
 * General Actions - Ações para o formulário geral
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import type { ProductFormState, GeneralFormData } from "../../../types/productForm.types";
import { calculateDirtyFlags, anyDirty } from "../helpers";

// ============================================================================
// UPDATE GENERAL
// ============================================================================

export function handleUpdateGeneral(
  state: ProductFormState,
  payload: Partial<GeneralFormData>
): ProductFormState {
  const newGeneral = { ...state.editedData.general, ...payload };
  const newEditedData = { ...state.editedData, general: newGeneral };
  const newDirtyFlags = calculateDirtyFlags(newEditedData, state.serverData);
  
  return {
    ...state,
    editedData: newEditedData,
    dirtyFlags: newDirtyFlags,
    isDirty: anyDirty(newDirtyFlags),
  };
}
