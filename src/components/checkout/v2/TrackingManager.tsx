/**
 * Componente: TrackingManager
 * 
 * Responsabilidade Única: Renderizar todos os scripts de tracking (pixels)
 * de forma centralizada e isolada.
 * 
 * RISE Protocol V3: Usa product_pixels como fonte de dados.
 */

import React from "react";
import * as Facebook from "@/integrations/tracking/facebook";
import * as UTMify from "@/integrations/tracking/utmify";
import * as GoogleAds from "@/integrations/tracking/google-ads";
import * as TikTok from "@/integrations/tracking/tiktok";
import * as Kwai from "@/integrations/tracking/kwai";
import { createLogger } from "@/lib/logger";
import type { CheckoutPixel } from "@/types/checkout-pixels.types";
import type { UTMifyIntegration } from "@/integrations/tracking/utmify/types";

const log = createLogger("TrackingManager");

// ============================================================================
// INTERFACE
// ============================================================================

interface TrackingManagerProps {
  productId: string | null;
  /** Pixels vinculados ao produto (sistema novo - recomendado) */
  productPixels?: CheckoutPixel[];
  /** UTMify ainda não migrou para product_pixels */
  utmifyConfig?: UTMifyIntegration | null;
}

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Gerenciador de scripts de tracking.
 * 
 * Renderiza os pixels de tracking via product_pixels.
 * UTMify usa sistema separado (não migrou para product_pixels).
 */
export const TrackingManager: React.FC<TrackingManagerProps> = ({
  productId,
  utmifyConfig,
  productPixels = [],
}) => {
  // Separar pixels por plataforma
  const facebookPixels = productPixels.filter(p => p.platform === 'facebook' && p.is_active);
  const tiktokPixels = productPixels.filter(p => p.platform === 'tiktok' && p.is_active);
  const googleAdsPixels = productPixels.filter(p => p.platform === 'google_ads' && p.is_active);
  const kwaiPixels = productPixels.filter(p => p.platform === 'kwai' && p.is_active);

  // Diagnostic logging - visible in DevTools console
  log.info("Rendering tracking pixels", {
    total: productPixels.length,
    facebook: facebookPixels.length,
    tiktok: tiktokPixels.length,
    googleAds: googleAdsPixels.length,
    kwai: kwaiPixels.length,
  });

  return (
    <>
      {/* Facebook Pixels */}
      {facebookPixels.map((pixel) => (
        <Facebook.Pixel 
          key={`fb-product-${pixel.id}`}
          config={{ 
            pixel_id: pixel.pixel_id,
            enabled: true,
          }} 
        />
      ))}

      {/* TikTok Pixels */}
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

      {/* Google Ads Pixels */}
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

      {/* Kwai Pixels */}
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

      {/* UTMify Pixel (CDN script + InitiateCheckout) */}
      {UTMify.shouldRunUTMify(utmifyConfig, productId) && (
        <UTMify.Pixel integration={utmifyConfig} />
      )}
    </>
  );
};
