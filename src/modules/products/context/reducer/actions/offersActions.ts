/**
 * Offers Actions - Ações para gerenciamento de ofertas
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import type { ProductFormState, OffersFormState } from "../../../types/productForm.types";
import type { Offer } from "../../../types/product.types";
import { calculateDirtyFlags, anyDirty } from "../helpers";

// ============================================================================
// UPDATE OFFERS
// ============================================================================

export function handleUpdateOffers(
  state: ProductFormState,
  payload: {
    localOffers?: Offer[];
    deletedOfferIds?: string[];
    modified?: boolean;
  }
): ProductFormState {
  const newOffers: OffersFormState = {
    localOffers: payload.localOffers ?? state.editedData.offers.localOffers,
    deletedOfferIds: payload.deletedOfferIds ?? state.editedData.offers.deletedOfferIds,
    modified: payload.modified ?? state.editedData.offers.modified,
  };
  const newEditedData = { ...state.editedData, offers: newOffers };
  const newDirtyFlags = calculateDirtyFlags(newEditedData, state.serverData);
  
  return {
    ...state,
    editedData: newEditedData,
    dirtyFlags: newDirtyFlags,
    isDirty: anyDirty(newDirtyFlags),
  };
}

// ============================================================================
// ADD DELETED OFFER
// ============================================================================

export function handleAddDeletedOffer(
  state: ProductFormState,
  offerId: string
): ProductFormState {
  const newDeletedOfferIds = [...state.editedData.offers.deletedOfferIds, offerId];
  const newOffers: OffersFormState = {
    ...state.editedData.offers,
    deletedOfferIds: newDeletedOfferIds,
  };
  const newEditedData = { ...state.editedData, offers: newOffers };
  const newDirtyFlags = calculateDirtyFlags(newEditedData, state.serverData);
  
  return {
    ...state,
    editedData: newEditedData,
    dirtyFlags: newDirtyFlags,
    isDirty: anyDirty(newDirtyFlags),
  };
}

// ============================================================================
// RESET OFFERS
// ============================================================================

export function handleResetOffers(state: ProductFormState): ProductFormState {
  const newOffers: OffersFormState = {
    localOffers: state.editedData.offers.localOffers,
    deletedOfferIds: [],
    modified: false,
  };
  const newEditedData = { ...state.editedData, offers: newOffers };
  const newDirtyFlags = calculateDirtyFlags(newEditedData, state.serverData);
  
  return {
    ...state,
    editedData: newEditedData,
    dirtyFlags: newDirtyFlags,
    isDirty: anyDirty(newDirtyFlags),
  };
}
