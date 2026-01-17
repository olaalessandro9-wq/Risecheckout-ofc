/**
 * Product Form State Machine - Module Index
 * 
 * Re-exporta todos os elementos da máquina de estados XState.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Nota 10/10
 */

// Machine
export { productFormMachine } from "./productFormMachine";
export type { ProductFormMachine } from "./productFormMachine";

// Hook
export { useProductFormMachine } from "./useProductFormMachine";
export type { UseProductFormMachineReturn } from "./useProductFormMachine";

// Types
export type {
  ProductFormContext,
  ProductFormEvent,
  ProductFormMachineState,
  ProductFormStateValue,
  StartLoadingEvent,
  DataLoadedEvent,
  LoadErrorEvent,
  UpdateGeneralEvent,
  UpdateImageEvent,
  UpdateOffersEvent,
  UpdateUpsellEvent,
  UpdateAffiliateEvent,
  UpdateCheckoutSettingsEvent,
  InitCheckoutSettingsEvent,
  SetValidationErrorEvent,
  RequestSaveEvent,
  SaveSuccessEvent,
  SaveErrorEvent,
  DiscardChangesEvent,
} from "./productFormMachine.types";

// Helpers
export {
  createInitialContext,
  calculateDirtyFlags,
  anyDirty,
  deriveGeneralFromProduct,
  INITIAL_IMAGE_STATE,
  INITIAL_OFFERS_STATE,
  INITIAL_VALIDATION,
  INITIAL_UPSELL,
  INITIAL_CHECKOUT_SETTINGS,
} from "./productFormMachine.helpers";
