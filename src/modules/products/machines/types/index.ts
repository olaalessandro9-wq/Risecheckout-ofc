/**
 * Types Barrel Export
 * 
 * Re-exporta todos os tipos da State Machine de forma modular.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 * @module products/machines/types
 */

// Context
export type { ProductFormContext } from "./context.types";

// Entities
export type {
  MachineProduct,
  MachineOffer,
  MachineOrderBump,
  MachineCheckout,
  MachineCoupon,
  MachinePaymentLink,
  ProductEntities,
  MappedProductData,
  ValidationErrors,
  ComputedValues,
} from "./entities.types";

// Events
export type {
  ProductFormEvent,
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
  SetValidationErrorEvent,
  ClearValidationErrorsEvent,
  SaveAllEvent,
  SaveSuccessEvent,
  SaveErrorEvent,
  DiscardChangesEvent,
  RefreshEvent,
  SetTabEvent,
  SetTabErrorsEvent,
  ClearTabErrorsEvent,
  UpdateServerImageUrlEvent,
} from "./events.types";

// Actors
export type {
  LoadProductInput,
  SaveAllInput,
  SaveHandlerRegistry,
} from "./actors.types";
