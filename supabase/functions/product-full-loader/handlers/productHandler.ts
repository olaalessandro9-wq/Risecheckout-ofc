/**
 * Product Handler - Fetches core product data
 * 
 * @module product-full-loader/handlers
 * @version RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { ProductRecord, UpsellSettings, AffiliateSettings } from "../types.ts";

interface ProductHandlerResult {
  product: ProductRecord;
  upsellSettings: UpsellSettings;
  affiliateSettings: AffiliateSettings;
}

export async function fetchProduct(
  supabase: SupabaseClient,
  productId: string,
  vendorId: string
): Promise<ProductHandlerResult> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("vendor_id", vendorId)
    .single();

  if (error) {
    throw new Error(`Product not found: ${error.message}`);
  }

  if (!data) {
    throw new Error("Product not found");
  }

  const product = data as ProductRecord;

  // Extract upsell settings
  const upsellSettings: UpsellSettings = {
    upsell_enabled: product.upsell_enabled ?? false,
    upsell_product_id: product.upsell_product_id,
    upsell_offer_id: product.upsell_offer_id,
    upsell_checkout_id: product.upsell_checkout_id,
    upsell_timer_enabled: product.upsell_timer_enabled ?? false,
    upsell_timer_minutes: product.upsell_timer_minutes ?? 15,
  };

  // Extract affiliate settings
  const affiliateSettings: AffiliateSettings = {
    affiliate_enabled: product.affiliate_enabled ?? false,
    affiliate_commission_type: product.affiliate_commission_type ?? "percentage",
    affiliate_commission_value: product.affiliate_commission_value ?? 0,
    affiliate_cookie_days: product.affiliate_cookie_days ?? 30,
    affiliate_approval_mode: product.affiliate_approval_mode ?? "manual",
    affiliate_allow_coupon: product.affiliate_allow_coupon ?? false,
    affiliate_public_in_marketplace: product.affiliate_public_in_marketplace ?? false,
  };

  return {
    product,
    upsellSettings,
    affiliateSettings,
  };
}
