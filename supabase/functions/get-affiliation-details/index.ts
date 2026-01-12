import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-producer-session-token",
};

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  const masked = local.length > 2 ? local[0] + "***" + local[local.length - 1] : "***";
  return `${masked}@${domain}`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get session token from header
    const sessionToken = req.headers.get("x-producer-session-token");
    
    if (!sessionToken) {
      console.log("[get-affiliation-details] No session token provided");
      return new Response(
        JSON.stringify({ error: "Token de sessão não fornecido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get affiliation_id from body
    const body = await req.json();
    const { affiliation_id } = body;

    if (!affiliation_id) {
      return new Response(
        JSON.stringify({ error: "affiliation_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[get-affiliation-details] Fetching details for affiliation: ${affiliation_id}`);

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate session token
    const { data: sessionData, error: sessionError } = await supabase
      .from("producer_sessions")
      .select("producer_id, profiles:producer_id(id, email, name)")
      .eq("session_token", sessionToken)
      .eq("is_valid", true)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (sessionError || !sessionData) {
      console.log("[get-affiliation-details] Invalid or expired session");
      return new Response(
        JSON.stringify({ error: "Sessão inválida ou expirada" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = sessionData.producer_id;
    const profile = sessionData.profiles as any;
    console.log(`[get-affiliation-details] User authenticated: ${maskEmail(profile?.email || "")}`);

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

    // Verify ownership - user must own this affiliation
    if (affiliationData.user_id !== userId) {
      console.log(`[get-affiliation-details] User ${userId} does not own affiliation ${affiliation_id}`);
      return new Response(
        JSON.stringify({ error: "Você não tem permissão para acessar esta afiliação" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const productId = affiliationData.product_id;

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

    // Extract gateway settings
    const gatewaySettings = (productData as any)?.affiliate_gateway_settings || {};
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
    const checkoutsWithPaymentSlug = (checkoutsData || []).map((c: any) => ({
      id: c.id,
      slug: c.slug,
      payment_link_slug: c.checkout_links?.[0]?.payment_links?.slug || null,
      is_default: c.is_default,
      status: c.status,
    }));

    // Fetch producer profile
    let producer = null;
    if (productData?.user_id) {
      const { data: producerData } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("id", productData.user_id)
        .maybeSingle();
      
      producer = producerData;
    }

    // Fetch affiliate pixels
    const { data: pixelsData } = await supabase
      .from("affiliate_pixels")
      .select("*")
      .eq("affiliate_id", affiliation_id);

    // Fetch other products from the same producer
    let otherProducts: any[] = [];
    if (productData?.user_id) {
      const { data: otherProductsData } = await supabase
        .from("marketplace_products")
        .select("id, name, image_url, price, commission_percentage")
        .eq("producer_id", productData.user_id)
        .neq("id", productId)
        .limit(6);

      otherProducts = otherProductsData || [];
    }

    // Calculate effective commission rate
    const effectiveCommissionRate = 
      affiliationData.commission_rate ?? 
      ((productData as any)?.affiliate_settings?.defaultRate || 0);

    // Build response
    const affiliation = {
      id: affiliationData.id,
      affiliate_code: affiliationData.affiliate_code,
      commission_rate: effectiveCommissionRate,
      status: affiliationData.status,
      total_sales_count: affiliationData.total_sales_count || 0,
      total_sales_amount: affiliationData.total_sales_amount || 0,
      created_at: affiliationData.created_at,
      product: productData ? {
        id: productData.id,
        name: productData.name,
        description: productData.description,
        image_url: productData.image_url,
        price: productData.price,
        marketplace_description: productData.marketplace_description,
        marketplace_rules: productData.marketplace_rules,
        marketplace_category: productData.marketplace_category,
        user_id: productData.user_id,
        affiliate_settings: (productData as any).affiliate_settings,
      } : null,
      offers: (offersData || []).map((o: any) => {
        // Priorizar payment_link ativo, fallback para primeiro disponível
        const activeLink = o.payment_links?.find((l: any) => l.status === 'active');
        const firstLink = o.payment_links?.[0];
        const paymentLink = activeLink || firstLink;
        
        return {
          id: o.id,
          name: o.name,
          price: o.price / 100, // Convert cents to reais
          status: o.status,
          is_default: o.is_default,
          payment_link_slug: paymentLink?.slug || null, // Link específico da oferta
        };
      }),
      checkouts: checkoutsWithPaymentSlug,
      producer,
      pixels: pixelsData || [],
      pix_gateway: affiliationData.pix_gateway || null,
      credit_card_gateway: affiliationData.credit_card_gateway || null,
      gateway_credentials: affiliationData.gateway_credentials || {},
      allowed_gateways: allowedGateways,
    };

    console.log(`[get-affiliation-details] Successfully fetched affiliation details for ${affiliation_id}`);

    return new Response(
      JSON.stringify({ affiliation, otherProducts }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[get-affiliation-details] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
