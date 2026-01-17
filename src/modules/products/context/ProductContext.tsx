/**
 * ProductContext - Orquestrador do Sistema de Edição de Produtos
 * 
 * MODULARIZADO seguindo RISE Protocol V3.
 * - Reducer como Single Source of Truth
 * - Zero duplicidade de estado (useProductSettings refatorado)
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Nota 10/10
 */

import { createContext, useContext, useReducer, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { ProductContextState, ProductProviderProps, AffiliateSettings, UpsellSettings, ProductData, Offer } from "../types/product.types";
import type { GeneralFormData, ImageFormState, ProductFormState, ProductFormDispatch, FormValidationErrors, CheckoutSettingsFormData, GatewayCredentials } from "../types/productForm.types";

// Reducer e Actions
import { productFormReducer, INITIAL_FORM_STATE, formActions } from "./productFormReducer";
import { validateGeneralForm } from "./productFormValidation";

// Hooks especializados
import {
  useProductCore,
  useProductEntities,
  useProductCheckouts,
} from "./hooks";

// Adapter puro (zero useState)
import { useProductSettings as useProductSettingsAdapter } from "./hooks/useProductSettingsAdapter";

// Helpers
import {
  createUpdateGeneralField,
  createUpdateImageState,
  createUpdateLocalOffers,
  createMarkOfferDeleted,
  createSetOffersModified,
  createUpdateCheckoutSettingsField,
  createInitCheckoutSettings,
  createSaveProduct,
  createSaveAll,
  createUpdateProduct,
  createUpdateProductBulk,
} from "./helpers";

// ============================================================================
// CONTEXT TYPE ESTENDIDO
// ============================================================================

interface ProductContextExtended extends ProductContextState {
  formState: ProductFormState;
  formDispatch: ProductFormDispatch;
  dispatchForm: ProductFormDispatch;
  formErrors: FormValidationErrors;
  validateGeneralForm: () => boolean;
  generalForm: GeneralFormData;
  imageState: ImageFormState;
  localOffers: Offer[];
  checkoutSettingsForm: CheckoutSettingsFormData;
  checkoutCredentials: GatewayCredentials;
  updateGeneralField: <K extends keyof GeneralFormData>(field: K, value: GeneralFormData[K]) => void;
  updateImageState: (update: Partial<ImageFormState>) => void;
  updateLocalOffers: (offers: Offer[]) => void;
  markOfferDeleted: (offerId: string) => void;
  setOffersModified: (modified: boolean) => void;
  updateCheckoutSettingsField: <K extends keyof CheckoutSettingsFormData>(field: K, value: CheckoutSettingsFormData[K]) => void;
  initCheckoutSettings: (settings: CheckoutSettingsFormData, credentials: GatewayCredentials) => void;
}

// ============================================================================
// CONTEXTO
// ============================================================================

const ProductContext = createContext<ProductContextExtended | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export function ProductProvider({ productId, children }: ProductProviderProps) {
  const { user } = useAuth();

  // Reducer: Single Source of Truth
  const [formState, formDispatch] = useReducer(productFormReducer, INITIAL_FORM_STATE);

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkoutCredentials, setCheckoutCredentials] = useState<GatewayCredentials>({});

  const hasUnsavedChanges = formState.isDirty;

  // Legacy callbacks (no-op para compatibilidade)
  const markCoreUnsaved = useCallback(() => {}, []);
  const markCoreSaved = useCallback(() => {}, []);
  const markSettingsSaved = useCallback(() => {
    formDispatch(formActions.markSaved());
  }, []);
  const updateGeneralModified = useCallback(() => {}, []);
  const updateSettingsModified = useCallback(() => {}, []);
  const updateUpsellModified = useCallback(() => {}, []);
  const resetDirtySources = useCallback(() => {
    formDispatch(formActions.resetToServer());
  }, []);

  // Callbacks para o adapter - atualizam o Reducer
  const handleUpdateUpsell = useCallback((settings: Partial<UpsellSettings>) => {
    formDispatch(formActions.updateUpsell(settings));
  }, []);

  const handleUpdateAffiliate = useCallback((settings: Partial<AffiliateSettings>) => {
    formDispatch(formActions.updateAffiliate(settings));
  }, []);

  // Settings adapter (zero useState interno)
  const settingsAdapter = useProductSettingsAdapter({
    productId,
    userId: user?.id,
    upsellSettings: formState.editedData.upsell,
    affiliateSettings: formState.editedData.affiliate,
    onUpdateUpsell: handleUpdateUpsell,
    onUpdateAffiliate: handleUpdateAffiliate,
    onSaveComplete: markSettingsSaved,
  });

  // Core hook (carregamento do produto)
  const core = useProductCore({
    productId,
    userId: user?.id,
    onUnsavedChange: markCoreUnsaved,
    onUpsellSettingsLoaded: (settings: UpsellSettings) => {
      // Quando carregado, inicializa no Reducer
      formDispatch(formActions.updateUpsell(settings));
    },
    onAffiliateSettingsLoaded: (settings: AffiliateSettings | null) => {
      if (settings) {
        formDispatch(formActions.updateAffiliate(settings));
      }
    },
  });

  const entities = useProductEntities({ productId });
  const checkoutsHook = useProductCheckouts({ productId });

  // Sincronizar dados carregados → Reducer
  useEffect(() => {
    if (core.product && entities.offers !== undefined) {
      formDispatch(formActions.initFromServer({
        product: core.product,
        upsellSettings: formState.editedData.upsell,
        affiliateSettings: formState.editedData.affiliate,
        offers: entities.offers,
      }));
    }
  }, [core.product, entities.offers]);

  // Refresh all
  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        core.refreshProduct(),
        entities.refreshOffers(),
        entities.refreshOrderBumps(),
        checkoutsHook.refreshCheckouts(),
        entities.refreshCoupons(),
        checkoutsHook.refreshPaymentLinks(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [core, entities, checkoutsHook]);

  // Carregar dados iniciais
  useEffect(() => {
    if (productId && user) {
      refreshAll();
    }
  }, [productId, user]);

  // Form helpers (usando factory functions)
  const updateGeneralField = useCallback(createUpdateGeneralField(formDispatch), []);
  const updateImageState = useCallback(createUpdateImageState(formDispatch), []);
  const updateLocalOffers = useCallback(createUpdateLocalOffers(formDispatch), []);
  const markOfferDeleted = useCallback(createMarkOfferDeleted(formDispatch), []);
  const setOffersModified = useCallback(createSetOffersModified(formDispatch), []);
  const updateCheckoutSettingsField = useCallback(createUpdateCheckoutSettingsField(formDispatch), []);
  const initCheckoutSettingsHandler = useCallback(
    createInitCheckoutSettings(formDispatch, setCheckoutCredentials), 
    []
  );

  // Save wrappers
  const saveProduct = useCallback(
    createSaveProduct({ setSaving, formDispatch, core }),
    [core]
  );

  const saveUpsellSettings = useCallback(async () => {
    setSaving(true);
    try {
      await settingsAdapter.saveUpsellSettings(formState.editedData.upsell);
    } finally {
      setSaving(false);
    }
  }, [settingsAdapter, formState.editedData.upsell]);

  const saveAffiliateSettings = useCallback(async () => {
    setSaving(true);
    try {
      await settingsAdapter.saveAffiliateSettings(formState.editedData.affiliate);
    } finally {
      setSaving(false);
    }
  }, [settingsAdapter, formState.editedData.affiliate]);

  const saveAll = useCallback(async () => {
    setSaving(true);
    try {
      await saveProduct();
      await settingsAdapter.saveUpsellSettings(formState.editedData.upsell);
      await settingsAdapter.saveAffiliateSettings(formState.editedData.affiliate);
      formDispatch(formActions.markSaved());
      toast.success("Alterações salvas com sucesso!");
    } catch (error) {
      console.error("[ProductContext] Error saving all:", error);
      toast.error("Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  }, [saveProduct, settingsAdapter, formState.editedData]);

  // Update wrappers
  const updateProduct = useCallback(
    createUpdateProduct(core, formDispatch),
    [core]
  );

  const updateProductBulk = useCallback(
    createUpdateProductBulk(core, formDispatch),
    [core]
  );

  // Default settings (para compatibilidade)
  const defaultPaymentSettings = {
    pixEnabled: true,
    creditCardEnabled: true,
    defaultPaymentMethod: "credit_card" as const,
  };

  const defaultCheckoutFields = {
    fullName: true,
    phone: true,
    email: true,
    cpf: false,
  };

  // Context value
  const contextValue: ProductContextExtended = {
    product: core.product,
    offers: entities.offers,
    orderBumps: entities.orderBumps,
    checkouts: checkoutsHook.checkouts,
    coupons: entities.coupons,
    paymentLinks: checkoutsHook.paymentLinks,
    paymentSettings: defaultPaymentSettings,
    checkoutFields: defaultCheckoutFields,
    upsellSettings: formState.editedData.upsell,
    affiliateSettings: formState.editedData.affiliate,
    loading,
    saving,
    hasUnsavedChanges,
    updateSettingsModified,
    updateGeneralModified,
    updateUpsellModified,
    resetDirtySources,
    updateProduct,
    updateProductBulk,
    updatePaymentSettings: () => {}, // Legacy no-op
    updateCheckoutFields: () => {}, // Legacy no-op
    updateUpsellSettings: settingsAdapter.updateUpsellSettings,
    updateAffiliateSettings: settingsAdapter.updateAffiliateSettings,
    saveProduct,
    savePaymentSettings: async () => {}, // Legacy no-op
    saveCheckoutFields: async () => {}, // Legacy no-op
    saveUpsellSettings,
    saveAffiliateSettings,
    saveAll,
    refreshProduct: core.refreshProduct,
    refreshOffers: entities.refreshOffers,
    refreshOrderBumps: entities.refreshOrderBumps,
    refreshCheckouts: checkoutsHook.refreshCheckouts,
    refreshCoupons: entities.refreshCoupons,
    refreshPaymentLinks: checkoutsHook.refreshPaymentLinks,
    refreshAll,
    deleteProduct: core.deleteProduct,
    formState,
    formDispatch,
    dispatchForm: formDispatch,
    formErrors: formState.validation,
    validateGeneralForm: () => validateGeneralForm(formState.editedData.general).isValid,
    generalForm: formState.editedData.general,
    imageState: formState.editedData.image,
    localOffers: formState.editedData.offers.localOffers,
    checkoutSettingsForm: formState.editedData.checkoutSettings,
    checkoutCredentials,
    updateGeneralField,
    updateImageState,
    updateLocalOffers,
    markOfferDeleted,
    setOffersModified,
    updateCheckoutSettingsField,
    initCheckoutSettings: initCheckoutSettingsHandler,
  };

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
}

// ============================================================================
// HOOK CUSTOMIZADO
// ============================================================================

export function useProductContext() {
  const context = useContext(ProductContext);

  if (!context) {
    throw new Error(
      "useProductContext must be used within a ProductProvider. " +
      "Wrap your component tree with <ProductProvider>."
    );
  }

  return context;
}
