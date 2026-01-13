/**
 * Componente: TrackingManager
 * 
 * Responsabilidade Única: Renderizar todos os scripts de tracking (pixels)
 * de forma centralizada e isolada.
 * 
 * ATUALIZADO: Agora suporta pixels vinculados ao produto via product_pixels.
 */

import React from "react";
import * as Facebook from "@/integrations/tracking/facebook";
import * as UTMify from "@/integrations/tracking/utmify";
import * as GoogleAds from "@/integrations/tracking/google-ads";
import * as TikTok from "@/integrations/tracking/tiktok";
import * as Kwai from "@/integrations/tracking/kwai";
import type { CheckoutPixel } from "@/hooks/checkout/useCheckoutProductPixels";

// ============================================================================
// INTERFACE
// ============================================================================

/**
 * Props do TrackingManager
 * 
 * NOTA: Os tipos legacy usam estruturas dinâmicas do banco de dados.
 * Uma tipagem estrita aqui quebraria a retrocompatibilidade.
 */
interface TrackingManagerProps {
  productId: string | null;
  // Legacy configs (deprecated - para retrocompatibilidade)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fbConfig?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  utmifyConfig?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  googleAdsIntegration?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tiktokIntegration?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  kwaiIntegration?: any;
  // New: Pixels vinculados ao produto
  productPixels?: CheckoutPixel[];
}

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Gerenciador de scripts de tracking.
 * 
 * Renderiza os pixels de tracking de duas formas:
 * 1. Legacy: via vendor_integrations (deprecated)
 * 2. New: via product_pixels (recomendado)
 * 
 * @param props - Configurações de tracking
 */
export const TrackingManager: React.FC<TrackingManagerProps> = ({
  productId,
  fbConfig,
  utmifyConfig,
  googleAdsIntegration,
  tiktokIntegration,
  kwaiIntegration,
  productPixels = [],
}) => {
  // Separar pixels por plataforma
  const facebookPixels = productPixels.filter(p => p.platform === 'facebook' && p.is_active);
  const tiktokPixels = productPixels.filter(p => p.platform === 'tiktok' && p.is_active);
  const googleAdsPixels = productPixels.filter(p => p.platform === 'google_ads' && p.is_active);
  const kwaiPixels = productPixels.filter(p => p.platform === 'kwai' && p.is_active);

  // Flag para saber se usamos o novo sistema
  const hasProductPixels = productPixels.length > 0;

  return (
    <>
      {/* ============ NOVO SISTEMA: product_pixels ============ */}
      
      {/* Facebook Pixels (novo) */}
      {facebookPixels.map((pixel) => (
        <Facebook.Pixel 
          key={`fb-product-${pixel.id}`}
          config={{ 
            pixel_id: pixel.pixel_id,
            enabled: true,
          }} 
        />
      ))}

      {/* TikTok Pixels (novo) */}
      {tiktokPixels.map((pixel) => (
        <TikTok.Pixel 
          key={`tt-product-${pixel.id}`}
          config={{ 
            id: pixel.id,
            vendor_id: '',
            active: true,
            config: {
              pixel_id: pixel.pixel_id,
              enabled: true,
            }
          }} 
        />
      ))}

      {/* Google Ads Pixels (novo) */}
      {googleAdsPixels.map((pixel) => (
        <GoogleAds.Tracker 
          key={`gads-product-${pixel.id}`}
          integration={{ 
            id: pixel.id,
            vendor_id: '',
            active: true,
            config: { 
              conversion_id: pixel.pixel_id,
              conversion_label: pixel.conversion_label || undefined,
              enabled: true,
            }
          }} 
        />
      ))}

      {/* Kwai Pixels (novo) */}
      {kwaiPixels.map((pixel) => (
        <Kwai.Pixel 
          key={`kwai-product-${pixel.id}`}
          config={{ 
            id: pixel.id,
            vendor_id: '',
            active: true,
            config: {
              pixel_id: pixel.pixel_id,
              enabled: true,
            }
          }} 
        />
      ))}

      {/* ========================================================================
       * LEGACY FALLBACK - SCHEDULED FOR REMOVAL
       * ========================================================================
       * 
       * Este bloco mantém retrocompatibilidade com o sistema antigo (vendor_integrations).
       * 
       * PLANO DE DEPRECIAÇÃO:
       * 1. Migration script executado em 2025-01 para converter dados existentes
       * 2. Prazo de observação: 30 dias após deploy (monitorar via logs)
       * 3. Data de remoção planejada: 2025-02-15
       * 
       * CRITÉRIOS PARA REMOÇÃO:
       * - [ ] Confirmar que todos os vendors migraram para product_pixels
       * - [ ] Zero uso do fallback em produção (verificar via console.warn abaixo)
       * - [ ] Remover props legacy: fbConfig, googleAdsIntegration, tiktokIntegration, kwaiIntegration
       * 
       * @deprecated Usar apenas productPixels via product_pixels table
       * ======================================================================== */}
      
      {!hasProductPixels && (fbConfig || tiktokIntegration || googleAdsIntegration || kwaiIntegration) && (
        <>
          {/* Log para monitorar uso do fallback legacy */}
          {console.warn('[TrackingManager] DEPRECATED: Using legacy vendor_integrations fallback. Migrate to product_pixels.')}
          
          {/* Facebook Pixel (legacy) */}
          {Facebook.shouldRunPixel(fbConfig, productId) && <Facebook.Pixel config={fbConfig.config} />}

          {/* TikTok Pixel (legacy) */}
          {TikTok.shouldRunTikTok(tiktokIntegration, productId) && (
            <TikTok.Pixel config={tiktokIntegration.config} />
          )}

          {/* Google Ads (legacy) */}
          {GoogleAds.shouldRunGoogleAds(googleAdsIntegration, productId) && (
            <GoogleAds.Tracker integration={googleAdsIntegration} />
          )}

          {/* Kwai Pixel (legacy) */}
          {Kwai.shouldRunKwai(kwaiIntegration, productId) && (
            <Kwai.Pixel config={kwaiIntegration.config} />
          )}
        </>
      )}

      {/* UTMify sempre roda via legacy (não tem product_pixels) */}
      {UTMify.shouldRunUTMify(utmifyConfig, productId) && (
        <UTMify.Tracker integration={utmifyConfig} />
      )}
    </>
  );
};
