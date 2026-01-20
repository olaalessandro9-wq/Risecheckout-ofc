/**
 * useProductSettings - Adapter para Saves de Configurações
 * 
 * REFATORADO: Zero estado local (useState removidos)
 * Agora é um adapter puro que:
 * - Recebe dados da State Machine (Single Source of Truth)
 * - Executa saves via Edge Function
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - XState State Machine Edition
 */

import { useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";
import type {
  UpsellSettings,
  AffiliateSettings,
} from "../../types/product.types";

const log = createLogger('ProductSettings');

// ============================================================================
// TYPES
// ============================================================================

interface ProductSettingsResponse {
  success?: boolean;
  error?: string;
}

interface UseProductSettingsOptions {
  productId: string | null;
  userId: string | undefined;
  
  // Dados vêm da State Machine (Single Source of Truth)
  upsellSettings: UpsellSettings;
  affiliateSettings: AffiliateSettings | null;
  
  // Callbacks para atualizar a State Machine
  onUpdateUpsell: (settings: Partial<UpsellSettings>) => void;
  onUpdateAffiliate: (settings: Partial<AffiliateSettings>) => void;
}

interface UseProductSettingsReturn {
  // Funções de Save (operações de API)
  saveUpsellSettings: (settings?: UpsellSettings) => Promise<void>;
  saveAffiliateSettings: (settings?: AffiliateSettings | null) => Promise<void>;
  
  // Updates que delegam à State Machine
  updateUpsellSettings: (settings: Partial<UpsellSettings>) => void;
  updateAffiliateSettings: (settings: Partial<AffiliateSettings>) => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useProductSettings({
  productId,
  userId,
  upsellSettings,
  affiliateSettings,
  onUpdateUpsell,
  onUpdateAffiliate,
}: UseProductSettingsOptions): UseProductSettingsReturn {

  // ---------------------------------------------------------------------------
  // UPDATES (delegam à State Machine via callbacks)
  // ---------------------------------------------------------------------------

  const updateUpsellSettings = useCallback(
    (settings: Partial<UpsellSettings>) => {
      onUpdateUpsell(settings);
    },
    [onUpdateUpsell]
  );

  const updateAffiliateSettings = useCallback(
    (settings: Partial<AffiliateSettings>) => {
      onUpdateAffiliate(settings);
    },
    [onUpdateAffiliate]
  );

  // ---------------------------------------------------------------------------
  // SAVES VIA EDGE FUNCTION
  // ---------------------------------------------------------------------------

  const saveUpsellSettings = useCallback(
    async (settingsToSave?: UpsellSettings) => {
      if (!productId || !userId) {
        toast.error("Produto não encontrado");
        return;
      }

      // Usa dados passados ou os da State Machine
      const settings = settingsToSave || upsellSettings;

      try {
        log.debug('Salvando upsell_settings', settings);

        // ✅ RISE V3: Use dedicated action for upsell_settings JSONB column
        const { data, error } = await api.call<ProductSettingsResponse>('product-settings', {
          action: 'update-upsell-settings',
          productId,
          upsellSettings: settings,
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        log.info('upsell_settings salvo com sucesso');
      } catch (error: unknown) {
        log.error('Erro ao salvar upsell settings', error);
        throw error;
      }
    },
    [upsellSettings, productId, userId]
  );

  const saveAffiliateSettings = useCallback(
    async (settingsToSave?: AffiliateSettings | null) => {
      if (!productId || !userId) {
        toast.error("Produto não encontrado");
        return;
      }

      // Usa dados passados ou os da State Machine
      const settings = settingsToSave || affiliateSettings;

      try {
        log.debug('Salvando affiliate_settings', settings);

        const { data, error } = await api.call<ProductSettingsResponse>('product-settings', {
          action: 'update-settings',
          productId,
          settingsType: 'affiliate',
          settings,
          previousShowInMarketplace: affiliateSettings?.showInMarketplace || false,
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        log.info('affiliate_settings salvo com sucesso');
      } catch (error: unknown) {
        log.error('Erro ao salvar affiliate settings', error);
        throw error;
      }
    },
    [affiliateSettings, productId, userId]
  );

  return {
    // Updates (delegam à State Machine)
    updateUpsellSettings,
    updateAffiliateSettings,

    // Saves (operações de API)
    saveUpsellSettings,
    saveAffiliateSettings,
  };
}

// Alias for backward compatibility
export { useProductSettings as useProductSettingsAdapter };
