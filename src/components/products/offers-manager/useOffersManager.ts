/**
 * Hook para lógica do OffersManager
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Separação de Lógica e UI
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { Offer, OfferError } from "./types";

interface UseOffersManagerProps {
  offers: Offer[];
  onOffersChange: (offers: Offer[]) => void;
  onModifiedChange: (modified: boolean) => void;
  onOfferDeleted?: (offerId: string) => void;
}

export function useOffersManager({
  offers,
  onOffersChange,
  onModifiedChange,
  onOfferDeleted,
}: UseOffersManagerProps) {
  const [errors, setErrors] = useState<Record<string, OfferError>>({});

  const validateOffer = useCallback((offer: Offer): OfferError => {
    const error: OfferError = {};
    
    if (!offer.name || offer.name.trim() === "") {
      error.name = "Campo obrigatório";
    }
    
    if (!offer.price || offer.price <= 0) {
      error.price = "O preço mínimo é R$ 0,01";
    }
    
    return error;
  }, []);

  const hasErrors = useCallback((): boolean => {
    const newErrors: Record<string, OfferError> = {};
    let hasError = false;

    offers.forEach(offer => {
      const error = validateOffer(offer);
      if (Object.keys(error).length > 0) {
        newErrors[offer.id] = error;
        hasError = true;
      }
    });

    setErrors(newErrors);
    return hasError;
  }, [offers, validateOffer]);

  const handleAddOffer = useCallback(() => {
    const nonDefaultOffers = offers.filter(o => !o.is_default);
    if (nonDefaultOffers.length > 0) {
      const hasIncomplete = nonDefaultOffers.some(offer => {
        const error = validateOffer(offer);
        return Object.keys(error).length > 0;
      });

      if (hasIncomplete) {
        hasErrors();
        toast.error("Preencha todos os campos da oferta anterior antes de adicionar uma nova");
        return;
      }
    }

    const newOffer: Offer = {
      id: `temp-${Date.now()}`,
      name: "",
      price: 0,
      is_default: false,
      member_group_id: null,
    };
    
    onOffersChange([...offers, newOffer]);
    onModifiedChange(true);
  }, [offers, onOffersChange, onModifiedChange, validateOffer, hasErrors]);

  const handleRemoveOffer = useCallback((id: string) => {
    const offerToRemove = offers.find(o => o.id === id);
    
    if (offerToRemove?.is_default) {
      toast.error("A oferta principal não pode ser removida");
      return;
    }
    
    if (!id.startsWith('temp-') && onOfferDeleted) {
      onOfferDeleted(id);
    }
    
    const newOffers = offers.filter(o => o.id !== id);
    onOffersChange(newOffers);
    onModifiedChange(true);
    
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
    
    toast.success("Oferta removida");
  }, [offers, onOffersChange, onModifiedChange, onOfferDeleted]);

  const handleUpdateOffer = useCallback((id: string, field: keyof Offer, value: Offer[keyof Offer]) => {
    const updatedOffers = offers.map(o => 
      o.id === id ? { ...o, [field]: value } : o
    );
    
    onOffersChange(updatedOffers);
    onModifiedChange(true);
    
    const updatedOffer = updatedOffers.find(o => o.id === id);
    if (updatedOffer) {
      const error = validateOffer(updatedOffer);
      setErrors(prev => {
        const newErrors = { ...prev };
        if (Object.keys(error).length === 0) {
          delete newErrors[id];
        } else {
          newErrors[id] = error;
        }
        return newErrors;
      });
    }
  }, [offers, onOffersChange, onModifiedChange, validateOffer]);

  const defaultOffer = offers.find(o => o.is_default);
  const additionalOffers = offers.filter(o => !o.is_default);

  return {
    errors,
    defaultOffer,
    additionalOffers,
    handleAddOffer,
    handleRemoveOffer,
    handleUpdateOffer,
  };
}
