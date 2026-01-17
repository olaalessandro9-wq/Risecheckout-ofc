/**
 * Upsell Actions - Ações para configurações de upsell
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import type { ProductFormState } from "../../../types/productForm.types";
import type { UpsellSettings } from "../../../types/product.types";
import { calculateDirtyFlags, anyDirty } from "../helpers";

// ============================================================================
// UPDATE UPSELL
// ============================================================================

export function handleUpdateUpsell(
  state: ProductFormState,
  payload: Partial<UpsellSettings>
): ProductFormState {
  const newUpsell = { ...state.editedData.upsell, ...payload };
  const newEditedData = { ...state.editedData, upsell: newUpsell };
  const newDirtyFlags = calculateDirtyFlags(newEditedData, state.serverData);
  
  return {
    ...state,
    editedData: newEditedData,
    dirtyFlags: newDirtyFlags,
    isDirty: anyDirty(newDirtyFlags),
  };
}
