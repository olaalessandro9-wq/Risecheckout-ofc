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
    support_name: record.support_name ?? "",
    support_email: record.support_email ?? "",
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
    customPageUrl: backend.upsell_custom_page_url ?? "",
    redirectIgnoringOrderBumpFailures: false,
  };
}

// ============================================================================
// AFFILIATE SETTINGS MAPPER
// ============================================================================

export function mapAffiliateSettings(
  backend: BackendAffiliateSettings,
  product: ProductRecord
): AffiliateSettings {
  return {
    enabled: backend.affiliate_enabled,
    defaultRate: backend.affiliate_commission_value,
    requireApproval: backend.affiliate_approval_mode === "manual",
    commissionOnOrderBump: false,
    commissionOnUpsell: false,
    supportEmail: product.support_email ?? "",
    publicDescription: "",
    attributionModel: "last_click",
    cookieDuration: backend.affiliate_cookie_days,
    showInMarketplace: backend.affiliate_public_in_marketplace,
    marketplaceDescription: product.marketplace_description ?? "",
    marketplaceCategory: product.marketplace_category ?? "",
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
// Mapeia colunas REAIS do banco: custom_title, custom_description, discount_price
// ============================================================================

export function mapOrderBumpRecords(records: OrderBumpRecord[]): OrderBump[] {
  return records.map((record) => {
    // Extrair dados da relação com produto
    const product = record.products;
    
    return {
      id: record.id,
      // Nome: custom_title > nome do produto > fallback
      name: record.custom_title ?? product?.name ?? "",
      description: record.custom_description,
      // Preço: discount_price (se ativo) > preço do produto > 0
      price: record.discount_enabled && record.discount_price != null 
        ? record.discount_price 
        : product?.price ?? 0,
      image_url: record.show_image ? product?.image_url ?? null : null,
      bump_product_id: record.product_id,
      created_at: record.created_at,
    };
  });
}

// ============================================================================
// CHECKOUTS MAPPER
// ============================================================================

export function mapCheckoutRecords(records: CheckoutRecord[]): Checkout[] {
  return records.map((record) => {
    // Extrair dados das relações aninhadas
    const checkoutLink = record.checkout_links?.[0];
    const paymentLink = checkoutLink?.payment_links;
    const offer = paymentLink?.offers;
    
    // Prioridade: offer > product > fallback
    const price = offer?.price ?? record.products?.price ?? 0;
    const offerName = offer?.name ?? record.products?.name ?? "";
    const linkId = checkoutLink?.link_id ?? "";
    
    return {
      id: record.id,
      name: record.name,
      price,
      visits: record.visits_count ?? 0,
      offer: offerName,
      isDefault: record.is_default,
      linkId,
      product_id: record.product_id,
      status: record.status ?? "active",
      created_at: record.created_at,
    };
  });
}

// ============================================================================
// PAYMENT LINKS MAPPER
// ============================================================================

export function mapPaymentLinkRecords(records: PaymentLinkRecord[]): PaymentLink[] {
  return records.map((record) => {
    // Extrair dados das relações aninhadas
    const offer = record.offers;
    const isActive = record.status === "active" || record.active === true;
    
    return {
      id: record.id,
      slug: record.slug,
      url: record.url ?? `/c/${record.slug}`,
      offer_name: offer?.name ?? "",
      offer_price: offer?.price ?? 0,
      is_default: offer?.is_default ?? false,
      status: isActive ? "active" : "inactive",
      checkouts: record.checkouts?.map(c => ({ id: c.id, name: c.name })) ?? [],
      created_at: record.created_at ?? new Date().toISOString(),
    };
  });
}

// ============================================================================
// COUPONS MAPPER
// ============================================================================

export function mapCouponRecords(records: CouponRecord[]): Coupon[] {
  return records.map((record) => ({
    id: record.id,
    code: record.code,
    discount: record.discount_value,
    discount_type: "percentage" as const, // RISE V3: Apenas porcentagem suportado
    startDate: record.start_date ? new Date(record.start_date) : new Date(),
    endDate: record.expires_at ? new Date(record.expires_at) : new Date(),
    usageCount: record.uses_count ?? 0,
    max_uses: record.max_uses,
    applyToOrderBumps: record.apply_to_order_bumps ?? false,
    created_at: record.created_at,
    expires_at: record.expires_at ?? undefined,
  }));
}
