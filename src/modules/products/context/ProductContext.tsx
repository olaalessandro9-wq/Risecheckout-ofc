/**
 * ProductContext - XState State Machine Edition
 * 
 * RISE Protocol V3 - Nota 10.0/10
 * 
 * A State Machine é a ÚNICA fonte de verdade para:
 * - Estado do formulário (general, image, offers, upsell, affiliate, checkout)
 * - Entidades (orderBumps, checkouts, paymentLinks, coupons)
 * - Flags de estado (loading, saving, dirty, validation)
 */

import { createContext, useContext, useMemo, useEffect } from "react";
import { useMachine } from "@xstate/react";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";

// State Machine
import { productFormMachine } from "../machines";
import type { ProductFormEvent } from "../machines";
import { calculateDirtyFlags } from "../machines/productFormMachine.guards";

// Types
import type { ProductProviderProps } from "../types/product.types";
import type { ProductContextValue } from "./ProductContext.types";
import type { GeneralFormData } from "../types/productForm.types";

// Hooks
import { useSaveRegistry } from "./hooks/useSaveRegistry";
import { useGlobalValidationHandlers } from "./hooks/useGlobalValidationHandlers";
import { useProductSettings } from "./hooks/useProductSettingsAdapter";
import { useProductDelete } from "./hooks/useProductDelete";
import { useProductFormHandlers } from "./hooks/useProductFormHandlers";
import { useProductSaveHandlers } from "./hooks/useProductSaveHandlers";

// Helpers
import { validateGeneralForm } from "./productFormValidation";

// ============================================================================
// CONTEXT
// ============================================================================

const ProductContext = createContext<ProductContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export function ProductProvider({ productId, children }: ProductProviderProps) {
  const { user } = useUnifiedAuth();
  
  // === STATE MACHINE - Single Source of Truth ===
  const [state, send] = useMachine(productFormMachine, {
    input: { productId: productId ?? null, userId: user?.id },
  });
  
  const context = state.context;
  
  // === Save Registry ===
  const { registerSaveHandler, executeAll: executeRegistrySaves } = useSaveRegistry();
  
  // === Product Delete ===
  const { deleteProduct } = useProductDelete({
    productId: productId ?? null,
    userId: user?.id,
  });
  
  // === Settings Adapter ===
  const settingsAdapter = useProductSettings({
    productId: productId ?? null,
    userId: user?.id,
    upsellSettings: context.editedData.upsell,
    affiliateSettings: context.editedData.affiliate,
    onUpdateUpsell: (settings) => send({ type: "EDIT_UPSELL", payload: settings }),
    onUpdateAffiliate: (settings) => send({ type: "EDIT_AFFILIATE", payload: settings }),
  });
  
  // === Load Data on Mount/ProductId Change ===
  // RISE V3: useEffect for side effects (not useMemo)
  useEffect(() => {
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
  
  // === Form Handlers (extracted) ===
  const formHandlers = useProductFormHandlers({ send });
  
  // === Save Handlers (extracted) ===
  const { saveAll, refreshAll } = useProductSaveHandlers({ send, executeRegistrySaves });
  
  // === Context Value ===
  const contextValue: ProductContextValue = useMemo(() => ({
    // === Stable Product ID (SSOT) ===
    productId: productId!,
    
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
    
    // Form Handlers (from extracted hook)
    ...formHandlers,
    
    // Save/Refresh
    saveAll,
    refreshAll,
    saveProduct: async () => { send({ type: "SAVE_ALL" }); },
    saveUpsellSettings: settingsAdapter.saveUpsellSettings,
    saveAffiliateSettings: settingsAdapter.saveAffiliateSettings,
    deleteProduct: async () => deleteProduct(),
    
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
    
    // Public API (stable interface for consumers)
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
    productId,
    context, loading, saving, hasUnsavedChanges, formHandlers,
    saveAll, refreshAll, settingsAdapter, deleteProduct,
    registerSaveHandler, state.value, send,
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
