/**
 * Hook: useTrackingService
 * 
 * @version 4.0.0 - RISE Protocol V3 - Backend SSOT
 * 
 * IMPORTANTE: O tracking UTMify é agora feito EXCLUSIVAMENTE no backend
 * via _shared/utmify-dispatcher.ts nos webhooks de pagamento.
 * 
 * Este hook permanece para compatibilidade de API, mas NÃO dispara mais
 * eventos UTMify no frontend - isso é feito pelo backend.
 * 
 * Outros pixels (Facebook, Google Ads, TikTok, Kwai) são disparados
 * automaticamente pelos componentes de pixel via TrackingManager.
 * 
 * @see docs/EDGE_FUNCTIONS_REGISTRY.md - UTMify Backend SSOT
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
 * RISE V3 - Backend SSOT: UTMify tracking é feito exclusivamente no backend
 * via _shared/utmify-dispatcher.ts. Este hook NÃO dispara mais eventos UTMify.
 * 
 * Outros pixels (Facebook, Google Ads, TikTok, Kwai) são renderizados pelo 
 * TrackingManager e disparam eventos automaticamente.
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
  // NOTA: UTMify não tem evento de InitiateCheckout
  // Outros pixels são gerenciados pelo TrackingManager
  const fireInitiateCheckout = useCallback(
    (_selectedBumps: Set<string>, _orderBumps: OrderBump[]) => {
      if (!productId || !productName) return;
      // No-op: pixels são gerenciados pelo TrackingManager
    },
    [productId, productName]
  );

  // Disparar evento de compra
  // RISE V3: UTMify tracking é feito exclusivamente no backend
  const firePurchase = useCallback(
    (purchaseData: PurchaseData) => {
      if (!productId || !productName || !vendorId) return;

      // RISE V3 - Backend SSOT: UTMify tracking é feito no backend
      // via _shared/utmify-dispatcher.ts nos webhooks de pagamento.
      // Este código foi removido para evitar disparo duplicado.
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
