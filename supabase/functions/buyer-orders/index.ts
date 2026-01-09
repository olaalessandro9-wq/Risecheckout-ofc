import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { 
  rateLimitMiddleware, 
  RATE_LIMIT_CONFIGS,
  getClientIP 
} from "../_shared/rate-limiter.ts";

// Validate buyer session and return buyer data
async function validateSession(supabase: any, sessionToken: string | null) {
  if (!sessionToken) {
    return null;
  }

  const { data: session } = await supabase
    .from("buyer_sessions")
    .select(`
      id,
      expires_at,
      is_valid,
      buyer:buyer_id (
        id,
        email,
        name,
        is_active
      )
    `)
    .eq("session_token", sessionToken)
    .single();

  if (!session || !session.is_valid || !session.buyer) {
    return null;
  }

  const buyerData = Array.isArray(session.buyer) ? session.buyer[0] : session.buyer;

  if (!buyerData.is_active) {
    return null;
  }

  if (new Date(session.expires_at) < new Date()) {
    return null;
  }

  return buyerData;
}

serve(async (req) => {
  // CORS handling
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  // Extend CORS headers to include x-buyer-session
  const corsHeaders = {
    ...corsResult.headers,
    "Access-Control-Allow-Headers": corsResult.headers["Access-Control-Allow-Headers"] + ", x-buyer-session",
  };

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rate limiting
    const rateLimitResult = await rateLimitMiddleware(
      supabase as any,
      req,
      RATE_LIMIT_CONFIGS.MEMBERS_AREA
    );
    if (rateLimitResult) {
      console.warn(`[buyer-orders] Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const action = pathParts[pathParts.length - 1];

    // Get session token from header
    const sessionToken = req.headers.get("x-buyer-session");
    const buyer = await validateSession(supabase, sessionToken);

    if (!buyer) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida ou expirada" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[buyer-orders] Action: ${action}, Buyer: ${buyer.email}`);

    // ============================================
    // ORDERS - Listar pedidos do buyer
    // ============================================
    if (action === "orders" && req.method === "GET") {
      const { data: orders, error } = await supabase
        .from("orders")
        .select(`
          id,
          product_id,
          product_name,
          amount_cents,
          status,
          payment_method,
          created_at,
          paid_at,
          product:product_id (
            id,
            name,
            image_url,
            members_area_enabled
          )
        `)
        .eq("buyer_id", buyer.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[buyer-orders] Error fetching orders:", error);
        return new Response(
          JSON.stringify({ error: "Erro ao buscar pedidos" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ orders }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // ACCESS - Listar produtos com acesso (comprados + próprios)
    // ============================================
    if (action === "access" && req.method === "GET") {
      // 1. Buscar produtos com acesso via buyer_product_access
      const { data: access, error } = await supabase
        .from("buyer_product_access")
        .select(`
          id,
          product_id,
          granted_at,
          expires_at,
          is_active,
          access_type,
          product:product_id (
            id,
            name,
            description,
            image_url,
            members_area_enabled,
            user_id
          )
        `)
        .eq("buyer_id", buyer.id)
        .eq("is_active", true);

      if (error) {
        console.error("[buyer-orders] Error fetching access:", error);
        return new Response(
          JSON.stringify({ error: "Erro ao buscar acessos" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 2. Buscar produtos onde o produtor (pelo email) é o dono
      // Usar RPC para buscar user_id a partir do email (auth.users não é acessível diretamente)
      const { data: producerId, error: rpcError } = await supabase
        .rpc('get_user_id_by_email', { user_email: buyer.email });

      if (rpcError) {
        console.log(`[buyer-orders] RPC error getting producer id for ${buyer.email}:`, rpcError);
      }

      let ownProducts: any[] = [];
      if (producerId) {
        console.log(`[buyer-orders] Found producer id ${producerId} for ${buyer.email}`);
        const { data: products, error: productsError } = await supabase
          .from("products")
          .select("id, name, description, image_url, members_area_enabled, user_id")
          .eq("user_id", producerId)
          .eq("members_area_enabled", true);
        
        if (productsError) {
          console.log(`[buyer-orders] Error fetching producer products:`, productsError);
        }

        if (products && products.length > 0) {
          console.log(`[buyer-orders] Found ${products.length} products owned by producer`);
          ownProducts = products.map(p => ({
            id: `own_${p.id}`,
            product_id: p.id,
            granted_at: null,
            expires_at: null,
            is_active: true,
            access_type: "producer",
            product: p,
          }));
        }
      } else {
        console.log(`[buyer-orders] No producer id found for ${buyer.email}`);
      }

      // 3. Unificar e remover duplicatas (prioriza owner se existir)
      const uniqueProducts = new Map();
      
      // Primeiro adiciona os produtos próprios
      for (const item of ownProducts) {
        uniqueProducts.set(item.product_id, item);
      }
      
      // Depois adiciona os comprados (só se não existir)
      for (const item of access || []) {
        if (!uniqueProducts.has(item.product_id)) {
          uniqueProducts.set(item.product_id, item);
        }
      }

      console.log(`[buyer-orders] Access for ${buyer.email}: ${uniqueProducts.size} products (${ownProducts.length} own)`);

      return new Response(
        JSON.stringify({ access: Array.from(uniqueProducts.values()) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // CONTENT - Buscar conteúdo de um produto
    // ============================================
    if (action === "content" && req.method === "GET") {
      const productId = url.searchParams.get("productId");

      if (!productId) {
        return new Response(
          JSON.stringify({ error: "productId é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if buyer has access to this product (via purchase)
      const { data: hasAccess } = await supabase
        .from("buyer_product_access")
        .select("id")
        .eq("buyer_id", buyer.id)
        .eq("product_id", productId)
        .eq("is_active", true)
        .limit(1)
        .single();

      // If no direct access, check if buyer is the product owner
      let isOwner = false;
      if (!hasAccess) {
        const { data: producerId } = await supabase
          .rpc('get_user_id_by_email', { user_email: buyer.email });
        
        if (producerId) {
          const { data: productData } = await supabase
            .from("products")
            .select("user_id")
            .eq("id", productId)
            .single();
          
          isOwner = productData?.user_id === producerId;
        }
      }

      if (!hasAccess && !isOwner) {
        return new Response(
          JSON.stringify({ error: "Você não tem acesso a este produto" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[buyer-orders] Content access for ${buyer.email} to product ${productId}: hasAccess=${!!hasAccess}, isOwner=${isOwner}`);

      // Get product info
      const { data: product } = await supabase
        .from("products")
        .select("id, name, description, image_url, members_area_enabled, members_area_settings")
        .eq("id", productId)
        .single();

      if (!product) {
        return new Response(
          JSON.stringify({ error: "Produto não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!product.members_area_enabled) {
        return new Response(
          JSON.stringify({ error: "Área de membros não está habilitada para este produto" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get Builder sections (banners, modules, etc.)
      const { data: sections, error: sectionsError } = await supabase
        .from("product_members_sections")
        .select("*")
        .eq("product_id", productId)
        .eq("is_active", true)
        .order("position", { ascending: true });

      if (sectionsError) {
        console.log("[buyer-orders] Error fetching sections (table may not exist):", sectionsError);
      }

      // Get modules with content
      const { data: modules, error: modulesError } = await supabase
        .from("product_member_modules")
        .select(`
          id,
          title,
          description,
          position,
          is_active,
          cover_image_url,
          contents:product_member_content (
            id,
            title,
            description,
            content_type,
            content_url,
            content_data,
            position,
            is_active
          )
        `)
        .eq("product_id", productId)
        .eq("is_active", true)
        .order("position", { ascending: true });

      if (modulesError) {
        console.error("[buyer-orders] Error fetching modules:", modulesError);
        return new Response(
          JSON.stringify({ error: "Erro ao buscar conteúdo" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Sort contents by position and filter inactive
      const sortedModules = (modules || []).map(module => ({
        ...module,
        contents: (module.contents || [])
          .filter((c: any) => c.is_active)
          .sort((a: any, b: any) => a.position - b.position)
      }));

      // Fetch attachments for all contents
      const allContentIds = sortedModules.flatMap(m => m.contents.map((c: any) => c.id));
      
      let attachmentsMap: Record<string, any[]> = {};
      if (allContentIds.length > 0) {
        const { data: attachments } = await supabase
          .from("content_attachments")
          .select("id, content_id, file_name, file_url, file_type, file_size, position")
          .in("content_id", allContentIds)
          .order("position", { ascending: true });

        if (attachments && attachments.length > 0) {
          console.log(`[buyer-orders] Found ${attachments.length} attachments for ${allContentIds.length} contents`);
          for (const att of attachments) {
            if (!attachmentsMap[att.content_id]) {
              attachmentsMap[att.content_id] = [];
            }
            attachmentsMap[att.content_id].push({
              id: att.id,
              file_name: att.file_name,
              file_url: att.file_url,
              file_type: att.file_type,
              file_size: att.file_size,
            });
          }
        }
      }

      // Add attachments to each content
      const modulesWithAttachments = sortedModules.map(module => ({
        ...module,
        contents: module.contents.map((c: any) => ({
          ...c,
          attachments: attachmentsMap[c.id] || [],
        }))
      }));

      return new Response(
        JSON.stringify({
          product: {
            id: product.id,
            name: product.name,
            description: product.description,
            imageUrl: product.image_url,
            settings: product.members_area_settings,
          },
          modules: modulesWithAttachments,
          sections: sections || [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // PROFILE - Dados do buyer
    // ============================================
    if (action === "profile" && req.method === "GET") {
      const { data: profile } = await supabase
        .from("buyer_profiles")
        .select("id, email, name, phone, created_at")
        .eq("id", buyer.id)
        .single();

      return new Response(
        JSON.stringify({ profile }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação não encontrada" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[buyer-orders] Error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});