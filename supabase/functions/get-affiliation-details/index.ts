/**
 * get-affiliation-details Edge Function
 * 
 * @version 4.0.0 - RISE Protocol V3 Compliant (Vertical Slice Architecture)
 * - Uses Shared Kernel for types
 * - Parallel queries for optimal performance
 * - Zero duplicate code
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors.ts";
import { requireAuthenticatedProducer } from "../_shared/unified-auth.ts";
import { maskId } from "../_shared/kernel/security/pii-masking.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;

// ============================================
// TYPES
// ============================================

interface RequestBody {
  affiliation_id: string;
}

interface AffiliationRecord {
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

interface AffiliateSettings {
  defaultRate?: number;
  [key: string]: unknown;
}

interface GatewaySettings {
  pix_allowed?: string[];
  credit_card_allowed?: string[];
  require_gateway_connection?: boolean;
}

interface ProductRecord {
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

interface PaymentLinkRecord {
  id: string;
  slug: string;
  status: string;
}

interface OfferRecord {
  id: string;
  name: string;
  price: number;
  status: string;
  is_default: boolean;
  payment_links: PaymentLinkRecord[] | null;
}

interface ProducerRecord {
  id: string;
  name: string | null;
}

interface MarketplaceProduct {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  commission_percentage: number | null;
}

interface AffiliatePixel {
  id: string;
  affiliate_id: string;
  platform: string;
  pixel_id: string;
  enabled: boolean;
  [key: string]: unknown;
}

interface CheckoutLinkData {
  payment_links?: { slug: string } | Array<{ slug: string }>;
}

interface CheckoutRecord {
  id: string;
  slug: string;
  is_default: boolean;
  status: string;
  checkout_links?: CheckoutLinkData[];
}

// ============================================
// PARALLEL QUERY FUNCTIONS
// ============================================

async function fetchAffiliationWithValidation(
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

async function fetchProductData(
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

async function fetchOffers(
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

async function fetchCheckouts(
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

async function fetchPixels(
  supabase: SupabaseClient,
  affiliationId: string
): Promise<AffiliatePixel[]> {
  const { data } = await supabase
    .from("affiliate_pixels")
    .select("*")
    .eq("affiliate_id", affiliationId);

  return (data || []) as AffiliatePixel[];
}

async function fetchProducerProfile(
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

async function fetchOtherProducts(
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
// MAIN HANDLER
// ============================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Authentication
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return new Response(
        JSON.stringify({ error: "Sessão inválida ou expirada" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = producer.id;
    console.log(`[get-affiliation-details] User: ${maskId(producer.id)}`);

    // Get affiliation_id from body
    const body = await req.json() as RequestBody;
    const { affiliation_id } = body;

    if (!affiliation_id) {
      return new Response(
        JSON.stringify({ error: "affiliation_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // BATCH 1: Fetch affiliation with ownership validation
    // ============================================
    const { affiliation, error: affiliationError } = await fetchAffiliationWithValidation(
      supabase, affiliation_id, userId
    );

    if (affiliationError || !affiliation) {
      const status = affiliationError?.includes("permissão") ? 403 : 
                     affiliationError?.includes("encontrada") ? 404 : 500;
      return new Response(
        JSON.stringify({ error: affiliationError || "Erro ao buscar afiliação" }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const productId = affiliation.product_id;

    // ============================================
    // BATCH 2: Parallel queries for product-related data
    // ============================================
    const [product, offers, checkouts, pixels] = await Promise.all([
      fetchProductData(supabase, productId),
      fetchOffers(supabase, productId),
      fetchCheckouts(supabase, productId),
      fetchPixels(supabase, affiliation_id),
    ]);

    // Extract gateway settings
    const gatewaySettings: GatewaySettings = product?.affiliate_gateway_settings || {};
    const allowedGateways = {
      pix_allowed: gatewaySettings.pix_allowed || ["asaas"],
      credit_card_allowed: gatewaySettings.credit_card_allowed || ["mercadopago", "stripe"],
      require_gateway_connection: gatewaySettings.require_gateway_connection ?? true,
    };

    // ============================================
    // BATCH 3: Parallel queries for producer data
    // ============================================
    let producerProfile: ProducerRecord | null = null;
    let otherProducts: MarketplaceProduct[] = [];

    if (product?.user_id) {
      [producerProfile, otherProducts] = await Promise.all([
        fetchProducerProfile(supabase, product.user_id),
        fetchOtherProducts(supabase, product.user_id, productId),
      ]);
    }

    // ============================================
    // TRANSFORM DATA
    // ============================================
    
    // Calculate effective commission rate
    const effectiveCommissionRate = 
      affiliation.commission_rate ?? 
      (product?.affiliate_settings?.defaultRate || 0);

    // Map offers with payment link slugs
    const offersWithPaymentSlug = offers.map((o) => {
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

    // Map checkouts with payment link slugs
    const checkoutsWithPaymentSlug = checkouts.map((c) => {
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

    // ============================================
    // BUILD RESPONSE
    // ============================================
    const affiliationResponse = {
      id: affiliation.id,
      affiliate_code: affiliation.affiliate_code,
      commission_rate: effectiveCommissionRate,
      status: affiliation.status,
      total_sales_count: affiliation.total_sales_count || 0,
      total_sales_amount: affiliation.total_sales_amount || 0,
      created_at: affiliation.created_at,
      product: product ? {
        id: product.id,
        name: product.name,
        description: product.description,
        image_url: product.image_url,
        price: product.price,
        marketplace_description: product.marketplace_description,
        marketplace_rules: product.marketplace_rules,
        marketplace_category: product.marketplace_category,
        user_id: product.user_id,
        affiliate_settings: product.affiliate_settings,
      } : null,
      offers: offersWithPaymentSlug,
      checkouts: checkoutsWithPaymentSlug,
      producer: producerProfile,
      pixels,
      pix_gateway: affiliation.pix_gateway || null,
      credit_card_gateway: affiliation.credit_card_gateway || null,
      gateway_credentials: affiliation.gateway_credentials || {},
      allowed_gateways: allowedGateways,
    };

    console.log(`[get-affiliation-details] Success for ${maskId(affiliation_id)}`);

    return new Response(
      JSON.stringify({ affiliation: affiliationResponse, otherProducts }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[get-affiliation-details] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
