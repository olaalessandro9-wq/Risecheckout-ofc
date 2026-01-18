/**
 * Affiliation Queries
 * 
 * Shared query functions for fetching affiliation-related data.
 * 
 * @version 1.0.0
 * @see RISE ARCHITECT PROTOCOL V3 - DRY Principle
 * @module _shared/affiliation-queries
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// TYPES
// ============================================

export interface AffiliationRecord {
  id: string;
  affiliate_code: string;
  commission_rate: number | null;
  status: string;
  total_sales_count: number | null;
  total_sales_amount: number | null;
  created_at: string;
  product_id: string;
  user_id: string;
  pix_gateway: string | null;
  credit_card_gateway: string | null;
  gateway_credentials: Record<string, unknown> | null;
}

export interface AffiliateSettings {
  defaultRate?: number;
  [key: string]: unknown;
}

export interface GatewaySettings {
  pix_allowed?: string[];
  credit_card_allowed?: string[];
  require_gateway_connection?: boolean;
}

export interface ProductRecord {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  marketplace_description: string | null;
  marketplace_rules: string | null;
  marketplace_category: string | null;
  user_id: string;
  affiliate_settings: AffiliateSettings | null;
  affiliate_gateway_settings: GatewaySettings | null;
}

export interface PaymentLinkRecord {
  id: string;
  slug: string;
  status: string;
}

export interface OfferRecord {
  id: string;
  name: string;
  price: number;
  status: string;
  is_default: boolean;
  payment_links: PaymentLinkRecord[] | null;
}

export interface ProducerRecord {
  id: string;
  name: string | null;
}

export interface MarketplaceProduct {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  commission_percentage: number | null;
}

export interface AffiliatePixel {
  id: string;
  affiliate_id: string;
  platform: string;
  pixel_id: string;
  enabled: boolean;
  [key: string]: unknown;
}

export interface CheckoutLinkData {
  payment_links?: { slug: string } | Array<{ slug: string }>;
}

export interface CheckoutRecord {
  id: string;
  slug: string;
  is_default: boolean;
  status: string;
  checkout_links?: CheckoutLinkData[];
}

// ============================================
// QUERY FUNCTIONS
// ============================================

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
    .from("profiles")
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

// ============================================
// DATA TRANSFORMATION HELPERS
// ============================================

/**
 * Map offers with payment link slugs
 */
export function mapOffersWithPaymentSlug(offers: OfferRecord[]) {
  return offers.map((o) => {
    const activeLink = o.payment_links?.find((l) => l.status === 'active');
    const firstLink = o.payment_links?.[0];
    const paymentLink = activeLink || firstLink;
    
    return {
      id: o.id,
      name: o.name,
      price: o.price / 100,
      status: o.status,
      is_default: o.is_default,
      payment_link_slug: paymentLink?.slug || null,
    };
  });
}

/**
 * Map checkouts with payment link slugs
 */
export function mapCheckoutsWithPaymentSlug(checkouts: CheckoutRecord[]) {
  return checkouts.map((c) => {
    const firstLink = c.checkout_links?.[0]?.payment_links;
    const slug = Array.isArray(firstLink) ? firstLink[0]?.slug : firstLink?.slug;
    return {
      id: c.id,
      slug: c.slug,
      payment_link_slug: slug || null,
      is_default: c.is_default,
      status: c.status,
    };
  });
}

/**
 * Extract and normalize gateway settings
 */
export function extractGatewaySettings(product: ProductRecord | null): {
  pix_allowed: string[];
  credit_card_allowed: string[];
  require_gateway_connection: boolean;
} {
  const settings = product?.affiliate_gateway_settings || {};
  return {
    pix_allowed: settings.pix_allowed || ["asaas"],
    credit_card_allowed: settings.credit_card_allowed || ["mercadopago", "stripe"],
    require_gateway_connection: settings.require_gateway_connection ?? true,
  };
}
