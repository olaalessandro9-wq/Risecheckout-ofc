/**
 * Image Actions - Ações para gerenciamento de imagem
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import type { ProductFormState, ImageFormState } from "../../../types/productForm.types";
import { calculateDirtyFlags, anyDirty } from "../helpers";
import { INITIAL_IMAGE_STATE } from "../initialState";

// ============================================================================
// UPDATE IMAGE
// ============================================================================

export function handleUpdateImage(
  state: ProductFormState,
  payload: Partial<ImageFormState>
): ProductFormState {
  const newImage = { ...state.editedData.image, ...payload };
  const newEditedData = { ...state.editedData, image: newImage };
  const newDirtyFlags = calculateDirtyFlags(newEditedData, state.serverData);
  
  return {
    ...state,
    editedData: newEditedData,
    dirtyFlags: newDirtyFlags,
    isDirty: anyDirty(newDirtyFlags),
  };
}

// ============================================================================
// RESET IMAGE
// ============================================================================

export function handleResetImage(state: ProductFormState): ProductFormState {
  const newEditedData = {
    ...state.editedData,
    image: INITIAL_IMAGE_STATE,
  };
  const newDirtyFlags = calculateDirtyFlags(newEditedData, state.serverData);
  
  return {
    ...state,
    editedData: newEditedData,
    dirtyFlags: newDirtyFlags,
    isDirty: anyDirty(newDirtyFlags),
  };
}
