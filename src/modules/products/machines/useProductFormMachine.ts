/**
 * useProductFormMachine - Hook React para a State Machine
 * 
 * Este hook encapsula a máquina de estados XState e fornece
 * uma interface compatível com o ProductContext existente.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Nota 10/10
 */

import { useMachine } from "@xstate/react";
import { useCallback } from "react";
import { productFormMachine } from "./productFormMachine";
import type {
  ProductFormContext,
  ProductFormEvent,
} from "./productFormMachine.types";
import type {
  GeneralFormData,
  ImageFormState,
  OffersFormState,
  FormValidationErrors,
} from "../types/productForm.types";
import type {
  ProductData,
  Offer,
  UpsellSettings,
  AffiliateSettings,
} from "../types/product.types";

// Checkout types - using any to avoid circular import issues temporarily
type CheckoutSettingsFormData = {
  required_fields: {
    name: boolean;
    email: boolean;
    phone: boolean;
    cpf: boolean;
  };
  default_payment_method: "pix" | "credit_card";
  pix_gateway: string;
  credit_card_gateway: string;
};

type GatewayCredentials = Record<string, { configured: boolean; viaSecrets?: boolean } | undefined>;

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

export interface UseProductFormMachineReturn {
  // Estado atual
  state: ProductFormContext;
  stateValue: string;
  
  // Status da máquina
  isIdle: boolean;
  isLoading: boolean;
  isEditing: boolean;
  isValidating: boolean;
  isSaving: boolean;
  isSaved: boolean;
  isError: boolean;
  
  // Dirty tracking
  isDirty: boolean;
  dirtyFlags: ProductFormContext["dirtyFlags"];
  
  // Dados
  serverData: ProductFormContext["serverData"];
  editedData: ProductFormContext["editedData"];
  validation: FormValidationErrors;
  
  // Ações - Inicialização
  startLoading: (productId: string, userId: string) => void;
  loadData: (data: {
    product: ProductData | null;
    upsellSettings: UpsellSettings;
    affiliateSettings: AffiliateSettings | null;
    offers: Offer[];
  }) => void;
  loadError: (error: string) => void;
  
  // Ações - Atualizações
  updateGeneral: (data: Partial<GeneralFormData>) => void;
  updateImage: (data: Partial<ImageFormState>) => void;
  resetImage: () => void;
  updateOffers: (data: {
    localOffers?: Offer[];
    deletedOfferIds?: string[];
    modified?: boolean;
  }) => void;
  addDeletedOffer: (offerId: string) => void;
  updateUpsell: (data: Partial<UpsellSettings>) => void;
  updateAffiliate: (data: Partial<AffiliateSettings>) => void;
  updateCheckoutSettings: (data: Partial<CheckoutSettingsFormData>) => void;
  initCheckoutSettings: (settings: CheckoutSettingsFormData, credentials: GatewayCredentials) => void;
  
  // Ações - Validação
  setValidationError: (section: "general" | "upsell" | "affiliate", field: string, error: string | undefined) => void;
  clearValidationErrors: () => void;
  
  // Ações - Save
  requestSave: () => void;
  validationPassed: () => void;
  validationFailed: (errors: FormValidationErrors) => void;
  saveSuccess: (newServerData?: Partial<ProductFormContext["serverData"]>) => void;
  saveError: (error: string) => void;
  
  // Ações - Reset
  discardChanges: () => void;
  resetToServer: () => void;
  continueEditing: () => void;
  retry: () => void;
  
  // Raw dispatch
  send: (event: ProductFormEvent) => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useProductFormMachine(): UseProductFormMachineReturn {
  const [snapshot, send] = useMachine(productFormMachine);
  
  const context = snapshot.context;
  const stateValue = snapshot.value as string;
  
  // Status helpers
  const isIdle = stateValue === "idle";
  const isLoading = stateValue === "loading";
  const isEditing = stateValue === "editing";
  const isValidating = stateValue === "validating";
  const isSaving = stateValue === "saving";
  const isSaved = stateValue === "saved";
  const isError = stateValue === "error";
  
  // Actions - Inicialização
  const startLoading = useCallback((productId: string, userId: string) => {
    send({ type: "START_LOADING", productId, userId });
  }, [send]);
  
  const loadData = useCallback((data: {
    product: ProductData | null;
    upsellSettings: UpsellSettings;
    affiliateSettings: AffiliateSettings | null;
    offers: Offer[];
  }) => {
    send({ type: "DATA_LOADED", data });
  }, [send]);
  
  const loadError = useCallback((error: string) => {
    send({ type: "LOAD_ERROR", error });
  }, [send]);
  
  // Actions - Atualizações
  const updateGeneral = useCallback((data: Partial<GeneralFormData>) => {
    send({ type: "UPDATE_GENERAL", data });
  }, [send]);
  
  const updateImage = useCallback((data: Partial<ImageFormState>) => {
    send({ type: "UPDATE_IMAGE", data });
  }, [send]);
  
  const resetImage = useCallback(() => {
    send({ type: "RESET_IMAGE" });
  }, [send]);
  
  const updateOffers = useCallback((data: {
    localOffers?: Offer[];
    deletedOfferIds?: string[];
    modified?: boolean;
  }) => {
    send({ type: "UPDATE_OFFERS", data });
  }, [send]);
  
  const addDeletedOffer = useCallback((offerId: string) => {
    send({ type: "ADD_DELETED_OFFER", offerId });
  }, [send]);
  
  const updateUpsell = useCallback((data: Partial<UpsellSettings>) => {
    send({ type: "UPDATE_UPSELL", data });
  }, [send]);
  
  const updateAffiliate = useCallback((data: Partial<AffiliateSettings>) => {
    send({ type: "UPDATE_AFFILIATE", data });
  }, [send]);
  
  const updateCheckoutSettings = useCallback((data: Partial<CheckoutSettingsFormData>) => {
    send({ type: "UPDATE_CHECKOUT_SETTINGS", data });
  }, [send]);
  
  const initCheckoutSettings = useCallback((settings: CheckoutSettingsFormData, credentials: GatewayCredentials) => {
    send({ type: "INIT_CHECKOUT_SETTINGS", settings, credentials });
  }, [send]);
  
  // Actions - Validação
  const setValidationError = useCallback((
    section: "general" | "upsell" | "affiliate",
    field: string,
    error: string | undefined
  ) => {
    send({ type: "SET_VALIDATION_ERROR", section, field, error });
  }, [send]);
  
  const clearValidationErrors = useCallback(() => {
    send({ type: "CLEAR_VALIDATION_ERRORS" });
  }, [send]);
  
  // Actions - Save
  const requestSave = useCallback(() => {
    send({ type: "REQUEST_SAVE" });
  }, [send]);
  
  const validationPassed = useCallback(() => {
    send({ type: "VALIDATION_PASSED" });
  }, [send]);
  
  const validationFailed = useCallback((errors: FormValidationErrors) => {
    send({ type: "VALIDATION_FAILED", errors });
  }, [send]);
  
  const saveSuccess = useCallback((newServerData?: Partial<ProductFormContext["serverData"]>) => {
    send({ type: "SAVE_SUCCESS", newServerData });
  }, [send]);
  
  const saveError = useCallback((error: string) => {
    send({ type: "SAVE_ERROR", error });
  }, [send]);
  
  // Actions - Reset
  const discardChanges = useCallback(() => {
    send({ type: "DISCARD_CHANGES" });
  }, [send]);
  
  const resetToServer = useCallback(() => {
    send({ type: "RESET_TO_SERVER" });
  }, [send]);
  
  const continueEditing = useCallback(() => {
    send({ type: "CONTINUE_EDITING" });
  }, [send]);
  
  const retry = useCallback(() => {
    send({ type: "RETRY" });
  }, [send]);
  
  return {
    state: context,
    stateValue,
    
    isIdle,
    isLoading,
    isEditing,
    isValidating,
    isSaving,
    isSaved,
    isError,
    
    isDirty: context.isDirty,
    dirtyFlags: context.dirtyFlags,
    
    serverData: context.serverData,
    editedData: context.editedData,
    validation: context.validation,
    
    startLoading,
    loadData,
    loadError,
    
    updateGeneral,
    updateImage,
    resetImage,
    updateOffers,
    addDeletedOffer,
    updateUpsell,
    updateAffiliate,
    updateCheckoutSettings,
    initCheckoutSettings,
    
    setValidationError,
    clearValidationErrors,
    
    requestSave,
    validationPassed,
    validationFailed,
    saveSuccess,
    saveError,
    
    discardChanges,
    resetToServer,
    continueEditing,
    retry,
    
    send,
  };
}
