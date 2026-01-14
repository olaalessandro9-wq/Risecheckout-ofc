/**
 * Hook: useTrackingService
 * 
 * Responsabilidade Única: Centralizar a execução de scripts de tracking.
 * 
 * RISE Protocol V2: Código legacy removido. 
 * Apenas UTMify permanece pois não migrou para product_pixels.
 * Outros pixels (Facebook, Google Ads, TikTok, Kwai) agora são disparados
 * automaticamente pelos componentes de pixel via TrackingManager.
 */

import { useCallback } from "react";
import { toReais } from "@/lib/money";
import type { PurchaseData, OrderBump } from "@/types/checkout";
import type { UTMifyIntegration } from "@/integrations/tracking/utmify/types";

// Tracking Module (apenas UTMify)
import * as UTMify from "@/integrations/tracking/utmify";

// ============================================================================
// INTERFACE DO HOOK
// ============================================================================

interface TrackingConfig {
  utmifyConfig?: UTMifyIntegration | null;
}

interface UseTrackingServiceProps {
  vendorId: string | null;
  productId: string | null;
  productName: string | null;
  trackingConfig: TrackingConfig;
}

interface UseTrackingServiceReturn {
  fireInitiateCheckout: (selectedBumps: Set<string>, orderBumps: OrderBump[]) => void;
  firePurchase: (purchaseData: PurchaseData) => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para gerenciar o tracking de eventos do checkout.
 * 
 * NOTA: Com a migração para product_pixels, este hook agora gerencia apenas UTMify.
 * Os outros pixels (Facebook, Google Ads, TikTok, Kwai) são renderizados pelo 
 * TrackingManager e disparam eventos automaticamente.
 * 
 * @param props - Configurações de tracking
 * @returns Funções para disparar eventos de tracking
 */
export function useTrackingService({
  vendorId,
  productId,
  productName,
  trackingConfig,
}: UseTrackingServiceProps): UseTrackingServiceReturn {
  const { utmifyConfig } = trackingConfig;

  // Disparar evento de início de checkout
  // NOTA: UTMify não tem evento de InitiateCheckout, apenas Purchase
  const fireInitiateCheckout = useCallback(
    (_selectedBumps: Set<string>, _orderBumps: OrderBump[]) => {
      if (!productId || !productName) return;
      // UTMify não dispara evento de InitiateCheckout
      // Outros pixels agora são gerenciados pelo TrackingManager
    },
    [productId, productName]
  );

  // Disparar evento de compra
  const firePurchase = useCallback(
    (purchaseData: PurchaseData) => {
      if (!productId || !productName) return;

      const { orderId, totalCents, customerData } = purchaseData;

      // UTMify
      if (UTMify.shouldRunUTMify(utmifyConfig, productId) && vendorId) {
        const utmParams = UTMify.extractUTMParameters();
        UTMify.trackPurchase(vendorId, {
          orderId,
          paymentMethod: "credit_card",
          status: "approved",
          createdAt: UTMify.formatDateForUTMify(new Date()),
          customer: customerData,
          products: [{ id: productId, name: productName, priceInCents: totalCents }],
          trackingParameters: utmParams,
          totalPriceInCents: totalCents,
        });
      }
    },
    [productId, productName, vendorId, utmifyConfig]
  );

  return {
    fireInitiateCheckout,
    firePurchase,
  };
}
