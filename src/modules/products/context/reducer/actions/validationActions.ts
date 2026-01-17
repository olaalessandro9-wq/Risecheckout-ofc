/**
 * Validation Actions - Ações para gerenciamento de erros de validação
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import type { ProductFormState } from "../../../types/productForm.types";
import { INITIAL_VALIDATION } from "../initialState";

// ============================================================================
// SET VALIDATION ERROR
// ============================================================================

export function handleSetValidationError(
  state: ProductFormState,
  payload: {
    section: "general" | "upsell" | "affiliate";
    field: string;
    error: string | undefined;
  }
): ProductFormState {
  const { section, field, error } = payload;
  
  return {
    ...state,
    validation: {
      ...state.validation,
      [section]: {
        ...state.validation[section],
        [field]: error,
      },
    },
  };
}

// ============================================================================
// CLEAR VALIDATION ERRORS
// ============================================================================

export function handleClearValidationErrors(state: ProductFormState): ProductFormState {
  return {
    ...state,
    validation: INITIAL_VALIDATION,
  };
}
