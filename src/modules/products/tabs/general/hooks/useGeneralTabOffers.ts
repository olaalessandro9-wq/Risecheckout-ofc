/**
 * useGeneralTabOffers - Lógica de Ofertas
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { Offer } from "@/components/products/OffersManager";

interface UseGeneralTabOffersProps {
  offers: Offer[];
  productId: string | undefined;
}

export function useGeneralTabOffers({ offers, productId }: UseGeneralTabOffersProps) {
  const [localOffers, setLocalOffers] = useState<Offer[]>([]);
  const [deletedOfferIds, setDeletedOfferIds] = useState<string[]>([]);
  const [offersModified, setOffersModified] = useState(false);

  // Sincronizar ofertas
  useEffect(() => {
    setLocalOffers(offers);
  }, [offers]);

  const handleOffersChange = useCallback((newOffers: Offer[]) => {
    setLocalOffers(newOffers);
  }, []);

  const handleOffersModifiedChange = useCallback((modified: boolean) => {
    setOffersModified(modified);
  }, []);

  const handleOfferDeleted = useCallback((offerId: string) => {
    setDeletedOfferIds((prev) => [...prev, offerId]);
  }, []);

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
      memberGroupId: offer.member_group_id || null,
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
    setOffersModified(false);
    setDeletedOfferIds([]);
  }, []);

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
