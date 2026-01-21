/**
 * Entity Types - Product Entities and Mapped Data
 * 
 * Define interfaces para entidades do produto e dados mapeados.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 * @module products/machines/types
 */

import type { 
  ProductData, 
  Offer, 
  OrderBump, 
  Checkout, 
  PaymentLink, 
  Coupon,
  UpsellSettings,
  AffiliateSettings,
} from "../../types/product.types";

// ============================================================================
// ENTITY TYPE ALIASES (para compatibilidade)
// ============================================================================

export type MachineProduct = ProductData;
export type MachineOffer = Offer;
export type MachineOrderBump = OrderBump;
export type MachineCheckout = Checkout;
export type MachineCoupon = Coupon;
export type MachinePaymentLink = PaymentLink;

// ============================================================================
// PRODUCT ENTITIES (Entidades relacionadas ao produto)
// ============================================================================

export interface ProductEntities {
  orderBumps: OrderBump[];
  checkouts: Checkout[];
  paymentLinks: PaymentLink[];
  coupons: Coupon[];
}

// ============================================================================
// MAPPED DATA (Dados mapeados do BFF)
// ============================================================================

export interface MappedProductData {
  product: ProductData;
  offers: Offer[];
  orderBumps: OrderBump[];
  checkouts: Checkout[];
  paymentLinks: PaymentLink[];
  coupons: Coupon[];
  upsellSettings: UpsellSettings;
  affiliateSettings: AffiliateSettings | null;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationErrors {
  general: Record<string, string>;
  upsell: Record<string, string>;
  affiliate: Record<string, string>;
  checkoutSettings: Record<string, string>;
  [key: string]: Record<string, string> | undefined;
}

// ============================================================================
// COMPUTED TYPES
// ============================================================================

export interface ComputedValues {
  isDirty: boolean;
  isValid: boolean;
  canSave: boolean;
  dirtyFlags: {
    general: boolean;
    image: boolean;
    offers: boolean;
    upsell: boolean;
    affiliate: boolean;
    checkoutSettings: boolean;
  };
}
