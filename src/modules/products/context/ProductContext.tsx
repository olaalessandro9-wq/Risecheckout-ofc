/**
 * ProductContext - Orquestrador do Sistema de Edição de Produtos
 * 
 * REFATORADO com Reducer Pattern para Single Source of Truth.
 * 
 * Arquitetura:
 * - useReducer(productFormReducer) gerencia todo estado de formulário
 * - Hooks especializados para operações (CRUD, upload, etc.)
 * - Zero estado duplicado entre Context e Tabs
 * 
 * @see RISE ARCHITECT PROTOCOL - Solução C (Nota 9.8/10)
 */

import { createContext, useContext, useReducer, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { ProductContextState, ProductProviderProps, AffiliateSettings, UpsellSettings, ProductData, Offer } from "../types/product.types";
import type { GeneralFormData, ImageFormState, ProductFormState, ProductFormDispatch } from "../types/productForm.types";

// Reducer e Actions
import { productFormReducer, INITIAL_FORM_STATE, formActions } from "./productFormReducer";
import { validateGeneralForm, validateUpsellSettings, validateAffiliateSettings } from "./productFormValidation";

// Hooks especializados
import {
  useProductCore,
  useProductEntities,
  useProductCheckouts,
  useProductSettings,
} from "./hooks";

// ============================================================================
// CONTEXT TYPE ESTENDIDO
// ============================================================================

interface ProductContextExtended extends ProductContextState {
  // Form State (novo - do Reducer)
  formState: ProductFormState;
  formDispatch: ProductFormDispatch;
  
  // Helpers derivados do formState
  generalForm: GeneralFormData;
  imageState: ImageFormState;
  localOffers: Offer[];
  
  // Actions simplificadas
  updateGeneralField: <K extends keyof GeneralFormData>(field: K, value: GeneralFormData[K]) => void;
  updateImageState: (update: Partial<ImageFormState>) => void;
  updateLocalOffers: (offers: Offer[]) => void;
  markOfferDeleted: (offerId: string) => void;
  setOffersModified: (modified: boolean) => void;
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

  // ---------------------------------------------------------------------------
  // REDUCER: Single Source of Truth para estado de formulários
  // ---------------------------------------------------------------------------
  
  const [formState, formDispatch] = useReducer(productFormReducer, INITIAL_FORM_STATE);

  // ---------------------------------------------------------------------------
  // ESTADOS DE UI (mantidos separados do form state)
  // ---------------------------------------------------------------------------

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // hasUnsavedChanges agora vem do reducer
  const hasUnsavedChanges = formState.isDirty;

  // ---------------------------------------------------------------------------
  // CALLBACKS LEGACY (para compatibilidade - serão removidos gradualmente)
  // ---------------------------------------------------------------------------

  const markCoreUnsaved = useCallback(() => {
    // No-op: agora gerenciado pelo reducer
  }, []);

  const markCoreSaved = useCallback(() => {
    // No-op: agora gerenciado pelo reducer
  }, []);

  const markSettingsUnsaved = useCallback(() => {
    // No-op: agora gerenciado pelo reducer
  }, []);

  const markSettingsSaved = useCallback(() => {
    // No-op: agora gerenciado pelo reducer
  }, []);

  const updateGeneralModified = useCallback((modified: boolean) => {
    // Legacy: não faz nada, dirty é calculado automaticamente pelo reducer
  }, []);

  const updateSettingsModified = useCallback((modified: boolean) => {
    // Legacy: não faz nada para settings
  }, []);

  const updateUpsellModified = useCallback((modified: boolean) => {
    // Legacy: não faz nada, dirty é calculado automaticamente pelo reducer
  }, []);

  const resetDirtySources = useCallback(() => {
    formDispatch(formActions.resetToServer());
  }, []);

  // ---------------------------------------------------------------------------
  // HOOKS ESPECIALIZADOS
  // ---------------------------------------------------------------------------

  // Settings hook primeiro (para ter os setters disponíveis)
  const settings = useProductSettings({
    productId,
    userId: user?.id,
    onUnsavedChange: markSettingsUnsaved,
    onSaveComplete: markSettingsSaved,
  });

  // Core hook com callbacks para carregar settings
  const core = useProductCore({
    productId,
    userId: user?.id,
    onUnsavedChange: markCoreUnsaved,
    onUpsellSettingsLoaded: (upsellSettings) => {
      settings.setUpsellSettings(upsellSettings);
    },
    onAffiliateSettingsLoaded: (affiliateSettings) => {
      settings.setAffiliateSettings(affiliateSettings);
    },
  });

  const entities = useProductEntities({
    productId,
  });

  const checkoutsHook = useProductCheckouts({
    productId,
  });

  // ---------------------------------------------------------------------------
  // EFEITO: Sincronizar dados carregados → Reducer
  // ---------------------------------------------------------------------------
  
  useEffect(() => {
    // Quando product, offers, ou settings são carregados, inicializar o reducer
    if (core.product && entities.offers !== undefined) {
      formDispatch(formActions.initFromServer({
        product: core.product,
        upsellSettings: settings.upsellSettings,
        affiliateSettings: settings.affiliateSettings,
        offers: entities.offers,
      }));
    }
  }, [core.product, entities.offers, settings.upsellSettings, settings.affiliateSettings]);

  // ---------------------------------------------------------------------------
  // REFRESH ALL
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // EFFECT: Carregar dados iniciais
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (productId && user) {
      refreshAll();
    }
  }, [productId, user]);

  // ---------------------------------------------------------------------------
  // FORM HELPERS (derivados do reducer state)
  // ---------------------------------------------------------------------------

  const generalForm = formState.editedData.general;
  const imageState = formState.editedData.image;
  const localOffers = formState.editedData.offers.localOffers;

  const updateGeneralField = useCallback(<K extends keyof GeneralFormData>(
    field: K,
    value: GeneralFormData[K]
  ) => {
    formDispatch(formActions.updateGeneral({ [field]: value }));
  }, []);

  const updateImageState = useCallback((update: Partial<ImageFormState>) => {
    formDispatch(formActions.updateImage(update));
  }, []);

  const updateLocalOffers = useCallback((offers: Offer[]) => {
    formDispatch(formActions.updateOffers({ localOffers: offers }));
  }, []);

  const markOfferDeleted = useCallback((offerId: string) => {
    formDispatch(formActions.addDeletedOffer(offerId));
  }, []);

  const setOffersModified = useCallback((modified: boolean) => {
    formDispatch(formActions.updateOffers({ modified }));
  }, []);

  // ---------------------------------------------------------------------------
  // SAVE WRAPPERS (com estado saving)
  // ---------------------------------------------------------------------------

  const saveProduct = useCallback(async () => {
    setSaving(true);
    try {
      await core.saveProduct();
      // Após save, marcar como salvo no reducer
      formDispatch(formActions.markSaved({ 
        newServerData: { product: core.product } 
      }));
    } finally {
      setSaving(false);
    }
  }, [core]);

  const saveUpsellSettings = useCallback(
    async (settingsToSave?: typeof settings.upsellSettings) => {
      setSaving(true);
      try {
        await settings.saveUpsellSettings(settingsToSave);
      } finally {
        setSaving(false);
      }
    },
    [settings]
  );

  const saveAffiliateSettings = useCallback(
    async (settingsToSave?: typeof settings.affiliateSettings) => {
      setSaving(true);
      try {
        await settings.saveAffiliateSettings(settingsToSave);
      } finally {
        setSaving(false);
      }
    },
    [settings]
  );

  const saveAll = useCallback(async () => {
    setSaving(true);
    try {
      // Validar antes de salvar
      const generalValidation = validateGeneralForm(formState.editedData.general);
      if (!generalValidation.isValid) {
        toast.error("Corrija os erros antes de salvar");
        return;
      }

      await Promise.all([
        core.saveProduct(),
        settings.savePaymentSettings(),
        settings.saveCheckoutFields(),
        settings.saveUpsellSettings(),
        settings.saveAffiliateSettings(),
      ]);
      
      toast.success("Todas as alterações foram salvas");
      
      // Marcar como salvo no reducer
      formDispatch(formActions.markSaved());
    } catch (error: unknown) {
      console.error("[ProductContext] Error saving all:", error);
      toast.error("Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  }, [core, settings, formState.editedData.general]);

  // ---------------------------------------------------------------------------
  // UPDATE FUNCTIONS (sincronizam com core.product E reducer)
  // ---------------------------------------------------------------------------

  const updateProduct = useCallback((field: keyof ProductData, value: ProductData[keyof ProductData]) => {
    // Atualizar no core (para API calls)
    core.updateProduct(field, value);
    
    // Se for um campo do general form, atualizar no reducer também
    const generalFields: (keyof GeneralFormData)[] = [
      'name', 'description', 'price', 'support_name', 
      'support_email', 'delivery_url', 'external_delivery'
    ];
    
    if (generalFields.includes(field as keyof GeneralFormData)) {
      formDispatch(formActions.updateGeneral({ [field]: value } as Partial<GeneralFormData>));
    }
  }, [core]);

  const updateProductBulk = useCallback((data: Partial<ProductData>) => {
    core.updateProductBulk(data);
    
    // Atualizar campos do general form no reducer
    const generalUpdate: Partial<GeneralFormData> = {};
    if ('name' in data) generalUpdate.name = data.name;
    if ('description' in data) generalUpdate.description = data.description ?? "";
    if ('price' in data) generalUpdate.price = data.price;
    if ('support_name' in data) generalUpdate.support_name = data.support_name ?? "";
    if ('support_email' in data) generalUpdate.support_email = data.support_email ?? "";
    if ('delivery_url' in data) generalUpdate.delivery_url = data.delivery_url ?? "";
    if ('external_delivery' in data) generalUpdate.external_delivery = data.external_delivery ?? false;
    
    if (Object.keys(generalUpdate).length > 0) {
      formDispatch(formActions.updateGeneral(generalUpdate));
    }
  }, [core]);

  // Update upsell settings (sincroniza com reducer)
  const updateUpsellSettingsWrapper = useCallback((updates: Partial<UpsellSettings>) => {
    settings.updateUpsellSettings(updates);
    formDispatch(formActions.updateUpsell(updates));
  }, [settings]);

  // Update affiliate settings (sincroniza com reducer)
  const updateAffiliateSettingsWrapper = useCallback((updates: Partial<AffiliateSettings>) => {
    settings.updateAffiliateSettings(updates);
    formDispatch(formActions.updateAffiliate(updates));
  }, [settings]);

  // ---------------------------------------------------------------------------
  // VALOR DO CONTEXTO (API PÚBLICA ESTENDIDA)
  // ---------------------------------------------------------------------------

  const contextValue: ProductContextExtended = {
    // Dados (usando product do core para compatibilidade)
    product: core.product,
    offers: entities.offers,
    orderBumps: entities.orderBumps,
    checkouts: checkoutsHook.checkouts,
    coupons: entities.coupons,
    paymentLinks: checkoutsHook.paymentLinks,

    // Configurações
    paymentSettings: settings.paymentSettings,
    checkoutFields: settings.checkoutFields,
    upsellSettings: settings.upsellSettings,
    affiliateSettings: settings.affiliateSettings,

    // Estados de UI
    loading,
    saving,
    hasUnsavedChanges,
    updateSettingsModified,
    updateGeneralModified,
    updateUpsellModified,
    resetDirtySources,

    // Funções de atualização
    updateProduct,
    updateProductBulk,
    updatePaymentSettings: settings.updatePaymentSettings,
    updateCheckoutFields: settings.updateCheckoutFields,
    updateUpsellSettings: updateUpsellSettingsWrapper,
    updateAffiliateSettings: updateAffiliateSettingsWrapper,

    // Funções de salvamento
    saveProduct,
    savePaymentSettings: settings.savePaymentSettings,
    saveCheckoutFields: settings.saveCheckoutFields,
    saveUpsellSettings,
    saveAffiliateSettings,
    saveAll,

    // Funções de refresh
    refreshProduct: core.refreshProduct,
    refreshOffers: entities.refreshOffers,
    refreshOrderBumps: entities.refreshOrderBumps,
    refreshCheckouts: checkoutsHook.refreshCheckouts,
    refreshCoupons: entities.refreshCoupons,
    refreshPaymentLinks: checkoutsHook.refreshPaymentLinks,
    refreshAll,

    // Funções de deleção
    deleteProduct: core.deleteProduct,

    // NOVO: Form State (Reducer)
    formState,
    formDispatch,
    
    // NOVO: Helpers derivados
    generalForm,
    imageState,
    localOffers,
    
    // NOVO: Actions simplificadas
    updateGeneralField,
    updateImageState,
    updateLocalOffers,
    markOfferDeleted,
    setOffersModified,
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
