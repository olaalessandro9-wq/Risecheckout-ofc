/**
 * useGeneralTabOffers - Lógica de Ofertas
 * 
 * REFATORADO para usar estado do ProductContext via reducer.
 * Não mantém estado local - usa formState.editedData.offers.
 * 
 * @see RISE ARCHITECT PROTOCOL - Solução C
 */

import { useCallback } from "react";
import { api } from "@/lib/api";
import { useProductContext } from "../../../context/ProductContext";
import type { Offer } from "../../../types/product.types";

interface UseGeneralTabOffersProps {
  productId: string | undefined;
}

export function useGeneralTabOffers({ productId }: UseGeneralTabOffersProps) {
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

  // Salvar ofertas deletadas via Edge Function
  const saveDeletedOffers = useCallback(async () => {
    if (deletedOfferIds.length === 0) return;

    for (const offerId of deletedOfferIds) {
      const { data, error } = await api.call<{ success?: boolean; error?: string }>('offer-crud/delete', {
        offerId,
      });
      
      if (error) {
        console.error('[useGeneralTabOffers] Error deleting offer:', error);
        throw new Error(error.message);
      }
      if (!data?.success) {
        throw new Error(data?.error || 'Falha ao deletar oferta');
      }
    }
  }, [deletedOfferIds]);

  // Salvar ofertas modificadas via Edge Function
  const saveOffers = useCallback(async () => {
    if (!offersModified || !productId) return;

    const offersToSave = localOffers.map(offer => ({
      id: offer.id.startsWith("temp-") ? undefined : offer.id,
      productId: productId,
      name: offer.name,
      price: offer.price,
      isDefault: offer.is_default || false,
      memberGroupId: null,
    }));
    
    const { data, error } = await api.call<{ success?: boolean; error?: string }>('offer-bulk/bulk-save', {
      productId: productId,
      offers: offersToSave,
    });
    
    if (error) {
      console.error('[useGeneralTabOffers] Error saving offers:', error);
      throw new Error(error.message);
    }
    if (!data?.success) {
      throw new Error(data?.error || 'Falha ao salvar ofertas');
    }
  }, [offersModified, localOffers, productId]);

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
    saveDeletedOffers,
    saveOffers,
    resetOffers,
  };
}
