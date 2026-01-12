/**
 * useProductSettings - Gerenciamento de Configurações do Produto
 * 
 * Responsável por:
 * - Payment Settings
 * - Checkout Fields
 * - Upsell Settings
 * - Affiliate Settings
 * 
 * MIGRADO: Todas operações de escrita via Edge Function product-management
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
  // SAVES VIA EDGE FUNCTION
  // ---------------------------------------------------------------------------

  const savePaymentSettings = useCallback(async () => {
    if (!productId || !userId) {
      toast.error("Produto não encontrado");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('product-management', {
        body: {
          action: 'update-settings',
          productId,
          settingsType: 'payment',
          settings: {
            defaultPaymentMethod: paymentSettings.defaultPaymentMethod,
            pixEnabled: paymentSettings.pixEnabled,
            creditCardEnabled: paymentSettings.creditCardEnabled,
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

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
      const { data, error } = await supabase.functions.invoke('product-management', {
        body: {
          action: 'update-settings',
          productId,
          settingsType: 'checkout_fields',
          settings: {
            name: checkoutFields.fullName,
            email: checkoutFields.email,
            phone: checkoutFields.phone,
            cpf: checkoutFields.cpf,
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

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

        const { data, error } = await supabase.functions.invoke('product-management', {
          body: {
            action: 'update-settings',
            productId,
            settingsType: 'upsell',
            settings,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

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

        const { data, error } = await supabase.functions.invoke('product-management', {
          body: {
            action: 'update-settings',
            productId,
            settingsType: 'affiliate',
            settings,
            previousShowInMarketplace: affiliateSettings?.showInMarketplace || false,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

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
