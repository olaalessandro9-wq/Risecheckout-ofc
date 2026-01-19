/**
 * useProductDataMapper - Hook para mapear dados do BFF para o frontend
 * 
 * Encapsula a lógica de conversão de tipos backend → frontend
 * como um hook reutilizável.
 * 
 * @module products/context/hooks
 * @version RISE V3 Compliant
 */

import { useCallback } from "react";
import type { ProductFullData } from "./useProductLoader";
import type {
  ProductData,
  Offer,
  OrderBump,
  Checkout,
  Coupon,
  PaymentLink,
  UpsellSettings,
  AffiliateSettings,
} from "../../types/product.types";

import {
  mapProductRecord,
  mapUpsellSettings,
  mapAffiliateSettings,
  mapOfferRecords,
  mapOrderBumpRecords,
  mapCheckoutRecords,
  mapPaymentLinkRecords,
  mapCouponRecords,
} from "../helpers/productDataMapper";

// ============================================================================
// MAPPED DATA INTERFACE
// ============================================================================

export interface MappedProductData {
  product: ProductData;
  upsellSettings: UpsellSettings;
  affiliateSettings: AffiliateSettings;
  offers: Offer[];
  orderBumps: OrderBump[];
  checkouts: Checkout[];
  paymentLinks: PaymentLink[];
  coupons: Coupon[];
}

// ============================================================================
// HOOK
// ============================================================================

export function useProductDataMapper() {
  const mapFullData = useCallback((data: ProductFullData): MappedProductData => {
    return {
      product: mapProductRecord(data.product),
      upsellSettings: mapUpsellSettings(data.upsellSettings),
      affiliateSettings: mapAffiliateSettings(data.affiliateSettings, data.product),
      offers: mapOfferRecords(data.offers),
      orderBumps: mapOrderBumpRecords(data.orderBumps),
      checkouts: mapCheckoutRecords(data.checkouts),
      paymentLinks: mapPaymentLinkRecords(data.paymentLinks),
      coupons: mapCouponRecords(data.coupons),
    };
  }, []);

  return { mapFullData };
}
