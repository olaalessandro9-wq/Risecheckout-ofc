/**
 * ProductContext - Orquestrador do Sistema de Edição de Produtos
 * 
 * Este contexto é um ORQUESTRADOR PURO que compõe hooks especializados:
 * - useProductCore: Produto principal + extração de settings
 * - useProductEntities: Ofertas, Order Bumps, Cupons
 * - useProductCheckouts: Checkouts, Payment Links
 * - useProductSettings: Configurações (Payment, Fields, Upsell, Affiliate)
 * 
 * Benefícios da refatoração:
 * - Arquivos menores e focados (Single Responsibility)
 * - Testabilidade melhorada
 * - Manutenção simplificada
 * - Zero breaking changes na API pública
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { ProductContextState, ProductProviderProps } from "../types/product.types";

// Hooks especializados
import {
  useProductCore,
  useProductEntities,
  useProductCheckouts,
  useProductSettings,
} from "./hooks";

// ============================================================================
// CONTEXTO
// ============================================================================

const ProductContext = createContext<ProductContextState | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export function ProductProvider({ productId, children }: ProductProviderProps) {
  const { user } = useAuth();

  // ---------------------------------------------------------------------------
  // ESTADOS DE UI
  // ---------------------------------------------------------------------------

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estado de alterações pendentes por "fonte"
  const [dirtySources, setDirtySources] = useState({
    general: false,
    settings: false,
    core: false,
    upsell: false,
  });

  const hasUnsavedChanges =
    dirtySources.general || dirtySources.settings || dirtySources.core || dirtySources.upsell;

  // ---------------------------------------------------------------------------
  // CALLBACKS MEMOIZADOS
  // ---------------------------------------------------------------------------

  const markCoreUnsaved = useCallback(
    () => setDirtySources((prev) => ({ ...prev, core: true })),
    []
  );

  const markCoreSaved = useCallback(
    () => setDirtySources((prev) => ({ ...prev, core: false })),
    []
  );

  const markSettingsUnsaved = useCallback(
    () => setDirtySources((prev) => ({ ...prev, settings: true })),
    []
  );

  const markSettingsSaved = useCallback(
    () => setDirtySources((prev) => ({ ...prev, settings: false })),
    []
  );

  const updateGeneralModified = useCallback(
    (modified: boolean) => setDirtySources((prev) => ({ ...prev, general: modified })),
    []
  );

  const updateSettingsModified = useCallback(
    (modified: boolean) => setDirtySources((prev) => ({ ...prev, settings: modified })),
    []
  );

  const updateUpsellModified = useCallback(
    (modified: boolean) => setDirtySources((prev) => ({ ...prev, upsell: modified })),
    []
  );

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
    onUpsellSettingsLoaded: settings.setUpsellSettings,
    onAffiliateSettingsLoaded: settings.setAffiliateSettings,
  });

  const entities = useProductEntities({
    productId,
  });

  const checkoutsHook = useProductCheckouts({
    productId,
  });

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
  // SAVE WRAPPERS (com estado saving)
  // ---------------------------------------------------------------------------

  const saveProduct = useCallback(async () => {
    setSaving(true);
    try {
      await core.saveProduct();
      markCoreSaved();
    } finally {
      setSaving(false);
    }
  }, [core, markCoreSaved]);

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
      await Promise.all([
        core.saveProduct(),
        settings.savePaymentSettings(),
        settings.saveCheckoutFields(),
        settings.saveUpsellSettings(),
        settings.saveAffiliateSettings(),
      ]);
      toast.success("Todas as alterações foram salvas");
      setDirtySources({ general: false, settings: false, core: false, upsell: false });
    } catch (error: unknown) {
      console.error("[ProductContext] Error saving all:", error);
      toast.error("Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  }, [core, settings]);

  // ---------------------------------------------------------------------------
  // VALOR DO CONTEXTO (API PÚBLICA - INALTERADA)
  // ---------------------------------------------------------------------------

  const contextValue: ProductContextState = {
    // Dados
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

    // Funções de atualização
    updateProduct: core.updateProduct,
    updateProductBulk: core.updateProductBulk,
    updatePaymentSettings: settings.updatePaymentSettings,
    updateCheckoutFields: settings.updateCheckoutFields,
    updateUpsellSettings: settings.updateUpsellSettings,
    updateAffiliateSettings: settings.updateAffiliateSettings,

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
