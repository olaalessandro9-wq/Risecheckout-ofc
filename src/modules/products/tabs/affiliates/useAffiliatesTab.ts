/**
 * useAffiliatesTab - Hook de lógica para AffiliatesTab
 * 
 * Refatorado para XState State Machine:
 * - Encapsula toda lógica de negócio, handlers e side effects.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - XState 10.0/10
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { useProductContext } from "../../context/ProductContext";
import type { AffiliateSettings } from "../../types/product.types";
import type { AffiliateGatewaySettingsData } from "../../components/AffiliateGatewaySettings";
import type { AffiliateSettingValue } from "./types";
import { createLogger } from "@/lib/logger";

const log = createLogger("useAffiliatesTab");

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const DEFAULT_AFFILIATE_SETTINGS: AffiliateSettings = {
  enabled: false,
  defaultRate: 30,
  cookieDuration: 30,
  attributionModel: "last_click",
  requireApproval: true,
  commissionOnOrderBump: false,
  commissionOnUpsell: false,
  supportEmail: "",
  publicDescription: "",
  showInMarketplace: false,
  marketplaceDescription: "",
  marketplaceCategory: "",
};

const DEFAULT_GATEWAY_SETTINGS: AffiliateGatewaySettingsData = {
  pix_allowed: ["asaas"],
  credit_card_allowed: ["mercadopago", "stripe"],
  require_gateway_connection: true,
};

// ============================================================================
// HOOK
// ============================================================================

export function useAffiliatesTab() {
  const { 
    product, 
    formState,
    dispatchForm,
    saveAffiliateSettings,
    saving
  } = useProductContext();

  // ---------------------------------------------------------------------------
  // DERIVED STATE FROM STATE MACHINE
  // ---------------------------------------------------------------------------

  const localSettings = useMemo(() => {
    return formState.editedData.affiliate ?? DEFAULT_AFFILIATE_SETTINGS;
  }, [formState.editedData.affiliate]);

  const serverSettings = useMemo(() => {
    return formState.serverData.affiliateSettings ?? DEFAULT_AFFILIATE_SETTINGS;
  }, [formState.serverData.affiliateSettings]);

  // ---------------------------------------------------------------------------
  // LOCAL STATE (Gateway Settings - ainda não migrado para state machine)
  // ---------------------------------------------------------------------------

  const [gatewaySettings, setGatewaySettings] = useState<AffiliateGatewaySettingsData>(DEFAULT_GATEWAY_SETTINGS);
  const [gatewaySnapshot, setGatewaySnapshot] = useState<string>("");

  useEffect(() => {
    if (product?.id && gatewaySnapshot === "") {
      setGatewaySnapshot(JSON.stringify(gatewaySettings));
    }
  }, [product?.id, gatewaySnapshot, gatewaySettings]);

  // ---------------------------------------------------------------------------
  // CHANGE DETECTION
  // ---------------------------------------------------------------------------

  const hasAffiliateChanges = formState.dirtyFlags?.affiliate ?? false;
  const hasGatewayChanges = JSON.stringify(gatewaySettings) !== gatewaySnapshot;
  const hasChanges = hasAffiliateChanges || hasGatewayChanges;

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  const handleChange = useCallback((field: keyof AffiliateSettings, value: AffiliateSettingValue) => {
    dispatchForm({ type: "EDIT_AFFILIATE", payload: { [field]: value } });
  }, [dispatchForm]);

  const handleGatewaySettingsChange = useCallback((settings: AffiliateGatewaySettingsData) => {
    setGatewaySettings(settings);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      // Validações
      if (localSettings.defaultRate < 1 || localSettings.defaultRate > 90) {
        toast.error("A comissão deve estar entre 1% e 90%");
        return;
      }

      if (localSettings.cookieDuration < 1 || localSettings.cookieDuration > 365) {
        toast.error("A duração do cookie deve estar entre 1 e 365 dias");
        return;
      }

      if (localSettings.supportEmail && localSettings.supportEmail.trim() !== "") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(localSettings.supportEmail)) {
          toast.error("Por favor, insira um e-mail válido no formato: exemplo@dominio.com");
          return;
        }
      }

      if (localSettings.showInMarketplace) {
        if (!localSettings.marketplaceDescription || localSettings.marketplaceDescription.trim() === "") {
          toast.error("Por favor, adicione uma descrição para o marketplace");
          return;
        }

        if (localSettings.marketplaceDescription.length < 50) {
          toast.error("A descrição do marketplace deve ter pelo menos 50 caracteres");
          return;
        }

        if (localSettings.marketplaceDescription.length > 500) {
          toast.error("A descrição do marketplace deve ter no máximo 500 caracteres");
          return;
        }

        if (!localSettings.marketplaceCategory) {
          toast.error("Por favor, selecione uma categoria para o marketplace");
          return;
        }
      }

      const { api } = await import("@/lib/api");
      
      const { data: result, error: gatewayError } = await api.call<{ success?: boolean; error?: string }>('product-settings', { 
        action: 'update-affiliate-gateway-settings',
        productId: product?.id,
        gatewaySettings,
      });
      
      if (gatewayError || !result?.success) {
        throw new Error(result?.error || gatewayError?.message || "Erro ao salvar gateway settings");
      }

      await saveAffiliateSettings();
      
      setGatewaySnapshot(JSON.stringify(gatewaySettings));
      
      // Dispatch SAVE_SUCCESS to transition machine back to pristine
      dispatchForm({ type: "SAVE_SUCCESS" });
      
      toast.success("Configurações de afiliados salvas com sucesso");
    } catch (error: unknown) {
      log.error("Erro ao salvar afiliados:", error);
      toast.error("Não foi possível salvar as configurações");
    }
  }, [localSettings, gatewaySettings, product?.id, saveAffiliateSettings, dispatchForm]);

  return {
    product,
    localSettings,
    serverSettings,
    gatewaySettings,
    hasChanges,
    saving,
    handleChange,
    handleGatewaySettingsChange,
    handleSave,
  };
}
