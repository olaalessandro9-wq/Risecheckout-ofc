/**
 * Event Types - State Machine Events
 * 
 * Define todas as interfaces de eventos da State Machine.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 * @module products/machines/types
 */

import type {
  GeneralFormData,
  ImageFormState,
  OffersFormState,
  CheckoutSettingsFormData,
  GatewayCredentials,
} from "../../types/formData.types";
import type { UpsellSettings, AffiliateSettings } from "../../types/product.types";
import type { TabValidationMap } from "../../types/tabValidation.types";
import type { MappedProductData } from "./entities.types";

// ============================================================================
// LIFECYCLE EVENTS
// ============================================================================

export interface LoadDataEvent {
  type: "LOAD_DATA";
  productId: string;
  userId?: string;
}

export interface ReceiveDataEvent {
  type: "RECEIVE_DATA";
  data: MappedProductData;
}

export interface LoadErrorEvent {
  type: "LOAD_ERROR";
  error: string;
}

// ============================================================================
// EDIT EVENTS
// ============================================================================

export interface EditGeneralEvent {
  type: "EDIT_GENERAL";
  payload: Partial<GeneralFormData>;
}

export interface EditImageEvent {
  type: "EDIT_IMAGE";
  payload: Partial<ImageFormState>;
}

export interface EditOffersEvent {
  type: "EDIT_OFFERS";
  payload: Partial<OffersFormState>;
}

export interface AddDeletedOfferEvent {
  type: "ADD_DELETED_OFFER";
  offerId: string;
}

export interface EditUpsellEvent {
  type: "EDIT_UPSELL";
  payload: Partial<UpsellSettings>;
}

export interface EditAffiliateEvent {
  type: "EDIT_AFFILIATE";
  payload: Partial<AffiliateSettings>;
}

export interface EditCheckoutSettingsEvent {
  type: "EDIT_CHECKOUT_SETTINGS";
  payload: Partial<CheckoutSettingsFormData>;
}

export interface InitCheckoutSettingsEvent {
  type: "INIT_CHECKOUT_SETTINGS";
  settings: CheckoutSettingsFormData;
  credentials: GatewayCredentials;
}

// ============================================================================
// VALIDATION EVENTS
// ============================================================================

export interface SetValidationErrorEvent {
  type: "SET_VALIDATION_ERROR";
  section: string;
  field: string;
  error: string | undefined;
}

export interface ClearValidationErrorsEvent {
  type: "CLEAR_VALIDATION_ERRORS";
}

// ============================================================================
// ACTION EVENTS
// ============================================================================

export interface SaveAllEvent {
  type: "SAVE_ALL";
}

export interface SaveSuccessEvent {
  type: "SAVE_SUCCESS";
}

export interface SaveErrorEvent {
  type: "SAVE_ERROR";
  error: string;
}

export interface DiscardChangesEvent {
  type: "DISCARD_CHANGES";
}

export interface RefreshEvent {
  type: "REFRESH";
}

export interface UpdateServerImageUrlEvent {
  type: "UPDATE_SERVER_IMAGE_URL";
  imageUrl: string | null;
}

// ============================================================================
// TAB EVENTS
// ============================================================================

export interface SetTabEvent {
  type: "SET_TAB";
  tab: string;
}

export interface SetTabErrorsEvent {
  type: "SET_TAB_ERRORS";
  errors: TabValidationMap;
}

export interface ClearTabErrorsEvent {
  type: "CLEAR_TAB_ERRORS";
}

// ============================================================================
// UNION TYPE
// ============================================================================

export type ProductFormEvent =
  | LoadDataEvent
  | ReceiveDataEvent
  | LoadErrorEvent
  | EditGeneralEvent
  | EditImageEvent
  | EditOffersEvent
  | AddDeletedOfferEvent
  | EditUpsellEvent
  | EditAffiliateEvent
  | EditCheckoutSettingsEvent
  | InitCheckoutSettingsEvent
  | SetValidationErrorEvent
  | ClearValidationErrorsEvent
  | SaveAllEvent
  | SaveSuccessEvent
  | SaveErrorEvent
  | DiscardChangesEvent
  | RefreshEvent
  | SetTabEvent
  | SetTabErrorsEvent
  | ClearTabErrorsEvent
  | UpdateServerImageUrlEvent;
