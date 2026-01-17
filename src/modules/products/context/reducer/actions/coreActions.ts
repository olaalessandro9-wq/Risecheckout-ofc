/**
 * Core Actions - Init, Reset, Mark Saved
 * 
 * Ações principais de ciclo de vida do reducer.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import type {
  ProductFormState,
  ServerDataSnapshot,
  EditedFormData,
  OffersFormState,
} from "../../../types/productForm.types";
import type { ProductData, UpsellSettings, AffiliateSettings, Offer } from "../../../types/product.types";

import { INITIAL_IMAGE_STATE, INITIAL_VALIDATION } from "../initialState";
import { deriveGeneralFromProduct, calculateDirtyFlags, anyDirty } from "../helpers";

// ============================================================================
// INIT FROM SERVER
// ============================================================================

export function handleInitFromServer(
  state: ProductFormState,
  payload: {
    product: ProductData | null;
    upsellSettings: UpsellSettings;
    affiliateSettings: AffiliateSettings | null;
    offers: Offer[];
  }
): ProductFormState {
  const { product, upsellSettings, affiliateSettings, offers } = payload;
  
  const generalFromProduct = deriveGeneralFromProduct(product);
  
  const serverData: ServerDataSnapshot = {
    product,
    general: generalFromProduct,
    upsell: upsellSettings,
    affiliateSettings,
    offers,
    checkoutSettings: state.serverData.checkoutSettings,
  };
  
  const editedData: EditedFormData = {
    general: { ...generalFromProduct },
    image: INITIAL_IMAGE_STATE,
    offers: {
      localOffers: offers,
      deletedOfferIds: [],
      modified: false,
    },
    upsell: { ...upsellSettings },
    affiliate: affiliateSettings ? { ...affiliateSettings } : null,
    checkoutSettings: state.editedData.checkoutSettings,
  };
  
  return {
    ...state,
    serverData,
    editedData,
    isInitialized: true,
    isDirty: false,
    dirtyFlags: {
      general: false,
      image: false,
      offers: false,
      upsell: false,
      affiliate: false,
      checkoutSettings: false,
    },
    validation: INITIAL_VALIDATION,
  };
}

// ============================================================================
// RESET TO SERVER
// ============================================================================

export function handleResetToServer(state: ProductFormState): ProductFormState {
  const editedData: EditedFormData = {
    general: { ...state.serverData.general },
    image: INITIAL_IMAGE_STATE,
    offers: {
      localOffers: state.serverData.offers,
      deletedOfferIds: [],
      modified: false,
    },
    upsell: { ...state.serverData.upsell },
    affiliate: state.serverData.affiliateSettings 
      ? { ...state.serverData.affiliateSettings } 
      : null,
    checkoutSettings: { ...state.serverData.checkoutSettings },
  };
  
  return {
    ...state,
    editedData,
    isDirty: false,
    dirtyFlags: {
      general: false,
      image: false,
      offers: false,
      upsell: false,
      affiliate: false,
      checkoutSettings: false,
    },
    validation: INITIAL_VALIDATION,
  };
}

// ============================================================================
// MARK SAVED
// ============================================================================

export function handleMarkSaved(
  state: ProductFormState,
  payload?: { newServerData?: Partial<ServerDataSnapshot> }
): ProductFormState {
  let newServerData = state.serverData;
  
  if (payload?.newServerData) {
    newServerData = { ...state.serverData, ...payload.newServerData };
    
    if (payload.newServerData.product) {
      newServerData.general = deriveGeneralFromProduct(payload.newServerData.product);
    }
  } else {
    newServerData = {
      ...state.serverData,
      general: { ...state.editedData.general },
      upsell: { ...state.editedData.upsell },
      affiliateSettings: state.editedData.affiliate ? { ...state.editedData.affiliate } : null,
    };
  }
  
  const newDirtyFlags = calculateDirtyFlags(state.editedData, newServerData);
  
  return {
    ...state,
    serverData: newServerData,
    dirtyFlags: newDirtyFlags,
    isDirty: anyDirty(newDirtyFlags),
  };
}
