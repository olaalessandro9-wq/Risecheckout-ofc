/**
 * useSettingsHandlerRegistration - Registra handlers de Settings no Save Registry
 * 
 * Extraído do ProductContext para manter < 300 linhas.
 * Segue padrão de hooks especializados do módulo.
 * 
 * Responsabilidades:
 * - Registrar handler de Upsell (order: 30)
 * - Registrar handler de Affiliate (order: 40)
 * - Cleanup automático no unmount
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Regra de 300 linhas
 */

import { useEffect } from "react";
import type { RegisterSaveHandler } from "../../types/saveRegistry.types";
import type { UpsellSettings, AffiliateSettings } from "../../types/product.types";

// ============================================================================
// TYPES
// ============================================================================

interface UseSettingsHandlerRegistrationOptions {
  /** ID do produto (null se não selecionado) */
  productId: string | null;
  /** ID do usuário autenticado */
  userId: string | undefined;
  /** Função para registrar handlers no Save Registry */
  registerSaveHandler: RegisterSaveHandler;
  /** Configurações atuais de upsell */
  upsellSettings: UpsellSettings;
  /** Configurações atuais de afiliados */
  affiliateSettings: AffiliateSettings | null;
  /** Função para salvar upsell settings */
  saveUpsellSettings: (settings: UpsellSettings) => Promise<void>;
  /** Função para salvar affiliate settings */
  saveAffiliateSettings: (settings: AffiliateSettings | null) => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook que registra handlers de Upsell e Affiliate no Save Registry.
 * 
 * Executado automaticamente quando productId e userId estão disponíveis.
 * Faz cleanup automático no unmount ou quando dependências mudam.
 */
export function useSettingsHandlerRegistration({
  productId,
  userId,
  registerSaveHandler,
  upsellSettings,
  affiliateSettings,
  saveUpsellSettings,
  saveAffiliateSettings,
}: UseSettingsHandlerRegistrationOptions): void {
  
  useEffect(() => {
    // Early return se não há produto ou usuário
    if (!productId || !userId) return;

    // Registrar handler de Upsell (order: 30)
    const unregisterUpsell = registerSaveHandler(
      'upsell',
      async () => {
        await saveUpsellSettings(upsellSettings);
      },
      { 
        order: 30,
        tabKey: 'upsell',
      }
    );

    // Registrar handler de Affiliate (order: 40)
    const unregisterAffiliate = registerSaveHandler(
      'affiliate',
      async () => {
        await saveAffiliateSettings(affiliateSettings);
      },
      { 
        order: 40,
        tabKey: 'afiliados',
      }
    );

    // Cleanup: remover handlers quando dependências mudam ou unmount
    return () => {
      unregisterUpsell();
      unregisterAffiliate();
    };
  }, [
    productId,
    userId,
    registerSaveHandler,
    upsellSettings,
    affiliateSettings,
    saveUpsellSettings,
    saveAffiliateSettings,
  ]);
}
