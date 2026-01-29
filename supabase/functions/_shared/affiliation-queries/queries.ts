/**
 * Affiliation Queries - Fetchers
 *
 * Database query functions for fetching affiliation-related data.
 *
 * @version 1.0.0
 * @see RISE ARCHITECT PROTOCOL V3 - SRP & Modularization
 * @module _shared/affiliation-queries/queries
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type {
  AffiliationRecord,
  ProductRecord,
  OfferRecord,
  CheckoutRecord,
  AffiliatePixel,
  ProducerRecord,
  MarketplaceProduct,
} from "./types.ts";

/**
 * Fetch affiliation with ownership validation
 */
export async function fetchAffiliationWithValidation(
  supabase: SupabaseClient,
  affiliationId: string,
  userId: string
): Promise<{ affiliation: AffiliationRecord | null; error: string | null }> {
  const { data, error } = await supabase
    .from("affiliates")
    .select(`
      id, affiliate_code, commission_rate, status,
      total_sales_count, total_sales_amount, created_at,
      product_id, user_id, pix_gateway, credit_card_gateway, gateway_credentials
    `)
    .eq("id", affiliationId)
    .maybeSingle();

  if (error) return { affiliation: null, error: "Erro ao buscar afiliação" };
  if (!data) return { affiliation: null, error: "Afiliação não encontrada" };

  const affiliation = data as AffiliationRecord;
  if (affiliation.user_id !== userId) {
    return { affiliation: null, error: "Você não tem permissão para acessar esta afiliação" };
  }

  return { affiliation, error: null };
}

/**
 * Fetch product data by ID
 */
export async function fetchProductData(
  supabase: SupabaseClient,
  productId: string
): Promise<ProductRecord | null> {
  const { data } = await supabase
    .from("products")
    .select(`
      id, name, description, image_url, price,
      marketplace_description, marketplace_rules, marketplace_category,
      user_id, affiliate_settings, affiliate_gateway_settings
    `)
    .eq("id", productId)
    .maybeSingle();

  return data as ProductRecord | null;
}

/**
 * Fetch active offers for a product
 */
export async function fetchOffers(
  supabase: SupabaseClient,
  productId: string
): Promise<OfferRecord[]> {
  const { data } = await supabase
    .from("offers")
    .select(`
      id, name, price, status, is_default,
      payment_links (id, slug, status)
    `)
    .eq("product_id", productId)
    .eq("status", "active");

  return (data || []) as OfferRecord[];
}

/**
 * Fetch active checkouts for a product
 */
export async function fetchCheckouts(
  supabase: SupabaseClient,
  productId: string
): Promise<CheckoutRecord[]> {
  const { data } = await supabase
    .from("checkouts")
    .select(`
      id, slug, is_default, status,
      checkout_links (payment_links (slug))
    `)
    .eq("product_id", productId)
    .eq("status", "active");

  return (data || []) as CheckoutRecord[];
}

/**
 * Fetch affiliate pixels
 */
export async function fetchPixels(
  supabase: SupabaseClient,
  affiliationId: string
): Promise<AffiliatePixel[]> {
  const { data } = await supabase
    .from("affiliate_pixels")
    .select("*")
    .eq("affiliate_id", affiliationId);

  return (data || []) as AffiliatePixel[];
}

/**
 * Fetch producer profile
 */
export async function fetchProducerProfile(
  supabase: SupabaseClient,
  producerId: string
): Promise<ProducerRecord | null> {
  const { data } = await supabase
    .from("users")
    .select("id, name")
    .eq("id", producerId)
    .maybeSingle();

  return data as ProducerRecord | null;
}

/**
 * Fetch other products from the same producer
 */
export async function fetchOtherProducts(
  supabase: SupabaseClient,
  producerId: string,
  currentProductId: string
): Promise<MarketplaceProduct[]> {
  const { data } = await supabase
    .from("marketplace_products")
    .select("id, name, image_url, price, commission_percentage")
    .eq("producer_id", producerId)
    .neq("id", currentProductId)
    .limit(6);

  return (data || []) as MarketplaceProduct[];
}
