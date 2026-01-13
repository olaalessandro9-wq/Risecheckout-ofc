/**
 * Hook: useTrackingService
 * 
 * Responsabilidade Única: Centralizar a execução de todos os scripts de tracking
 * (Facebook, Google Ads, TikTok, Kwai, UTMify).
 * 
 * Este hook extrai a lógica de tracking de useCheckoutPayment.ts.
 */

import { useCallback } from "react";
import { toReais } from "@/lib/money";
import type { PurchaseData, TrackingConfig, OrderBump } from "@/types/checkout";

// Tracking Modules
import * as Facebook from "@/integrations/tracking/facebook";
import * as UTMify from "@/integrations/tracking/utmify";
import * as GoogleAds from "@/integrations/tracking/google-ads";
import * as TikTok from "@/integrations/tracking/tiktok";
import * as Kwai from "@/integrations/tracking/kwai";

// ============================================================================
// INTERFACE DO HOOK
// ============================================================================

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
 * @param props - Configurações de tracking
 * @returns Funções para disparar eventos de tracking
 * 
 * @example
 * const { fireInitiateCheckout, firePurchase } = useTrackingService({
 *   vendorId: 'vendor-123',
 *   productId: 'product-456',
 *   productName: 'Produto Teste',
 *   trackingConfig: { fbConfig, googleAdsIntegration, ... }
 * });
 * 
 * // Disparar evento de início de checkout
 * fireInitiateCheckout(selectedBumps, orderBumps);
 * 
 * // Disparar evento de compra
 * firePurchase({ orderId: 'order-789', totalCents: 10000, customerData });
 */
export function useTrackingService({
  vendorId,
  productId,
  productName,
  trackingConfig,
}: UseTrackingServiceProps): UseTrackingServiceReturn {
  const { fbConfig, utmifyConfig, googleAdsIntegration, tiktokIntegration, kwaiIntegration } = trackingConfig;

  // Disparar evento de início de checkout
  const fireInitiateCheckout = useCallback(
    (selectedBumps: Set<string>, orderBumps: OrderBump[]) => {
      if (!productId || !productName) return;

      // Facebook Pixel - trackInitiateCheckout espera (product, totalValue, itemsCount)
      if (Facebook.shouldRunPixel(fbConfig, productId)) {
        const selectedBumpsArray = Array.from(selectedBumps)
          .map((bumpId) => orderBumps.find((b) => b.id === bumpId))
          .filter(Boolean);
        
        const product = { id: productId, name: productName };
        const totalValue = selectedBumpsArray.reduce((acc, b) => acc + (b?.price || 0), 0);
        const itemsCount = 1 + selectedBumpsArray.length;

        Facebook.trackInitiateCheckout(product, totalValue, itemsCount);
      }

      // Google Ads - trackAddToCart espera (config, items, value)
      if (GoogleAds.shouldRunGoogleAds(googleAdsIntegration, productId)) {
        const items = [{ id: productId, name: productName, quantity: 1, price: 0 }];
        GoogleAds.trackAddToCart(googleAdsIntegration.config, items, 0);
      }

      // TikTok - trackInitiateCheckout espera (config, items, value)
      if (TikTok.shouldRunTikTok(tiktokIntegration, productId)) {
        const items = [{ id: productId, name: productName, quantity: 1, price: 0 }];
        TikTok.trackInitiateCheckout(tiktokIntegration.config, items, 0);
      }

      // Kwai - trackInitiateCheckout espera (config, items, value)
      if (Kwai.shouldRunKwai(kwaiIntegration, productId)) {
        const items = [{ id: productId, name: productName, quantity: 1, price: 0 }];
        Kwai.trackInitiateCheckout(kwaiIntegration.config, items, 0);
      }
    },
    [productId, productName, fbConfig, googleAdsIntegration, tiktokIntegration, kwaiIntegration]
  );

  // Disparar evento de compra
  const firePurchase = useCallback(
    (purchaseData: PurchaseData) => {
      if (!productId || !productName) return;

      const { orderId, totalCents, customerData } = purchaseData;

      // 1. Facebook Pixel
      if (Facebook.shouldRunPixel(fbConfig, productId)) {
        Facebook.trackPurchase(orderId, totalCents, { id: productId, name: productName });
      }

      // 2. UTMify
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

      // 3. Google Ads
      if (GoogleAds.shouldRunGoogleAds(googleAdsIntegration, productId)) {
        const googleAdsItems: GoogleAds.GoogleAdsItem[] = [
          {
            id: productId,
            name: productName,
            quantity: 1,
            price: toReais(totalCents),
          },
        ];
        const googleAdsCustomer: GoogleAds.GoogleAdsCustomer = {
          email: customerData.email,
          phone: customerData.phone,
        };
        GoogleAds.trackPurchase(
          googleAdsIntegration.config,
          orderId,
          toReais(totalCents),
          googleAdsItems,
          googleAdsCustomer
        );
      }

      // 4. TikTok Pixel
      if (TikTok.shouldRunTikTok(tiktokIntegration, productId)) {
        const tiktokItems: TikTok.TikTokItem[] = [
          {
            id: productId,
            name: productName,
            quantity: 1,
            price: toReais(totalCents),
          },
        ];
        const tiktokCustomer: TikTok.TikTokCustomer = {
          email: customerData.email,
          phone: customerData.phone,
          name: customerData.name,
        };
        TikTok.trackPurchase(
          tiktokIntegration.config,
          orderId,
          toReais(totalCents),
          tiktokItems,
          tiktokCustomer
        );
      }

      // 5. Kwai Pixel
      if (Kwai.shouldRunKwai(kwaiIntegration, productId)) {
        const kwaiItems: Kwai.KwaiItem[] = [
          {
            id: productId,
            name: productName,
            quantity: 1,
            price: toReais(totalCents),
          },
        ];
        Kwai.trackPurchase(kwaiIntegration.config, orderId, toReais(totalCents), kwaiItems);
      }
    },
    [
      productId,
      productName,
      vendorId,
      fbConfig,
      utmifyConfig,
      googleAdsIntegration,
      tiktokIntegration,
      kwaiIntegration,
    ]
  );

  return {
    fireInitiateCheckout,
    firePurchase,
  };
}
