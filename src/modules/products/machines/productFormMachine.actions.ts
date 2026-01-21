/**
 * ProductFormMachine Actions - Barrel Export
 * 
 * Re-exporta todas as actions de forma organizada.
 * Cada categoria está em seu próprio arquivo para respeitar o limite de 300 linhas.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 * @module products/machines
 */

// Lifecycle: Load, Save, Error, Reset
export {
  assignServerData,
  assignLoadError,
  assignProductId,
  markSaved,
  assignSaveError,
  clearSaveError,
  resetToServer,
} from "./actions/lifecycleActions";

// Edit: Field updates
export {
  assignEditGeneral,
  assignEditImage,
  assignEditOffers,
  assignAddDeletedOffer,
  assignEditUpsell,
  assignEditAffiliate,
  assignEditCheckoutSettings,
  assignInitCheckoutSettings,
} from "./actions/editActions";

// Validation: Error handling
export {
  assignValidationError,
  clearValidationErrors,
} from "./actions/validationActions";

// Tab: Navigation
export {
  assignActiveTab,
  assignTabErrors,
  clearTabErrors,
} from "./actions/tabActions";
