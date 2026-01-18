/**
 * useGeneralTabOffers - Lógica de Ofertas (View Only)
 * 
 * REFATORADO para usar estado do ProductContext via reducer.
 * Não mantém estado local - usa formState.editedData.offers.
 * 
 * NOTA: saveDeletedOffers e saveOffers foram REMOVIDOS
 * Motivo: Salvamento unificado via useGlobalValidationHandlers + saveFunctions.ts
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Zero Duplicação
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
  
  // Derivar do reducer
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
    dispatchForm({ type: 'RESET_OFFERS' });
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
