/**
 * Product Entity Handler - Shared module
 * 
 * Single Source of Truth for fetching product data.
 * Used by: product-full-loader
 * 
 * @module _shared/entities/product
 * @version RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../logger.ts";

const logger = createLogger("entities/product");

// ==========================================
// TYPES
// ==========================================

export interface UpsellSettings {
  upsell_enabled: boolean;
  upsell_product_id: string | null;
  upsell_offer_id: string | null;
  upsell_checkout_id: string | null;
  upsell_timer_enabled: boolean;
  upsell_timer_minutes: number;
  upsell_custom_page_url: string | null;
}

export interface AffiliateSettings {
  affiliate_enabled: boolean;
  affiliate_commission_type: string;
  affiliate_commission_value: number;
  affiliate_cookie_days: number;
  affiliate_approval_mode: string;
  affiliate_allow_coupon: boolean;
  affiliate_public_in_marketplace: boolean;
}

export interface ProductResult {
  product: Record<string, unknown>;
  upsellSettings: UpsellSettings;
  affiliateSettings: AffiliateSettings;
}

// ==========================================
// HELPERS
// ==========================================

/**
 * Parses upsell custom URL from JSONB settings
 */
function parseUpsellCustomUrl(settings: Record<string, unknown> | null): string | null {
  if (!settings || typeof settings !== "object") return null;
  const url = settings.customPageUrl;
  return typeof url === "string" ? url : null;
}

// ==========================================
// HANDLER
// ==========================================

/**
 * Fetches a product with ownership validation
 * Uses user_id (not vendor_id) as per actual database schema
 */
export async function fetchProduct(
  supabase: SupabaseClient,
  productId: string,
  userId: string
): Promise<ProductResult> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("user_id", userId)
    .single();

  if (error) {
    logger.error("Failed to fetch product", { productId, userId, error: error.message });
    throw new Error(`Product not found: ${error.message}`);
  }

  if (!data) {
    throw new Error("Product not found");
  }

  const product = data as Record<string, unknown>;

  // Extract upsell settings with custom page URL from JSONB
  const upsellSettings: UpsellSettings = {
    upsell_enabled: Boolean(product.upsell_enabled) ?? false,
    upsell_product_id: (product.upsell_product_id as string) ?? null,
    upsell_offer_id: (product.upsell_offer_id as string) ?? null,
    upsell_checkout_id: (product.upsell_checkout_id as string) ?? null,
    upsell_timer_enabled: Boolean(product.upsell_timer_enabled) ?? false,
    upsell_timer_minutes: Number(product.upsell_timer_minutes) || 15,
    upsell_custom_page_url: parseUpsellCustomUrl(
      product.upsell_settings as Record<string, unknown> | null
    ),
  };

  // Extract affiliate settings
  const affiliateSettings: AffiliateSettings = {
    affiliate_enabled: Boolean(product.affiliate_enabled) ?? false,
    affiliate_commission_type: (product.affiliate_commission_type as string) ?? "percentage",
    affiliate_commission_value: Number(product.affiliate_commission_value) || 0,
    affiliate_cookie_days: Number(product.affiliate_cookie_days) || 30,
    affiliate_approval_mode: (product.affiliate_approval_mode as string) ?? "manual",
    affiliate_allow_coupon: Boolean(product.affiliate_allow_coupon) ?? false,
    affiliate_public_in_marketplace: Boolean(product.affiliate_public_in_marketplace) ?? false,
  };

  return {
    product,
    upsellSettings,
    affiliateSettings,
  };
}
