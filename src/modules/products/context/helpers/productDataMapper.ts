/**
 * Product Data Mapper - Converte tipos Backend → Frontend
 * 
 * Responsável por mapear snake_case (BFF) para camelCase (Frontend)
 * seguindo os tipos definidos em product.types.ts
 * 
 * @module products/context/helpers
 * @version RISE V3 Compliant
 */

import type {
  ProductRecord,
  OfferRecord,
  OrderBumpRecord,
  CheckoutRecord,
  PaymentLinkRecord,
  CouponRecord,
  UpsellSettings as BackendUpsellSettings,
  AffiliateSettings as BackendAffiliateSettings,
} from "../hooks/useProductLoader";

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

// ============================================================================
// PRODUCT MAPPER
// ============================================================================

export function mapProductRecord(record: ProductRecord): ProductData {
  return {
    id: record.id,
    name: record.name,
    description: record.description ?? "",
    price: record.price,
    image_url: record.image_url,
    support_name: "", // Não vem do BFF, será preenchido pelo form
    support_email: "", // Não vem do BFF, será preenchido pelo form
    status: record.status === "active" ? "active" : "blocked",
    user_id: record.vendor_id,
    created_at: record.created_at,
    updated_at: record.updated_at ?? undefined,
    members_area_enabled: record.members_area_enabled,
  };
}

// ============================================================================
// UPSELL SETTINGS MAPPER
// ============================================================================

export function mapUpsellSettings(backend: BackendUpsellSettings): UpsellSettings {
  return {
    hasCustomThankYouPage: backend.upsell_enabled,
    customPageUrl: "", // Não mapeado diretamente do backend
    redirectIgnoringOrderBumpFailures: false, // Default
  };
}

// ============================================================================
// AFFILIATE SETTINGS MAPPER
// ============================================================================

export function mapAffiliateSettings(backend: BackendAffiliateSettings): AffiliateSettings {
  return {
    enabled: backend.affiliate_enabled,
    defaultRate: backend.affiliate_commission_value,
    requireApproval: backend.affiliate_approval_mode === "manual",
    commissionOnOrderBump: false, // Default
    commissionOnUpsell: false, // Default
    supportEmail: "", // Não vem do BFF
    publicDescription: "", // Não vem do BFF
    attributionModel: "last_click",
    cookieDuration: backend.affiliate_cookie_days,
    showInMarketplace: backend.affiliate_public_in_marketplace,
    marketplaceDescription: "",
    marketplaceCategory: "",
  };
}

// ============================================================================
// OFFERS MAPPER
// ============================================================================

export function mapOfferRecords(records: OfferRecord[]): Offer[] {
  return records.map((record) => ({
    id: record.id,
    product_id: record.product_id,
    name: record.name,
    price: record.price,
    is_default: record.is_default,
    created_at: record.created_at,
    updated_at: record.updated_at ?? undefined,
  }));
}

// ============================================================================
// ORDER BUMPS MAPPER
// ============================================================================

export function mapOrderBumpRecords(records: OrderBumpRecord[]): OrderBump[] {
  return records.map((record) => ({
    id: record.id,
    name: record.title,
    description: record.description,
    price: record.special_price,
    image_url: null,
    bump_product_id: record.bump_product_id,
    created_at: record.created_at,
  }));
}

// ============================================================================
// CHECKOUTS MAPPER
// ============================================================================

export function mapCheckoutRecords(records: CheckoutRecord[]): Checkout[] {
  return records.map((record) => ({
    id: record.id,
    name: record.name,
    price: 0, // Será preenchido via payment links
    visits: 0, // Não vem do BFF simplificado
    offer: "",
    isDefault: record.is_default,
    linkId: "",
    product_id: record.product_id,
    status: record.status ?? "active",
    created_at: record.created_at,
  }));
}

// ============================================================================
// PAYMENT LINKS MAPPER
// ============================================================================

export function mapPaymentLinkRecords(records: PaymentLinkRecord[]): PaymentLink[] {
  return records.map((record) => ({
    id: record.id,
    slug: record.slug,
    url: `/c/${record.slug}`,
    offer_name: "",
    offer_price: 0,
    is_default: false,
    status: record.active ? "active" : "inactive",
    checkouts: [],
    created_at: record.created_at,
  }));
}

// ============================================================================
// COUPONS MAPPER
// ============================================================================

export function mapCouponRecords(records: CouponRecord[]): Coupon[] {
  return records.map((record) => ({
    id: record.id,
    code: record.code,
    discount: record.discount_value,
    discount_type: record.discount_type as "percentage" | "fixed",
    startDate: record.start_date ? new Date(record.start_date) : new Date(),
    endDate: record.expires_at ? new Date(record.expires_at) : new Date(),
    usageCount: record.uses_count ?? 0,
    max_uses: record.max_uses,
    applyToOrderBumps: record.apply_to_order_bumps ?? false,
    created_at: record.created_at,
    expires_at: record.expires_at ?? undefined,
  }));
}
