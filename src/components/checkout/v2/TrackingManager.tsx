/**
 * Componente: TrackingManager
 * 
 * Responsabilidade Única: Renderizar todos os scripts de tracking (pixels)
 * de forma centralizada e isolada.
 * 
 * Este é um componente "invisível" que não renderiza nada visível na UI,
 * apenas injeta os scripts de tracking no DOM.
 */

import React from "react";
import * as Facebook from "@/integrations/tracking/facebook";
import * as UTMify from "@/integrations/tracking/utmify";
import * as GoogleAds from "@/integrations/tracking/google-ads";
import * as TikTok from "@/integrations/tracking/tiktok";
import * as Kwai from "@/integrations/tracking/kwai";

// ============================================================================
// INTERFACE
// ============================================================================

interface TrackingManagerProps {
  productId: string | null;
  fbConfig?: any;
  utmifyConfig?: any;
  googleAdsIntegration?: any;
  tiktokIntegration?: any;
  kwaiIntegration?: any;
}

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Gerenciador de scripts de tracking.
 * 
 * Renderiza os pixels de tracking apenas se estiverem configurados
 * e ativos para o produto atual.
 * 
 * ✅ SEGURANÇA: vendorId não é mais exposto ao cliente.
 * O backend resolve o vendor internamente quando necessário.
 * 
 * @param props - Configurações de tracking
 * 
 * @example
 * <TrackingManager
 *   productId="product-456"
 *   fbConfig={fbConfig}
 *   googleAdsIntegration={googleAdsIntegration}
 *   tiktokIntegration={tiktokIntegration}
 *   kwaiIntegration={kwaiIntegration}
 *   utmifyConfig={utmifyConfig}
 * />
 */
export const TrackingManager: React.FC<TrackingManagerProps> = ({
  productId,
  fbConfig,
  utmifyConfig,
  googleAdsIntegration,
  tiktokIntegration,
  kwaiIntegration,
}) => {
  return (
    <>
      {/* Facebook Pixel */}
      {Facebook.shouldRunPixel(fbConfig, productId) && <Facebook.Pixel config={fbConfig.config} />}

      {/* UTMify */}
      {UTMify.shouldRunUTMify(utmifyConfig, productId) && (
        <UTMify.Tracker integration={utmifyConfig} />
      )}

      {/* Google Ads */}
      {GoogleAds.shouldRunGoogleAds(googleAdsIntegration, productId) && (
        <GoogleAds.Tracker integration={googleAdsIntegration} />
      )}

      {/* TikTok Pixel */}
      {TikTok.shouldRunTikTok(tiktokIntegration, productId) && (
        <TikTok.Pixel config={tiktokIntegration.config} />
      )}

      {/* Kwai Pixel */}
      {Kwai.shouldRunKwai(kwaiIntegration, productId) && (
        <Kwai.Pixel config={kwaiIntegration.config} />
      )}
    </>
  );
};
