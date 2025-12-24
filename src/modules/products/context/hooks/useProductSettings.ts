/**
 * useProductSettings - Gerenciamento de Configurações do Produto
 * 
 * Responsável por:
 * - Payment Settings
 * - Checkout Fields
 * - Upsell Settings
 * - Affiliate Settings
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type {
  PaymentSettings,
  CheckoutFields,
  UpsellSettings,
  AffiliateSettings,
} from "../../types/product.types";

interface UseProductSettingsOptions {
  productId: string | null;
  userId: string | undefined;
  onUnsavedChange: () => void;
  onSaveComplete: () => void;
}

interface UseProductSettingsReturn {
  // Estados
  paymentSettings: PaymentSettings;
  checkoutFields: CheckoutFields;
  upsellSettings: UpsellSettings;
  affiliateSettings: AffiliateSettings | null;
  
  // Setters (para inicialização via refreshProduct)
  setUpsellSettings: React.Dispatch<React.SetStateAction<UpsellSettings>>;
  setAffiliateSettings: React.Dispatch<React.SetStateAction<AffiliateSettings | null>>;
  
  // Updates
  updatePaymentSettings: (settings: Partial<PaymentSettings>) => void;
  updateCheckoutFields: (fields: Partial<CheckoutFields>) => void;
  updateUpsellSettings: (settings: Partial<UpsellSettings>) => void;
  updateAffiliateSettings: (settings: Partial<AffiliateSettings>) => void;
  
  // Saves
  savePaymentSettings: () => Promise<void>;
  saveCheckoutFields: () => Promise<void>;
  saveUpsellSettings: (settings?: UpsellSettings) => Promise<void>;
  saveAffiliateSettings: (settings?: AffiliateSettings | null) => Promise<void>;
}

// Valores padrão
const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  pixEnabled: true,
  creditCardEnabled: true,
  defaultPaymentMethod: "credit_card",
};

const DEFAULT_CHECKOUT_FIELDS: CheckoutFields = {
  fullName: true,
  phone: true,
  email: true,
  cpf: false,
};

const DEFAULT_UPSELL_SETTINGS: UpsellSettings = {
  hasCustomThankYouPage: false,
  customPageUrl: "",
  redirectIgnoringOrderBumpFailures: false,
};

export function useProductSettings({
  productId,
  userId,
  onUnsavedChange,
  onSaveComplete,
}: UseProductSettingsOptions): UseProductSettingsReturn {
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(
    DEFAULT_PAYMENT_SETTINGS
  );
  const [checkoutFields, setCheckoutFields] = useState<CheckoutFields>(
    DEFAULT_CHECKOUT_FIELDS
  );
  const [upsellSettings, setUpsellSettings] = useState<UpsellSettings>(
    DEFAULT_UPSELL_SETTINGS
  );
  const [affiliateSettings, setAffiliateSettings] =
    useState<AffiliateSettings | null>(null);

  // ---------------------------------------------------------------------------
  // UPDATES LOCAIS
  // ---------------------------------------------------------------------------

  const updatePaymentSettings = useCallback(
    (settings: Partial<PaymentSettings>) => {
      setPaymentSettings((prev) => ({ ...prev, ...settings }));
      onUnsavedChange();
    },
    [onUnsavedChange]
  );

  const updateCheckoutFields = useCallback(
    (fields: Partial<CheckoutFields>) => {
      setCheckoutFields((prev) => ({ ...prev, ...fields }));
      onUnsavedChange();
    },
    [onUnsavedChange]
  );

  const updateUpsellSettings = useCallback(
    (settings: Partial<UpsellSettings>) => {
      setUpsellSettings((prev) => ({ ...prev, ...settings }));
      onUnsavedChange();
    },
    [onUnsavedChange]
  );

  const updateAffiliateSettings = useCallback(
    (settings: Partial<AffiliateSettings>) => {
      setAffiliateSettings((prev) => {
        if (!prev) return { ...settings } as AffiliateSettings;
        return { ...prev, ...settings };
      });
      onUnsavedChange();
    },
    [onUnsavedChange]
  );

  // ---------------------------------------------------------------------------
  // SAVES
  // ---------------------------------------------------------------------------

  const savePaymentSettings = useCallback(async () => {
    if (!productId || !userId) {
      toast.error("Produto não encontrado");
      return;
    }

    try {
      // Buscar checkouts do produto para atualizar configurações de pagamento
      const { data: checkouts, error: fetchError } = await supabase
        .from("checkouts")
        .select("id")
        .eq("product_id", productId);

      if (fetchError) throw fetchError;

      if (checkouts?.length) {
        // Atualizar configurações de pagamento em todos os checkouts
        const { error } = await supabase
          .from("checkouts")
          .update({
            // Mapear para campos do banco (se existirem)
            // Por ora, salvamos via default_payment_method no products
          })
          .in("id", checkouts.map(c => c.id));

        if (error) throw error;
      }

      // Atualizar default_payment_method no produto
      const { error: productError } = await supabase
        .from("products")
        .update({
          default_payment_method: paymentSettings.defaultPaymentMethod,
        })
        .eq("id", productId)
        .eq("user_id", userId);

      if (productError) throw productError;

      onSaveComplete();
    } catch (error: any) {
      console.error("[useProductSettings] Error saving payment settings:", error);
      throw error;
    }
  }, [paymentSettings, productId, userId, onSaveComplete]);

  const saveCheckoutFields = useCallback(async () => {
    if (!productId || !userId) {
      toast.error("Produto não encontrado");
      return;
    }

    try {
      // Salvar required_fields no produto
      const { error } = await supabase
        .from("products")
        .update({
          required_fields: {
            name: checkoutFields.fullName,
            email: checkoutFields.email,
            phone: checkoutFields.phone,
            cpf: checkoutFields.cpf,
          },
        })
        .eq("id", productId)
        .eq("user_id", userId);

      if (error) throw error;

      onSaveComplete();
    } catch (error: any) {
      console.error("[useProductSettings] Error saving checkout fields:", error);
      throw error;
    }
  }, [checkoutFields, productId, userId, onSaveComplete]);

  const saveUpsellSettings = useCallback(
    async (settingsToSave?: UpsellSettings) => {
      if (!productId || !userId) {
        toast.error("Produto não encontrado");
        return;
      }

      const settings = settingsToSave || upsellSettings;

      try {
        console.log("[useProductSettings] Salvando upsell_settings:", settings);

        const { error } = await supabase
          .from("products")
          .update({
            upsell_settings: settings as any,
          })
          .eq("id", productId)
          .eq("user_id", userId);

        if (error) throw error;

        console.log("[useProductSettings] upsell_settings salvo com sucesso!");

        setUpsellSettings(settings);
        onSaveComplete();
      } catch (error: any) {
        console.error("[useProductSettings] Error saving upsell settings:", error);
        throw error;
      }
    },
    [upsellSettings, productId, userId, onSaveComplete]
  );

  const saveAffiliateSettings = useCallback(
    async (settingsToSave?: AffiliateSettings | null) => {
      if (!productId || !userId) {
        toast.error("Produto não encontrado");
        return;
      }

      const settings = settingsToSave || affiliateSettings;

      try {
        console.log("[useProductSettings] Salvando affiliate_settings:", settings);

        // Preparar update data
        const updateData: any = {
          affiliate_settings: settings as any,
          // Campos diretos de marketplace
          show_in_marketplace: settings?.showInMarketplace || false,
          marketplace_description: settings?.marketplaceDescription || null,
          marketplace_category: settings?.marketplaceCategory || null,
        };

        // Se estiver ativando marketplace pela primeira vez, definir marketplace_enabled_at
        if (settings?.showInMarketplace && !affiliateSettings?.showInMarketplace) {
          updateData.marketplace_enabled_at = new Date().toISOString();
        }

        // Se estiver desativando marketplace, limpar marketplace_enabled_at
        if (!settings?.showInMarketplace && affiliateSettings?.showInMarketplace) {
          updateData.marketplace_enabled_at = null;
        }

        const { error } = await supabase
          .from("products")
          .update(updateData)
          .eq("id", productId)
          .eq("user_id", userId);

        if (error) throw error;

        console.log("[useProductSettings] affiliate_settings salvo com sucesso!");

        setAffiliateSettings(settings);
        onSaveComplete();
      } catch (error: any) {
        console.error("[useProductSettings] Error saving affiliate settings:", error);
        throw error;
      }
    },
    [affiliateSettings, productId, userId, onSaveComplete]
  );

  return {
    // Estados
    paymentSettings,
    checkoutFields,
    upsellSettings,
    affiliateSettings,

    // Setters
    setUpsellSettings,
    setAffiliateSettings,

    // Updates
    updatePaymentSettings,
    updateCheckoutFields,
    updateUpsellSettings,
    updateAffiliateSettings,

    // Saves
    savePaymentSettings,
    saveCheckoutFields,
    saveUpsellSettings,
    saveAffiliateSettings,
  };
}
