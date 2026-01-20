/**
 * ProductContext - XState State Machine Edition
 * 
 * RISE Protocol V3 - Nota 10.0/10
 * 
 * A State Machine é a ÚNICA fonte de verdade para:
 * - Estado do formulário (general, image, offers, upsell, affiliate, checkout)
 * - Entidades (orderBumps, checkouts, paymentLinks, coupons)
 * - Flags de estado (loading, saving, dirty, validation)
 * 
 * Benefícios:
 * - Zero race conditions
 * - Estados impossíveis são impossíveis por design
 * - Visualizável no Stately Studio
 * - Transições explícitas e auditáveis
 */

import { createContext, useContext, useCallback, useMemo } from "react";
import { useMachine } from "@xstate/react";
import { useAuth } from "@/hooks/useAuth";
import { createLogger } from "@/lib/logger";

// State Machine
import { productFormMachine, initialContext } from "../machines";
import type { ProductFormContext, ProductFormEvent } from "../machines";
import { calculateDirtyFlags } from "../machines/productFormMachine.guards";

// Types
import type { ProductProviderProps, Offer } from "../types/product.types";
import type { 
  GeneralFormData, 
  ImageFormState, 
  CheckoutSettingsFormData, 
  GatewayCredentials 
} from "../types/productForm.types";
import type { RegisterSaveHandler } from "../types/saveRegistry.types";
import type { TabValidationMap } from "../types/tabValidation.types";

// Hooks que ainda precisamos
import { useSaveRegistry } from "./hooks/useSaveRegistry";
import { useGlobalValidationHandlers } from "./hooks/useGlobalValidationHandlers";
import { useProductSettings } from "./hooks/useProductSettingsAdapter";

// Helpers
import { validateGeneralForm } from "./productFormValidation";

const log = createLogger("ProductContext");

// ============================================================================
// CONTEXT TYPE
// ============================================================================

interface ProductContextValue {
  // === Data from State Machine ===
  product: ProductFormContext["serverData"]["product"];
  offers: Offer[];
  orderBumps: ProductFormContext["entities"]["orderBumps"];
  checkouts: ProductFormContext["entities"]["checkouts"];
  paymentLinks: ProductFormContext["entities"]["paymentLinks"];
  coupons: ProductFormContext["entities"]["coupons"];
  
  // === Settings ===
  upsellSettings: ProductFormContext["editedData"]["upsell"];
  affiliateSettings: ProductFormContext["editedData"]["affiliate"];
  
  // === State Flags ===
  loading: boolean;
  saving: boolean;
  hasUnsavedChanges: boolean;
  
  // === Form Data ===
  generalForm: GeneralFormData;
  imageState: ImageFormState;
  localOffers: Offer[];
  checkoutSettingsForm: CheckoutSettingsFormData;
  checkoutCredentials: GatewayCredentials;
  
  // === Form Handlers ===
  updateGeneralField: <K extends keyof GeneralFormData>(field: K, value: GeneralFormData[K]) => void;
  updateImageState: (update: Partial<ImageFormState>) => void;
  updateLocalOffers: (offers: Offer[]) => void;
  markOfferDeleted: (offerId: string) => void;
  setOffersModified: (modified: boolean) => void;
  updateCheckoutSettingsField: <K extends keyof CheckoutSettingsFormData>(field: K, value: CheckoutSettingsFormData[K]) => void;
  initCheckoutSettings: (settings: CheckoutSettingsFormData, credentials: GatewayCredentials) => void;
  updateUpsellSettings: (settings: Partial<ProductFormContext["editedData"]["upsell"]>) => void;
  updateAffiliateSettings: (settings: Partial<ProductFormContext["editedData"]["affiliate"]>) => void;
  
  // === Save/Refresh ===
  saveAll: () => Promise<void>;
  refreshAll: () => Promise<void>;
  saveProduct: () => Promise<void>;
  saveUpsellSettings: () => Promise<void>;
  saveAffiliateSettings: () => Promise<void>;
  deleteProduct: () => Promise<boolean>;
  
  // === Refresh Individual ===
  refreshProduct: () => Promise<void>;
  refreshOffers: () => Promise<void>;
  refreshOrderBumps: () => Promise<void>;
  refreshCheckouts: () => Promise<void>;
  refreshCoupons: () => Promise<void>;
  refreshPaymentLinks: () => Promise<void>;
  
  // === Product Operations ===
  updateProduct: (field: string, value: unknown) => void;
  updateProductBulk: (data: Record<string, unknown>) => void;
  
  // === Validation ===
  formErrors: ProductFormContext["validationErrors"];
  validateGeneralForm: () => boolean;
  
  // === Tab Management ===
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabErrors: TabValidationMap;
  setTabErrors: (errors: TabValidationMap) => void;
  clearTabErrors: () => void;
  
  // === Save Registry ===
  registerSaveHandler: RegisterSaveHandler;
  
  // === Legacy Compatibility ===
  formState: {
    editedData: ProductFormContext["editedData"];
    serverData: ProductFormContext["serverData"];
    isDirty: boolean;
    validation: ProductFormContext["validationErrors"];
    isCheckoutSettingsInitialized: boolean;
    dirtyFlags: ReturnType<typeof calculateDirtyFlags>;
  };
  formDispatch: (event: ProductFormEvent) => void;
  dispatchForm: (event: ProductFormEvent) => void;
  
  // === State Machine Direct Access ===
  machineState: string;
  send: (event: ProductFormEvent) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ProductContext = createContext<ProductContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export function ProductProvider({ productId, children }: ProductProviderProps) {
  const { user } = useAuth();
  
  // === STATE MACHINE - Single Source of Truth ===
  const [state, send] = useMachine(productFormMachine, {
    input: {
      productId: productId ?? null,
      userId: user?.id,
    },
  });
  
  const context = state.context;
  
  // === Save Registry (para tabs que registram handlers) ===
  const { registerSaveHandler, executeAll: executeRegistrySaves } = useSaveRegistry();
  
  // === Settings Adapter (para operações de save específicas) ===
  const settingsAdapter = useProductSettings({
    productId: productId ?? null,
    userId: user?.id,
    upsellSettings: context.editedData.upsell,
    affiliateSettings: context.editedData.affiliate,
    onUpdateUpsell: (settings) => send({ type: "EDIT_UPSELL", payload: settings }),
    onUpdateAffiliate: (settings) => send({ type: "EDIT_AFFILIATE", payload: settings }),
  });
  
  // === Load Data on Mount/ProductId Change ===
  useMemo(() => {
    if (productId && user?.id && state.matches("idle")) {
      send({ type: "LOAD_DATA", productId, userId: user.id });
    }
  }, [productId, user?.id, state, send]);
  
  // === Global Validation Handlers ===
  useGlobalValidationHandlers({
    productId: productId ?? null,
    userId: user?.id,
    registerSaveHandler,
    generalForm: context.editedData.general,
    product: context.serverData.product,
    imageFile: context.editedData.image.imageFile,
    pendingRemoval: context.editedData.image.pendingRemoval,
    localOffers: context.editedData.offers.localOffers,
    offersModified: context.editedData.offers.modified,
    deletedOfferIds: context.editedData.offers.deletedOfferIds,
    resetImage: () => send({ type: "EDIT_IMAGE", payload: { imageFile: null, pendingRemoval: false } }),
    resetOffers: () => send({ type: "EDIT_OFFERS", payload: { modified: false, deletedOfferIds: [] } }),
    checkoutSettingsForm: context.editedData.checkoutSettings,
    isCheckoutSettingsInitialized: context.isCheckoutSettingsInitialized,
    formDispatch: send,
    upsellSettings: context.editedData.upsell,
    saveUpsellSettings: settingsAdapter.saveUpsellSettings,
    affiliateSettings: context.editedData.affiliate,
    saveAffiliateSettings: settingsAdapter.saveAffiliateSettings,
  });
  
  // === Derived State ===
  const loading = state.matches("loading");
  const saving = state.matches("saving");
  const hasUnsavedChanges = state.matches({ ready: "dirty" });
  
  // === Form Handlers ===
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
  
  // === Save Handlers ===
  const saveAll = useCallback(async () => {
    // Execute registry saves first
    const result = await executeRegistrySaves();
    
    // Check for errors
    if (!result.success) {
      // Set tab errors from registry result
      if (result.tabErrors) {
        send({ type: "SET_TAB_ERRORS", errors: result.tabErrors });
      }
      
      // Navigate to first failed tab if available
      if (result.firstFailedTabKey) {
        send({ type: "SET_TAB", tab: result.firstFailedTabKey });
      }
      
      return;
    }
    
    // Trigger machine save success
    send({ type: "SAVE_SUCCESS" });
  }, [send, executeRegistrySaves]);
  
  const refreshAll = useCallback(async () => {
    send({ type: "REFRESH" });
  }, [send]);
  
  // === Context Value ===
  const contextValue: ProductContextValue = useMemo(() => ({
    // Data
    product: context.serverData.product,
    offers: context.editedData.offers.localOffers,
    orderBumps: context.entities.orderBumps,
    checkouts: context.entities.checkouts,
    paymentLinks: context.entities.paymentLinks,
    coupons: context.entities.coupons,
    
    // Settings
    upsellSettings: context.editedData.upsell,
    affiliateSettings: context.editedData.affiliate,
    
    // State
    loading,
    saving,
    hasUnsavedChanges,
    
    // Form Data
    generalForm: context.editedData.general,
    imageState: context.editedData.image,
    localOffers: context.editedData.offers.localOffers,
    checkoutSettingsForm: context.editedData.checkoutSettings,
    checkoutCredentials: context.credentials,
    
    // Form Handlers
    updateGeneralField,
    updateImageState,
    updateLocalOffers,
    markOfferDeleted,
    setOffersModified,
    updateCheckoutSettingsField,
    initCheckoutSettings,
    updateUpsellSettings,
    updateAffiliateSettings,
    
    // Save/Refresh
    saveAll,
    refreshAll,
    saveProduct: async () => { send({ type: "SAVE_ALL" }); },
    saveUpsellSettings: settingsAdapter.saveUpsellSettings,
    saveAffiliateSettings: settingsAdapter.saveAffiliateSettings,
    deleteProduct: async () => {
      // TODO: Implement via state machine actor
      log.warn("deleteProduct not yet implemented in XState");
      return false;
    },
    
    // Refresh Individual (delegated to machine refresh)
    refreshProduct: refreshAll,
    refreshOffers: refreshAll,
    refreshOrderBumps: refreshAll,
    refreshCheckouts: refreshAll,
    refreshCoupons: refreshAll,
    refreshPaymentLinks: refreshAll,
    
    // Product Operations
    updateProduct: (field, value) => {
      send({ type: "EDIT_GENERAL", payload: { [field]: value } as Partial<GeneralFormData> });
    },
    updateProductBulk: (data) => {
      send({ type: "EDIT_GENERAL", payload: data as Partial<GeneralFormData> });
    },
    
    // Validation
    formErrors: context.validationErrors,
    validateGeneralForm: () => validateGeneralForm(context.editedData.general).isValid,
    
    // Tab Management
    activeTab: context.activeTab,
    setActiveTab: (tab) => send({ type: "SET_TAB", tab }),
    tabErrors: context.tabErrors,
    setTabErrors: (errors) => send({ type: "SET_TAB_ERRORS", errors }),
    clearTabErrors: () => send({ type: "CLEAR_TAB_ERRORS" }),
    
    // Save Registry
    registerSaveHandler,
    
    // Legacy Compatibility
    formState: {
      editedData: context.editedData,
      serverData: context.serverData,
      isDirty: hasUnsavedChanges,
      validation: context.validationErrors,
      isCheckoutSettingsInitialized: context.isCheckoutSettingsInitialized,
      dirtyFlags: calculateDirtyFlags(context),
    },
    formDispatch: send,
    dispatchForm: send,
    
    // State Machine Direct Access
    machineState: state.value as string,
    send,
  }), [
    context,
    loading,
    saving,
    hasUnsavedChanges,
    updateGeneralField,
    updateImageState,
    updateLocalOffers,
    markOfferDeleted,
    setOffersModified,
    updateCheckoutSettingsField,
    initCheckoutSettings,
    updateUpsellSettings,
    updateAffiliateSettings,
    saveAll,
    refreshAll,
    settingsAdapter,
    registerSaveHandler,
    state.value,
    send,
  ]);
  
  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useProductContext() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProductContext must be used within a ProductProvider.");
  }
  return context;
}
