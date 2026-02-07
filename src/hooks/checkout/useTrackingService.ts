/**
 * Hook: useTrackingService
 * 
 * @version 5.0.0 - RISE Protocol V3 - Arquitetura Híbrida
 * 
 * Arquitetura Híbrida UTMify:
 * - Eventos transacionais (purchase, refund) são disparados no backend (SSOT)
 *   via _shared/utmify/dispatcher.ts nos webhooks de pagamento.
 * - Eventos comportamentais (InitiateCheckout) são disparados no frontend
 *   via componente Pixel.tsx (CDN script do UTMify).
 * 
 * Este hook permanece para compatibilidade de API, mas NÃO dispara eventos
 * UTMify diretamente — o Pixel CDN cuida do InitiateCheckout e o backend
 * cuida dos eventos transacionais.
 * 
 * Outros pixels (Facebook, Google Ads, TikTok, Kwai) são disparados
 * automaticamente pelos componentes de pixel via TrackingManager.
 * 
 * @see docs/EDGE_FUNCTIONS_REGISTRY.md
 * @see docs/TRACKING_MODULE.md
 */

import { useCallback } from "react";
import type { PurchaseData, OrderBump } from "@/types/checkout";
import type { UTMifyIntegration } from "@/integrations/tracking/utmify/types";
import { createLogger } from "@/lib/logger";

const log = createLogger("TrackingService");

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
 * Arquitetura Híbrida UTMify:
 * - InitiateCheckout: disparado pelo componente Pixel.tsx (frontend CDN)
 * - Eventos transacionais: disparados pelo backend (SSOT) via webhooks
 * 
 * Este hook NÃO dispara eventos UTMify diretamente. O Pixel CDN e o backend
 * cuidam disso automaticamente. Outros pixels (Facebook, Google Ads, TikTok,
 * Kwai) são renderizados pelo TrackingManager.
 * 
 * @param props - Configurações de tracking
 * @returns Funções para disparar eventos de tracking (no-op para UTMify)
 */
export function useTrackingService({
  vendorId,
  productId,
  productName,
  trackingConfig: _trackingConfig,
}: UseTrackingServiceProps): UseTrackingServiceReturn {
  // Disparar evento de início de checkout
  // NOTA: InitiateCheckout UTMify é disparado pelo componente Pixel.tsx (CDN script)
  // Outros pixels são gerenciados pelo TrackingManager
  const fireInitiateCheckout = useCallback(
    (_selectedBumps: Set<string>, _orderBumps: OrderBump[]) => {
      if (!productId || !productName) return;
      // No-op: pixels são gerenciados pelo TrackingManager
    },
    [productId, productName]
  );

  // Disparar evento de compra
  // Arquitetura Híbrida: eventos transacionais UTMify são disparados pelo backend (SSOT)
  // via _shared/utmify/dispatcher.ts nos webhooks de pagamento.
  const firePurchase = useCallback(
    (purchaseData: PurchaseData) => {
      if (!productId || !productName || !vendorId) return;

      // Eventos transacionais UTMify são disparados pelo backend (SSOT)
      // via _shared/utmify/dispatcher.ts nos webhooks de pagamento.
      log.debug("firePurchase chamado (no-op: UTMify é backend SSOT)", {
        orderId: purchaseData.orderId,
        vendorId,
        productId,
      });

      // Outros pixels são gerenciados pelo TrackingManager
    },
    [productId, productName, vendorId]
  );

  return {
    fireInitiateCheckout,
    firePurchase,
  };
}
