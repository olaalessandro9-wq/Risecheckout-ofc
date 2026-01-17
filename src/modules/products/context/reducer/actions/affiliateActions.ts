/**
 * Affiliate Actions - Ações para configurações de afiliados
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import type { ProductFormState } from "../../../types/productForm.types";
import type { AffiliateSettings } from "../../../types/product.types";
import { calculateDirtyFlags, anyDirty } from "../helpers";

// ============================================================================
// UPDATE AFFILIATE
// ============================================================================

export function handleUpdateAffiliate(
  state: ProductFormState,
  payload: Partial<AffiliateSettings>
): ProductFormState {
  const currentAffiliate = state.editedData.affiliate;
  const newAffiliate = currentAffiliate
    ? { ...currentAffiliate, ...payload }
    : (payload as AffiliateSettings);
  const newEditedData = { ...state.editedData, affiliate: newAffiliate };
  const newDirtyFlags = calculateDirtyFlags(newEditedData, state.serverData);
  
  return {
    ...state,
    editedData: newEditedData,
    dirtyFlags: newDirtyFlags,
    isDirty: anyDirty(newDirtyFlags),
  };
}
