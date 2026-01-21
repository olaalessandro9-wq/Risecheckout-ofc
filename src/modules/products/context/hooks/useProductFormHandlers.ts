/**
 * useProductFormHandlers - Form Field Update Handlers
 * 
 * Centraliza todos os handlers de atualização de campos do formulário.
 * Extraído do ProductContext para manter abaixo de 300 linhas.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 * @module products/context/hooks
 */

import { useCallback } from "react";
import type { ProductFormEvent, ProductFormContext } from "../../machines";
import type { 
  GeneralFormData, 
  ImageFormState, 
  CheckoutSettingsFormData,
  GatewayCredentials,
} from "../../types/productForm.types";
import type { Offer } from "../../types/product.types";

// ============================================================================
// HOOK INTERFACE
// ============================================================================

interface UseProductFormHandlersProps {
  send: (event: ProductFormEvent) => void;
}

interface UseProductFormHandlersReturn {
  updateGeneralField: <K extends keyof GeneralFormData>(field: K, value: GeneralFormData[K]) => void;
  updateImageState: (update: Partial<ImageFormState>) => void;
  updateLocalOffers: (offers: Offer[]) => void;
  markOfferDeleted: (offerId: string) => void;
  setOffersModified: (modified: boolean) => void;
  updateCheckoutSettingsField: <K extends keyof CheckoutSettingsFormData>(field: K, value: CheckoutSettingsFormData[K]) => void;
  initCheckoutSettings: (settings: CheckoutSettingsFormData, credentials: GatewayCredentials) => void;
  updateUpsellSettings: (settings: Partial<ProductFormContext["editedData"]["upsell"]>) => void;
  updateAffiliateSettings: (settings: Partial<ProductFormContext["editedData"]["affiliate"]>) => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useProductFormHandlers({ send }: UseProductFormHandlersProps): UseProductFormHandlersReturn {
  
  const updateGeneralField = useCallback(<K extends keyof GeneralFormData>(field: K, value: GeneralFormData[K]) => {
    send({ type: "EDIT_GENERAL", payload: { [field]: value } as Partial<GeneralFormData> });
  }, [send]);
  
  const updateImageState = useCallback((update: Partial<ImageFormState>) => {
    send({ type: "EDIT_IMAGE", payload: update });
  }, [send]);
  
  const updateLocalOffers = useCallback((offers: Offer[]) => {
    send({ type: "EDIT_OFFERS", payload: { localOffers: offers } });
  }, [send]);
  
  const markOfferDeleted = useCallback((offerId: string) => {
    send({ type: "ADD_DELETED_OFFER", offerId });
  }, [send]);
  
  const setOffersModified = useCallback((modified: boolean) => {
    send({ type: "EDIT_OFFERS", payload: { modified } });
  }, [send]);
  
  const updateCheckoutSettingsField = useCallback(<K extends keyof CheckoutSettingsFormData>(field: K, value: CheckoutSettingsFormData[K]) => {
    send({ type: "EDIT_CHECKOUT_SETTINGS", payload: { [field]: value } as Partial<CheckoutSettingsFormData> });
  }, [send]);
  
  const initCheckoutSettings = useCallback((settings: CheckoutSettingsFormData, credentials: GatewayCredentials) => {
    send({ type: "INIT_CHECKOUT_SETTINGS", settings, credentials });
  }, [send]);
  
  const updateUpsellSettings = useCallback((settings: Partial<ProductFormContext["editedData"]["upsell"]>) => {
    send({ type: "EDIT_UPSELL", payload: settings });
  }, [send]);
  
  const updateAffiliateSettings = useCallback((settings: Partial<ProductFormContext["editedData"]["affiliate"]>) => {
    send({ type: "EDIT_AFFILIATE", payload: settings });
  }, [send]);
  
  return {
    updateGeneralField,
    updateImageState,
    updateLocalOffers,
    markOfferDeleted,
    setOffersModified,
    updateCheckoutSettingsField,
    initCheckoutSettings,
    updateUpsellSettings,
    updateAffiliateSettings,
  };
}
