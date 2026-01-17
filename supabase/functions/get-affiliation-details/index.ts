/**
 * get-affiliation-details Edge Function
 * 
 * Retorna detalhes completos de uma afiliação para o painel do afiliado.
 * 
 * @version 3.0.0 - RISE Protocol V3 (unified-auth)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors.ts";
import { requireAuthenticatedProducer } from "../_shared/unified-auth.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;

// ============================================
// INTERFACES
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

interface CheckoutWithPaymentSlug {
  id: string;
  slug: string;
  payment_link_slug: string | null;
  is_default: boolean;
  status: string;
}

interface OfferWithPaymentSlug {
  id: string;
  name: string;
  price: number;
  status: string;
  is_default: boolean;
  payment_link_slug: string | null;
}

// ============================================
// MAIN HANDLER
// ============================================

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth via unified-auth
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
    console.log(`[get-affiliation-details] User authenticated: ${producer.email}`);

    // Get affiliation_id from body
    const body = await req.json() as RequestBody;
    const { affiliation_id } = body;

    if (!affiliation_id) {
      return new Response(
        JSON.stringify({ error: "affiliation_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[get-affiliation-details] Fetching details for affiliation: ${affiliation_id}`);

    // Fetch affiliation with product data
    const { data: affiliationData, error: affiliationError } = await supabase
      .from("affiliates")
      .select(`
        id,
        affiliate_code,
        commission_rate,
        status,
        total_sales_count,
        total_sales_amount,
        created_at,
        product_id,
        user_id,
        pix_gateway,
        credit_card_gateway,
        gateway_credentials
      `)
      .eq("id", affiliation_id)
      .maybeSingle();

    if (affiliationError) {
      console.error("[get-affiliation-details] Error fetching affiliation:", affiliationError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar afiliação" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!affiliationData) {
      return new Response(
        JSON.stringify({ error: "Afiliação não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const typedAffiliation = affiliationData as AffiliationRecord;

    // Verify ownership - user must own this affiliation
    if (typedAffiliation.user_id !== userId) {
      console.log(`[get-affiliation-details] User ${userId} does not own affiliation ${affiliation_id}`);
      return new Response(
        JSON.stringify({ error: "Você não tem permissão para acessar esta afiliação" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const productId = typedAffiliation.product_id;

    // Fetch product data
    const { data: productData } = await supabase
      .from("products")
      .select(`
        id,
        name,
        description,
        image_url,
        price,
        marketplace_description,
        marketplace_rules,
        marketplace_category,
        user_id,
        affiliate_settings,
        affiliate_gateway_settings
      `)
      .eq("id", productId)
      .maybeSingle();

    const typedProduct = productData as ProductRecord | null;

    // Extract gateway settings
    const gatewaySettings: GatewaySettings = typedProduct?.affiliate_gateway_settings || {};
    const allowedGateways = {
      pix_allowed: gatewaySettings.pix_allowed || ["asaas"],
      credit_card_allowed: gatewaySettings.credit_card_allowed || ["mercadopago", "stripe"],
      require_gateway_connection: gatewaySettings.require_gateway_connection ?? true,
    };

    // Fetch offers for this product with payment_links
    const { data: offersData } = await supabase
      .from("offers")
      .select(`
        id, 
        name, 
        price, 
        status, 
        is_default,
        payment_links (
          id,
          slug,
          status
        )
      `)
      .eq("product_id", productId)
      .eq("status", "active");

    const typedOffers = (offersData || []) as OfferRecord[];

    // Fetch checkouts with payment links
    const { data: checkoutsData } = await supabase
      .from("checkouts")
      .select(`
        id, 
        slug, 
        is_default, 
        status,
        checkout_links (
          payment_links (
            slug
          )
        )
      `)
      .eq("product_id", productId)
      .eq("status", "active");

    // Map checkouts to include payment_link_slug
    const checkoutsWithPaymentSlug: CheckoutWithPaymentSlug[] = (checkoutsData || []).map((c: { id: string; slug: string; is_default: boolean; status: string; checkout_links?: Array<{ payment_links?: { slug: string } | Array<{ slug: string }> }> }) => {
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

    // Fetch producer profile
    let producer_profile: ProducerRecord | null = null;
    if (typedProduct?.user_id) {
      const { data: producerData } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("id", typedProduct.user_id)
        .maybeSingle();
      
      producer_profile = producerData as ProducerRecord | null;
    }

    // Fetch affiliate pixels
    const { data: pixelsData } = await supabase
      .from("affiliate_pixels")
      .select("*")
      .eq("affiliate_id", affiliation_id);

    const typedPixels = (pixelsData || []) as AffiliatePixel[];

    // Fetch other products from the same producer
    let otherProducts: MarketplaceProduct[] = [];
    if (typedProduct?.user_id) {
      const { data: otherProductsData } = await supabase
        .from("marketplace_products")
        .select("id, name, image_url, price, commission_percentage")
        .eq("producer_id", typedProduct.user_id)
        .neq("id", productId)
        .limit(6);

      otherProducts = (otherProductsData || []) as MarketplaceProduct[];
    }

    // Calculate effective commission rate
    const effectiveCommissionRate = 
      typedAffiliation.commission_rate ?? 
      (typedProduct?.affiliate_settings?.defaultRate || 0);

    // Map offers with payment link slugs
    const offersWithPaymentSlug: OfferWithPaymentSlug[] = typedOffers.map((o) => {
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

    // Build response
    const affiliation = {
      id: typedAffiliation.id,
      affiliate_code: typedAffiliation.affiliate_code,
      commission_rate: effectiveCommissionRate,
      status: typedAffiliation.status,
      total_sales_count: typedAffiliation.total_sales_count || 0,
      total_sales_amount: typedAffiliation.total_sales_amount || 0,
      created_at: typedAffiliation.created_at,
      product: typedProduct ? {
        id: typedProduct.id,
        name: typedProduct.name,
        description: typedProduct.description,
        image_url: typedProduct.image_url,
        price: typedProduct.price,
        marketplace_description: typedProduct.marketplace_description,
        marketplace_rules: typedProduct.marketplace_rules,
        marketplace_category: typedProduct.marketplace_category,
        user_id: typedProduct.user_id,
        affiliate_settings: typedProduct.affiliate_settings,
      } : null,
      offers: offersWithPaymentSlug,
      checkouts: checkoutsWithPaymentSlug,
      producer: producer_profile,
      pixels: typedPixels,
      pix_gateway: typedAffiliation.pix_gateway || null,
      credit_card_gateway: typedAffiliation.credit_card_gateway || null,
      gateway_credentials: typedAffiliation.gateway_credentials || {},
      allowed_gateways: allowedGateways,
    };

    console.log(`[get-affiliation-details] Successfully fetched affiliation details for ${affiliation_id}`);

    return new Response(
      JSON.stringify({ affiliation, otherProducts }),
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
