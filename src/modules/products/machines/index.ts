/**
 * Product Machines Module
 * 
 * Re-exporta todos os componentes da State Machine.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solução 10.0/10
 * @module products/machines
 */

// State Machine principal
export { productFormMachine, initialContext } from "./productFormMachine";
export type { ProductFormMachine } from "./productFormMachine";

// Types
export type {
  // Context e Events
  ProductFormContext,
  ProductFormEvent,
  
  // Form Data Types
  GeneralFormData,
  ImageFormState,
  OffersFormState,
  CheckoutSettingsFormData,
  GatewayCredentials,
  GatewayCredentialStatus,
  
  // Settings Types
  UpsellSettings,
  AffiliateSettings,
  
  // Entity Types
  MachineOffer,
  MachineOrderBump,
  MachineCheckout,
  MachineCoupon,
  MachinePaymentLink,
  MachineProduct,
  
  // Data Types
  ServerDataSnapshot,
  EditedFormData,
  ProductEntities,
  MappedProductData,
  
  // Validation Types
  ValidationErrors,
  
  // Actor Input Types
  LoadProductInput,
  SaveAllInput,
  SaveHandlerRegistry,
  
  // Computed Types
  ComputedValues,
  
  // Event Types (individual)
  LoadDataEvent,
  ReceiveDataEvent,
  LoadErrorEvent,
  EditGeneralEvent,
  EditImageEvent,
  EditOffersEvent,
  AddDeletedOfferEvent,
  EditUpsellEvent,
  EditAffiliateEvent,
  EditCheckoutSettingsEvent,
  InitCheckoutSettingsEvent,
  SaveAllEvent,
  SaveSuccessEvent,
  SaveErrorEvent,
  DiscardChangesEvent,
  RefreshEvent,
  SetTabEvent,
  SetTabErrorsEvent,
  ClearTabErrorsEvent,
} from "./productFormMachine.types";

// Guards
export {
  isDirty,
  isValid,
  canSave,
  hasProduct,
  isPristine,
  calculateDirtyFlags,
  isCheckoutSettingsInitialized,
} from "./productFormMachine.guards";

// Actions (for external use if needed)
export {
  assignServerData,
  assignLoadError,
  assignProductId,
  assignEditGeneral,
  assignEditImage,
  assignEditOffers,
  assignAddDeletedOffer,
  assignEditUpsell,
  assignEditAffiliate,
  assignEditCheckoutSettings,
  assignInitCheckoutSettings,
  markSaved,
  assignSaveError,
  clearSaveError,
  resetToServer,
  assignValidationError,
  clearValidationErrors,
  assignActiveTab,
  assignTabErrors,
  clearTabErrors,
} from "./productFormMachine.actions";

// Actors
export {
  loadProductActor,
  saveAllActor,
} from "./productFormMachine.actors";
