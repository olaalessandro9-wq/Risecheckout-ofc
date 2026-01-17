/**
 * Action Creators - Funções helper para criar actions tipadas
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import type {
  GeneralFormData,
  ImageFormState,
  ServerDataSnapshot,
  CheckoutSettingsFormData,
  GatewayCredentials,
  FormValidationErrors,
} from "../../types/productForm.types";
import type { ProductData, UpsellSettings, AffiliateSettings, Offer } from "../../types/product.types";

// ============================================================================
// ACTION CREATORS
// ============================================================================

export const formActions = {
  initFromServer: (payload: {
    product: ProductData | null;
    upsellSettings: UpsellSettings;
    affiliateSettings: AffiliateSettings | null;
    offers: Offer[];
  }) => ({ type: "INIT_FROM_SERVER" as const, payload }),
  
  updateGeneral: (payload: Partial<GeneralFormData>) => ({
    type: "UPDATE_GENERAL" as const,
    payload,
  }),
  
  updateImage: (payload: Partial<ImageFormState>) => ({
    type: "UPDATE_IMAGE" as const,
    payload,
  }),
  
  updateOffers: (payload: {
    localOffers?: Offer[];
    deletedOfferIds?: string[];
    modified?: boolean;
  }) => ({ type: "UPDATE_OFFERS" as const, payload }),
  
  addDeletedOffer: (offerId: string) => ({
    type: "ADD_DELETED_OFFER" as const,
    payload: offerId,
  }),
  
  updateUpsell: (payload: Partial<UpsellSettings>) => ({
    type: "UPDATE_UPSELL" as const,
    payload,
  }),
  
  updateAffiliate: (payload: Partial<AffiliateSettings>) => ({
    type: "UPDATE_AFFILIATE" as const,
    payload,
  }),
  
  updateCheckoutSettings: (payload: Partial<CheckoutSettingsFormData>) => ({
    type: "UPDATE_CHECKOUT_SETTINGS" as const,
    payload,
  }),
  
  initCheckoutSettings: (payload: { settings: CheckoutSettingsFormData; credentials: GatewayCredentials }) => ({
    type: "INIT_CHECKOUT_SETTINGS" as const,
    payload,
  }),
  
  markCheckoutSettingsSaved: (payload: { settings: CheckoutSettingsFormData }) => ({
    type: "MARK_CHECKOUT_SETTINGS_SAVED" as const,
    payload,
  }),
  
  resetToServer: () => ({ type: "RESET_TO_SERVER" as const }),
  
  markSaved: (payload?: { newServerData?: Partial<ServerDataSnapshot> }) => ({
    type: "MARK_SAVED" as const,
    payload,
  }),
  
  setValidationError: (
    section: "general" | "upsell" | "affiliate",
    field: string,
    error: string | undefined
  ) => ({
    type: "SET_VALIDATION_ERROR" as const,
    payload: { section, field, error },
  }),
  
  setBulkValidationErrors: (payload: Partial<FormValidationErrors>) => ({
    type: "SET_BULK_VALIDATION_ERRORS" as const,
    payload,
  }),
  
  clearValidationErrors: () => ({ type: "CLEAR_VALIDATION_ERRORS" as const }),
  
  resetImage: () => ({ type: "RESET_IMAGE" as const }),
  
  resetOffers: () => ({ type: "RESET_OFFERS" as const }),
  
  markUserInteraction: () => ({ type: "MARK_USER_INTERACTION" as const }),
};
