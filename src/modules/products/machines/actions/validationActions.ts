/**
 * Validation Actions
 * 
 * Actions relacionadas à validação de formulários.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Single Responsibility
 * @module products/machines/actions
 */

import { assign } from "xstate";
import type { ValidationErrors } from "../productFormMachine.types";

// ============================================================================
// VALIDATION ACTIONS
// ============================================================================

/**
 * Define erro de validação em campo específico
 */
export const assignValidationError = assign({
  validationErrors: ({ context, event }) => {
    if (event.type !== "SET_VALIDATION_ERROR") return context.validationErrors;
    const { section, field, error } = event;
    return {
      ...context.validationErrors,
      [section]: {
        ...context.validationErrors[section],
        [field]: error,
      },
    };
  },
});

/**
 * Limpa todos os erros de validação
 */
export const clearValidationErrors = assign({
  validationErrors: (): ValidationErrors => ({
    general: {},
    upsell: {},
    affiliate: {},
    checkoutSettings: {},
  }),
});
