/**
 * Resolve And Load Handler (BFF Super-Unificado)
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * The CRITICAL performance handler - fetches ALL checkout data in ONE request.
 * 
 * PHASE 2 UPGRADE: Now includes:
 * - Checkout, Product, Offer, OrderBumps, Affiliate (original)
 * - ProductPixels (eliminates separate request)
 * - VendorIntegration/UTMify (eliminates separate request)
 * 
 * This reduces 4-5 HTTP calls to 1 (75-80% latency reduction).
 * 
 * @module checkout-public-data/handlers/resolve-and-load
 */

import { createLogger } from "../../_shared/logger.ts";
import { formatOrderBumps, type RawBump } from "./order-bumps-handler.ts";
import type { HandlerContext, PixelData } from "../types.ts";

const log = createLogger("checkout-public-data/resolve-and-load");

/**
 * SSOT: Minimal SELECT - only fields used by frontend.
 * Individual color columns are DEPRECATED (nullified in DB).
 * All color data comes from the `design` JSON field.
 */
const CHECKOUT_SELECT = `
  id,
  name,
  slug,
  visits_count,
  seller_name,
  product_id,
  font,
  components,
  top_components,
  bottom_components,
  status,
  design,
  theme,
  pix_gateway,
  credit_card_gateway,
  mercadopago_public_key,
  stripe_public_key
`;

const PRODUCT_SELECT = `
  id,
  user_id,
  name,
  description,
  price,
  image_url,
  support_name,
  required_fields,
  default_payment_method,
  upsell_settings,
  affiliate_settings,
  status,
  pix_gateway,
  credit_card_gateway
`;

export async function handleResolveAndLoad(ctx: HandlerContext): Promise<Response> {
  const { supabase, body, jsonResponse } = ctx;
  const { slug, affiliateCode } = body;

  if (!slug) {
    return jsonResponse({ error: "slug required" }, 400);
  }

  // 1. Resolve slug to checkout + product IDs
  const { data: checkout, error: checkoutError } = await supabase
    .from("checkouts")
    .select(CHECKOUT_SELECT)
    .eq("slug", slug)
    .maybeSingle();

  if (checkoutError || !checkout) {
    log.error("Checkout not found by slug:", checkoutError);
    return jsonResponse({ error: "Checkout não encontrado" }, 404);
  }

  if (checkout.status === "deleted") {
    return jsonResponse({ error: "Checkout não disponível" }, 404);
  }

  const resolvedProductId = checkout.product_id;
  if (!resolvedProductId) {
    return jsonResponse({ error: "Produto não vinculado ao checkout" }, 404);
  }

  // 2. Fetch product, offer, order bumps, affiliate, pixels, and vendor integration in parallel
  const [productResult, offerResult, orderBumpsResult, affiliateResult, pixelLinksResult, vendorIntegrationResult] = await Promise.all([
    // Product
    supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("id", resolvedProductId)
      .maybeSingle(),
    // Offer via checkout_links
    supabase
      .from("checkout_links")
      .select(`
        link_id,
        payment_links!inner (
          offer_id,
          offers!inner (
            id,
            name,
            price
          )
        )
      `)
      .eq("checkout_id", checkout.id)
      .maybeSingle(),
    // Order bumps - RISE V3: Query by parent_product_id, not checkout_id
    // NOTE: original_price is MARKETING ONLY (strikethrough display)
    supabase
      .from("order_bumps")
      .select(`
        id,
        product_id,
        custom_title,
        custom_description,
        discount_enabled,
        original_price,
        show_image,
        call_to_action,
        products!product_id(id, name, description, price, image_url),
        offers!offer_id(id, name, price)
      `)
      .eq("parent_product_id", resolvedProductId)
      .eq("active", true)
      .order("position"),
    // Affiliate (if code provided)
    affiliateCode
      ? supabase
          .from("affiliates")
          .select("id, affiliate_code, user_id, commission_rate, pix_gateway, credit_card_gateway")
          .eq("affiliate_code", affiliateCode)
          .eq("product_id", resolvedProductId)
          .eq("status", "active")
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    // Product Pixels (NEW - Phase 2)
    supabase
      .from("product_pixels")
      .select(`
        pixel_id,
        fire_on_initiate_checkout,
        fire_on_purchase,
        fire_on_pix,
        fire_on_card,
        fire_on_boleto,
        custom_value_percent
      `)
      .eq("product_id", resolvedProductId),
    // Vendor Integration/UTMify (NEW - Phase 2) - get vendor_id from product first
    Promise.resolve({ data: null, error: null }), // Placeholder, will fetch after product
  ]);

  // 3. Process product
  const product = productResult.data;
  if (!product || product.status === "deleted" || product.status === "blocked") {
    return jsonResponse({ error: "Produto não disponível" }, 404);
  }

  // 3.1 Fetch UTMify integration for the vendor (now that we have product.user_id)
  const vendorId = product.user_id;
  const { data: utmifyData } = await supabase
    .from("vendor_integrations")
    .select("id, vendor_id, active, config")
    .eq("vendor_id", vendorId)
    .eq("integration_type", "UTMIFY")
    .eq("active", true)
    .maybeSingle();

  // 3.2 Fetch actual pixel data for the links
  let productPixels: PixelData[] = [];
  const pixelLinks = pixelLinksResult.data;
  if (pixelLinks && pixelLinks.length > 0) {
    const pixelIds = (pixelLinks as Array<{ pixel_id: string }>).map(l => l.pixel_id);
    const { data: pixelsData } = await supabase
      .from("vendor_pixels")
      .select("id, platform, pixel_id, access_token, conversion_label, domain, is_active")
      .in("id", pixelIds)
      .eq("is_active", true);

    // Combine pixel data with link settings
    if (pixelsData) {
      for (const link of pixelLinks as Array<{
        pixel_id: string;
        fire_on_initiate_checkout: boolean;
        fire_on_purchase: boolean;
        fire_on_pix: boolean;
        fire_on_card: boolean;
        fire_on_boleto: boolean;
        custom_value_percent: number | null;
      }>) {
        const pixel = (pixelsData as Array<{
          id: string;
          platform: string;
          pixel_id: string;
          access_token: string | null;
          conversion_label: string | null;
          domain: string | null;
          is_active: boolean;
        }>).find(p => p.id === link.pixel_id);
        if (pixel && pixel.is_active) {
          productPixels.push({
            id: pixel.id,
            platform: pixel.platform,
            pixel_id: pixel.pixel_id,
            access_token: pixel.access_token,
            conversion_label: pixel.conversion_label,
            domain: pixel.domain,
            is_active: pixel.is_active,
            fire_on_initiate_checkout: link.fire_on_initiate_checkout,
            fire_on_purchase: link.fire_on_purchase,
            fire_on_pix: link.fire_on_pix,
            fire_on_card: link.fire_on_card,
            fire_on_boleto: link.fire_on_boleto,
            custom_value_percent: link.custom_value_percent,
          });
        }
      }
    }
  }

  // 4. Process offer
  let offer = null;
  if (offerResult.data) {
    const pl = offerResult.data.payment_links as unknown as { 
      offer_id: string; 
      offers: { id: string; name: string; price: number } 
    };
    offer = {
      offerId: pl.offer_id,
      offerName: pl.offers.name,
      offerPrice: pl.offers.price,
    };
  }

  // 5. Process order bumps using shared formatter
  // RISE V3: Two-step assertion (as unknown as RawBump[]) due to Supabase SDK
  // returning array types for join relations instead of single objects
  const orderBumps = formatOrderBumps((orderBumpsResult.data ?? []) as unknown as RawBump[]);

  // 6. Process affiliate
  let affiliate = null;
  if (affiliateResult.data) {
    const aff = affiliateResult.data as {
      id: string;
      affiliate_code: string;
      user_id: string;
      commission_rate: number | null;
      pix_gateway: string | null;
      credit_card_gateway: string | null;
    };
    affiliate = {
      affiliateId: aff.id,
      affiliateCode: aff.affiliate_code,
      affiliateUserId: aff.user_id,
      commissionRate: aff.commission_rate,
      pixGateway: aff.pix_gateway,
      creditCardGateway: aff.credit_card_gateway,
    };
  }

  // 7. Process UTMify integration
  let vendorIntegration = null;
  if (utmifyData) {
    vendorIntegration = {
      id: utmifyData.id,
      vendor_id: utmifyData.vendor_id,
      active: utmifyData.active,
      config: utmifyData.config,
    };
  }

  // 8. Return unified response (Super-BFF)
  return jsonResponse({
    success: true,
    data: {
      checkout: {
        id: checkout.id,
        name: checkout.name,
        slug: checkout.slug,
        visits_count: checkout.visits_count,
        seller_name: checkout.seller_name,
        font: checkout.font,
        components: checkout.components,
        top_components: checkout.top_components,
        bottom_components: checkout.bottom_components,
        design: checkout.design,
        theme: checkout.theme,
        pix_gateway: checkout.pix_gateway,
        credit_card_gateway: checkout.credit_card_gateway,
        mercadopago_public_key: checkout.mercadopago_public_key,
        stripe_public_key: checkout.stripe_public_key,
      },
      product,
      offer,
      orderBumps,
      affiliate,
      // NEW in Phase 2 - included directly in BFF response
      productPixels,
      vendorIntegration,
    },
  });
}

/**
 * Legacy "all" action handler - deprecated, use resolve-and-load instead.
 * Kept for API stability.
 */
export async function handleAll(ctx: HandlerContext): Promise<Response> {
  const { supabase, body, jsonResponse } = ctx;
  const { productId, checkoutId } = body;

  if (!productId || !checkoutId) {
    return jsonResponse({ error: "productId and checkoutId required" }, 400);
  }

  // Fetch all in parallel
  const [productResult, offerResult, orderBumpsResult] = await Promise.all([
    supabase
      .from("products")
      .select(`id, user_id, name, description, price, image_url, support_name, required_fields, default_payment_method, upsell_settings, affiliate_settings, status, pix_gateway, credit_card_gateway`)
      .eq("id", productId)
      .maybeSingle(),
    supabase
      .from("checkout_links")
      .select(`link_id, payment_links!inner (offer_id, offers!inner (id, name, price))`)
      .eq("checkout_id", checkoutId)
      .maybeSingle(),
    // RISE V3: Query by parent_product_id (from the product being sold, not the bump's product)
    supabase
      .from("order_bumps")
      .select(`id, product_id, custom_title, custom_description, discount_enabled, original_price, show_image, call_to_action, products!product_id(id, name, description, price, image_url), offers!offer_id(id, name, price)`)
      .eq("parent_product_id", productId)
      .eq("active", true)
      .order("position"),
  ]);

  // Process product
  const product = productResult.data;
  if (!product || product.status === "deleted" || product.status === "blocked") {
    return jsonResponse({ error: "Produto não encontrado" }, 404);
  }

  // Process offer
  let offer = null;
  if (offerResult.data) {
    const pl = offerResult.data.payment_links as unknown as { offer_id: string; offers: { id: string; name: string; price: number } };
    offer = {
      offerId: pl.offer_id,
      offerName: pl.offers.name,
      offerPrice: pl.offers.price,
    };
  }

  // Process order bumps
  // RISE V3: Two-step assertion (as unknown as RawBump[]) due to Supabase SDK
  // returning array types for join relations instead of single objects
  const orderBumps = formatOrderBumps((orderBumpsResult.data ?? []) as unknown as RawBump[]);

  return jsonResponse({
    success: true,
    data: { product, offer, orderBumps },
  });
}
