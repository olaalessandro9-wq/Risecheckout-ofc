/**
 * useGeneralTabOffers - Lógica de Ofertas (View Only)
 * 
 * REFATORADO para XState State Machine.
 * Não mantém estado local - usa formState.editedData.offers.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - XState 10.0/10
 */

import { useCallback } from "react";
import { useProductContext } from "../../../context/ProductContext";
import type { Offer } from "../../../types/product.types";

export function useGeneralTabOffers() {
  const { 
    localOffers,
    formState,
    updateLocalOffers,
    markOfferDeleted,
    setOffersModified,
    dispatchForm,
  } = useProductContext();
  
  // Derivar do state machine context
  const offersModified = formState.editedData.offers.modified;
  const deletedOfferIds = formState.editedData.offers.deletedOfferIds;

  const handleOffersChange = useCallback((newOffers: Offer[]) => {
    updateLocalOffers(newOffers);
  }, [updateLocalOffers]);

  const handleOffersModifiedChange = useCallback((modified: boolean) => {
    setOffersModified(modified);
  }, [setOffersModified]);

  const handleOfferDeleted = useCallback((offerId: string) => {
    markOfferDeleted(offerId);
  }, [markOfferDeleted]);

  const resetOffers = useCallback(() => {
    dispatchForm({ type: 'EDIT_OFFERS', payload: { modified: false, deletedOfferIds: [] } });
  }, [dispatchForm]);

  return {
    localOffers,
    offersModified,
    deletedOfferIds,
    handleOffersChange,
    handleOffersModifiedChange,
    handleOfferDeleted,
    resetOffers,
  };
}
