/**
 * Validation Actions - Ações para gerenciamento de erros de validação
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import type { ProductFormState, FormValidationErrors } from "../../../types/productForm.types";
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
// SET BULK VALIDATION ERRORS
// ============================================================================

export function handleSetBulkValidationErrors(
  state: ProductFormState,
  payload: Partial<FormValidationErrors>
): ProductFormState {
  return {
    ...state,
    validation: {
      general: {
        ...state.validation.general,
        ...(payload.general || {}),
      },
      upsell: {
        ...state.validation.upsell,
        ...(payload.upsell || {}),
      },
      affiliate: {
        ...state.validation.affiliate,
        ...(payload.affiliate || {}),
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
