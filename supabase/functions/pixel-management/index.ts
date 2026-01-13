/**
 * Edge Function: pixel-management
 * 
 * Gerenciamento centralizado de pixels do vendedor.
 * Todas as operações CRUD passam por aqui com validação de ownership.
 * 
 * Ações disponíveis:
 * - list: Listar pixels do vendedor
 * - create: Criar novo pixel
 * - update: Atualizar pixel existente
 * - delete: Excluir pixel
 * 
 * @version 1.0.0
 * @security Requer producer_session token válido
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";

// ============================================================================
// Types
// ============================================================================

interface RequestBody {
  action: "list" | "create" | "update" | "delete" | "link-to-product" | "unlink-from-product" | "update-product-link" | "list-product-links";
  pixelId?: string;
  productId?: string;
  data?: {
    platform?: string;
    name?: string;
    pixel_id?: string;
    access_token?: string | null;
    conversion_label?: string | null;
    domain?: string | null;
    is_active?: boolean;
    // Link settings
    fire_on_initiate_checkout?: boolean;
    fire_on_purchase?: boolean;
    fire_on_pix?: boolean;
    fire_on_card?: boolean;
    fire_on_boleto?: boolean;
    custom_value_percent?: number | null;
  };
}

interface RateLimitRecord {
  id: string;
  blocked_until: string | null;
  first_attempt_at: string;
  last_attempt_at: string;
  attempts: number;
}

interface SessionRecord {
  user_id: string;
  expires_at: string;
  is_valid: boolean;
}

interface PixelRecord {
  id: string;
  vendor_id: string;
  platform: string;
  name: string;
  pixel_id: string;
  access_token: string | null;
  conversion_label: string | null;
  domain: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductPixelLink {
  id: string;
  product_id: string;
  pixel_id: string;
  fire_on_initiate_checkout: boolean;
  fire_on_purchase: boolean;
  fire_on_pix: boolean;
  fire_on_card: boolean;
  fire_on_boleto: boolean;
  custom_value_percent: number | null;
  created_at: string;
}

// ============================================================================
// Rate Limiting
// ============================================================================

async function checkRateLimit(
  supabase: SupabaseClient,
  producerId: string,
  action: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const MAX_ATTEMPTS = 30;
  const WINDOW_MS = 5 * 60 * 1000; // 5 minutos

  const key = `pixel_${action}_${producerId}`;
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MS);

  const { data: existing } = await supabase
    .from("buyer_rate_limits")
    .select("*")
    .eq("identifier", key)
    .eq("action", "pixel_management")
    .single();

  const record = existing as RateLimitRecord | null;

  if (record) {
    if (record.blocked_until && new Date(record.blocked_until) > now) {
      const retryAfter = Math.ceil(
        (new Date(record.blocked_until).getTime() - now.getTime()) / 1000
      );
      return { allowed: false, retryAfter };
    }

    if (new Date(record.first_attempt_at) < windowStart) {
      await supabase
        .from("buyer_rate_limits")
        .update({
          attempts: 1,
          first_attempt_at: now.toISOString(),
          last_attempt_at: now.toISOString(),
          blocked_until: null,
        })
        .eq("id", record.id);
      return { allowed: true };
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      const blockedUntil = new Date(now.getTime() + WINDOW_MS);
      await supabase
        .from("buyer_rate_limits")
        .update({
          blocked_until: blockedUntil.toISOString(),
          last_attempt_at: now.toISOString(),
        })
        .eq("id", record.id);
      return { allowed: false, retryAfter: Math.ceil(WINDOW_MS / 1000) };
    }

    await supabase
      .from("buyer_rate_limits")
      .update({
        attempts: record.attempts + 1,
        last_attempt_at: now.toISOString(),
      })
      .eq("id", record.id);
    return { allowed: true };
  }

  await supabase.from("buyer_rate_limits").insert({
    identifier: key,
    action: "pixel_management",
    attempts: 1,
    first_attempt_at: now.toISOString(),
    last_attempt_at: now.toISOString(),
  });

  return { allowed: true };
}

// ============================================================================
// Session Validation
// ============================================================================

async function validateProducerSession(
  supabase: SupabaseClient,
  sessionToken: string
): Promise<{ valid: boolean; producerId?: string; error?: string }> {
  if (!sessionToken) {
    return { valid: false, error: "Token de sessão não fornecido" };
  }

  const { data: session, error } = await supabase
    .from("producer_sessions")
    .select("user_id, expires_at, is_valid")
    .eq("session_token", sessionToken)
    .single();

  if (error || !session) {
    console.error("[pixel-management] Session not found:", error?.message);
    return { valid: false, error: "Sessão inválida" };
  }

  const sessionRecord = session as SessionRecord;

  if (!sessionRecord.is_valid) {
    return { valid: false, error: "Sessão foi invalidada" };
  }

  if (new Date(sessionRecord.expires_at) < new Date()) {
    return { valid: false, error: "Sessão expirada" };
  }

  return { valid: true, producerId: sessionRecord.user_id };
}

// ============================================================================
// Handlers
// ============================================================================

async function handleList(
  supabase: SupabaseClient,
  producerId: string
): Promise<Response> {
  console.log("[pixel-management] Listing pixels for producer:", producerId);

  // Buscar pixels do vendedor
  const { data: pixelsData, error: pixelsError } = await supabase
    .from("vendor_pixels")
    .select("*")
    .eq("vendor_id", producerId)
    .order("platform", { ascending: true })
    .order("name", { ascending: true });

  if (pixelsError) {
    console.error("[pixel-management] Error listing pixels:", pixelsError);
    throw new Error("Erro ao listar pixels");
  }

  const pixels = (pixelsData || []) as PixelRecord[];
  const pixelIds = pixels.map((p) => p.id);
  let linkedCounts: Record<string, number> = {};

  if (pixelIds.length > 0) {
    const { data: linksData, error: linksError } = await supabase
      .from("product_pixels")
      .select("pixel_id")
      .in("pixel_id", pixelIds);

    if (!linksError && linksData) {
      const links = linksData as ProductPixelLink[];
      linkedCounts = links.reduce(
        (acc: Record<string, number>, link) => {
          acc[link.pixel_id] = (acc[link.pixel_id] || 0) + 1;
          return acc;
        },
        {}
      );
    }
  }

  // Enriquecer pixels com contagem
  const enrichedPixels = pixels.map((pixel) => ({
    ...pixel,
    linked_products_count: linkedCounts[pixel.id] || 0,
  }));

  return new Response(
    JSON.stringify({ success: true, pixels: enrichedPixels }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

async function handleCreate(
  supabase: SupabaseClient,
  producerId: string,
  data: RequestBody["data"]
): Promise<Response> {
  console.log("[pixel-management] Creating pixel for producer:", producerId);

  if (!data?.platform || !data?.name || !data?.pixel_id) {
    return new Response(
      JSON.stringify({ error: "Dados obrigatórios: platform, name, pixel_id" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { data: newPixel, error } = await supabase
    .from("vendor_pixels")
    .insert({
      vendor_id: producerId,
      platform: data.platform,
      name: data.name,
      pixel_id: data.pixel_id,
      access_token: data.access_token || null,
      conversion_label: data.conversion_label || null,
      domain: data.domain || null,
      is_active: data.is_active !== undefined ? data.is_active : true,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return new Response(
        JSON.stringify({ error: "Este Pixel ID já está cadastrado para esta plataforma" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }
    console.error("[pixel-management] Error creating pixel:", error);
    throw new Error("Erro ao criar pixel");
  }

  const pixel = newPixel as PixelRecord;
  console.log("[pixel-management] ✅ Pixel created:", pixel.id);

  return new Response(
    JSON.stringify({ success: true, pixel }),
    { status: 201, headers: { "Content-Type": "application/json" } }
  );
}

async function handleUpdate(
  supabase: SupabaseClient,
  producerId: string,
  pixelId: string,
  data: RequestBody["data"]
): Promise<Response> {
  console.log("[pixel-management] Updating pixel:", pixelId);

  // Verificar ownership
  const { data: existing, error: fetchError } = await supabase
    .from("vendor_pixels")
    .select("id, vendor_id")
    .eq("id", pixelId)
    .single();

  if (fetchError || !existing) {
    return new Response(
      JSON.stringify({ error: "Pixel não encontrado" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const existingPixel = existing as Pick<PixelRecord, "id" | "vendor_id">;

  if (existingPixel.vendor_id !== producerId) {
    console.error("[pixel-management] ⚠️ Ownership violation - producer:", producerId, "owner:", existingPixel.vendor_id);
    return new Response(
      JSON.stringify({ error: "Acesso negado" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // Preparar dados de update
  const updateData: Record<string, unknown> = {};
  if (data?.name !== undefined) updateData.name = data.name;
  if (data?.pixel_id !== undefined) updateData.pixel_id = data.pixel_id;
  if (data?.access_token !== undefined) updateData.access_token = data.access_token;
  if (data?.conversion_label !== undefined) updateData.conversion_label = data.conversion_label;
  if (data?.domain !== undefined) updateData.domain = data.domain;
  if (data?.is_active !== undefined) updateData.is_active = data.is_active;

  const { data: updatedPixel, error } = await supabase
    .from("vendor_pixels")
    .update(updateData)
    .eq("id", pixelId)
    .select()
    .single();

  if (error) {
    console.error("[pixel-management] Error updating pixel:", error);
    throw new Error("Erro ao atualizar pixel");
  }

  console.log("[pixel-management] ✅ Pixel updated:", pixelId);

  return new Response(
    JSON.stringify({ success: true, pixel: updatedPixel }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

async function handleDelete(
  supabase: SupabaseClient,
  producerId: string,
  pixelId: string
): Promise<Response> {
  console.log("[pixel-management] Deleting pixel:", pixelId);

  // Verificar ownership
  const { data: existing, error: fetchError } = await supabase
    .from("vendor_pixels")
    .select("id, vendor_id")
    .eq("id", pixelId)
    .single();

  if (fetchError || !existing) {
    return new Response(
      JSON.stringify({ error: "Pixel não encontrado" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const existingPixel = existing as Pick<PixelRecord, "id" | "vendor_id">;

  if (existingPixel.vendor_id !== producerId) {
    console.error("[pixel-management] ⚠️ Ownership violation - producer:", producerId, "owner:", existingPixel.vendor_id);
    return new Response(
      JSON.stringify({ error: "Acesso negado" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // Deletar pixel (cascade irá deletar product_pixels relacionados)
  const { error } = await supabase
    .from("vendor_pixels")
    .delete()
    .eq("id", pixelId);

  if (error) {
    console.error("[pixel-management] Error deleting pixel:", error);
    throw new Error("Erro ao excluir pixel");
  }

  console.log("[pixel-management] ✅ Pixel deleted:", pixelId);

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

// ============================================================================
// Product Pixel Link Handlers
// ============================================================================

async function verifyProductOwnership(
  supabase: SupabaseClient,
  productId: string,
  producerId: string
): Promise<{ valid: boolean; error?: string }> {
  const { data: product, error } = await supabase
    .from("products")
    .select("id, user_id")
    .eq("id", productId)
    .single();

  if (error || !product) {
    return { valid: false, error: "Produto não encontrado" };
  }

  if (product.user_id !== producerId) {
    return { valid: false, error: "Acesso negado ao produto" };
  }

  return { valid: true };
}

async function handleListProductLinks(
  supabase: SupabaseClient,
  producerId: string,
  productId: string
): Promise<Response> {
  console.log("[pixel-management] Listing product pixel links:", productId);

  // Verify product ownership
  const ownership = await verifyProductOwnership(supabase, productId, producerId);
  if (!ownership.valid) {
    return new Response(
      JSON.stringify({ error: ownership.error }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // Buscar pixels do vendedor
  const { data: vendorPixels, error: pixelsError } = await supabase
    .from("vendor_pixels")
    .select("*")
    .eq("vendor_id", producerId)
    .order("platform", { ascending: true })
    .order("name", { ascending: true });

  if (pixelsError) {
    console.error("[pixel-management] Error listing vendor pixels:", pixelsError);
    throw new Error("Erro ao listar pixels");
  }

  // Buscar vínculos do produto
  const { data: links, error: linksError } = await supabase
    .from("product_pixels")
    .select("*")
    .eq("product_id", productId);

  if (linksError) {
    console.error("[pixel-management] Error listing product links:", linksError);
    throw new Error("Erro ao listar vínculos");
  }

  const pixels = (vendorPixels || []) as PixelRecord[];
  const productLinks = (links || []) as ProductPixelLink[];

  // Create map of linked pixels with link data
  const linkedPixels = pixels
    .filter((p) => productLinks.some((l) => l.pixel_id === p.id))
    .map((pixel) => ({
      ...pixel,
      link: productLinks.find((l) => l.pixel_id === pixel.id),
    }));

  return new Response(
    JSON.stringify({ success: true, vendorPixels: pixels, linkedPixels, links: productLinks }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

async function handleLinkToProduct(
  supabase: SupabaseClient,
  producerId: string,
  productId: string,
  pixelId: string,
  data: RequestBody["data"]
): Promise<Response> {
  console.log("[pixel-management] Linking pixel to product:", { pixelId, productId });

  // Verify product ownership
  const ownership = await verifyProductOwnership(supabase, productId, producerId);
  if (!ownership.valid) {
    return new Response(
      JSON.stringify({ error: ownership.error }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // Verify pixel ownership
  const { data: pixel, error: pixelError } = await supabase
    .from("vendor_pixels")
    .select("id, vendor_id")
    .eq("id", pixelId)
    .single();

  if (pixelError || !pixel) {
    return new Response(
      JSON.stringify({ error: "Pixel não encontrado" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  if (pixel.vendor_id !== producerId) {
    return new Response(
      JSON.stringify({ error: "Acesso negado ao pixel" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // Create link
  const { data: newLink, error: insertError } = await supabase
    .from("product_pixels")
    .insert({
      product_id: productId,
      pixel_id: pixelId,
      fire_on_initiate_checkout: data?.fire_on_initiate_checkout ?? true,
      fire_on_purchase: data?.fire_on_purchase ?? true,
      fire_on_pix: data?.fire_on_pix ?? true,
      fire_on_card: data?.fire_on_card ?? true,
      fire_on_boleto: data?.fire_on_boleto ?? true,
      custom_value_percent: data?.custom_value_percent ?? null,
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return new Response(
        JSON.stringify({ error: "Este pixel já está vinculado ao produto" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }
    console.error("[pixel-management] Error linking pixel:", insertError);
    throw new Error("Erro ao vincular pixel");
  }

  console.log("[pixel-management] ✅ Pixel linked:", newLink.id);

  return new Response(
    JSON.stringify({ success: true, link: newLink }),
    { status: 201, headers: { "Content-Type": "application/json" } }
  );
}

async function handleUnlinkFromProduct(
  supabase: SupabaseClient,
  producerId: string,
  productId: string,
  pixelId: string
): Promise<Response> {
  console.log("[pixel-management] Unlinking pixel from product:", { pixelId, productId });

  // Verify product ownership
  const ownership = await verifyProductOwnership(supabase, productId, producerId);
  if (!ownership.valid) {
    return new Response(
      JSON.stringify({ error: ownership.error }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // Delete link
  const { error } = await supabase
    .from("product_pixels")
    .delete()
    .eq("product_id", productId)
    .eq("pixel_id", pixelId);

  if (error) {
    console.error("[pixel-management] Error unlinking pixel:", error);
    throw new Error("Erro ao desvincular pixel");
  }

  console.log("[pixel-management] ✅ Pixel unlinked");

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

async function handleUpdateProductLink(
  supabase: SupabaseClient,
  producerId: string,
  productId: string,
  pixelId: string,
  data: RequestBody["data"]
): Promise<Response> {
  console.log("[pixel-management] Updating product pixel link:", { pixelId, productId });

  // Verify product ownership
  const ownership = await verifyProductOwnership(supabase, productId, producerId);
  if (!ownership.valid) {
    return new Response(
      JSON.stringify({ error: ownership.error }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // Build update data
  const updateData: Record<string, unknown> = {};
  if (data?.fire_on_initiate_checkout !== undefined) updateData.fire_on_initiate_checkout = data.fire_on_initiate_checkout;
  if (data?.fire_on_purchase !== undefined) updateData.fire_on_purchase = data.fire_on_purchase;
  if (data?.fire_on_pix !== undefined) updateData.fire_on_pix = data.fire_on_pix;
  if (data?.fire_on_card !== undefined) updateData.fire_on_card = data.fire_on_card;
  if (data?.fire_on_boleto !== undefined) updateData.fire_on_boleto = data.fire_on_boleto;
  if (data?.custom_value_percent !== undefined) updateData.custom_value_percent = data.custom_value_percent;

  const { data: updatedLink, error } = await supabase
    .from("product_pixels")
    .update(updateData)
    .eq("product_id", productId)
    .eq("pixel_id", pixelId)
    .select()
    .single();

  if (error) {
    console.error("[pixel-management] Error updating link:", error);
    throw new Error("Erro ao atualizar vínculo");
  }

  console.log("[pixel-management] ✅ Link updated");

  return new Response(
    JSON.stringify({ success: true, link: updatedLink }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

// ============================================================================
// Main Handler
// ============================================================================

Deno.serve(async (req) => {
  // CORS handling
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  try {
    // Validar sessão do produtor
    const sessionToken = req.headers.get("x-producer-session-token") || "";
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const sessionResult = await validateProducerSession(supabase, sessionToken);
    if (!sessionResult.valid || !sessionResult.producerId) {
      return new Response(
        JSON.stringify({ error: sessionResult.error || "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const producerId = sessionResult.producerId;

    // Parse body
    const body: RequestBody = await req.json();
    const { action, pixelId, data } = body;

    console.log(`[pixel-management] Action: ${action}, Producer: ${producerId}`);

    // Rate limiting
    const rateLimit = await checkRateLimit(supabase, producerId, action);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: "Muitas requisições. Tente novamente mais tarde.",
          retryAfter: rateLimit.retryAfter,
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(rateLimit.retryAfter || 300),
          } 
        }
      );
    }

    // Parse body
    const { productId } = body;

    // Router
    let response: Response;
    switch (action) {
      case "list":
        response = await handleList(supabase, producerId);
        break;
      case "create":
        response = await handleCreate(supabase, producerId, data);
        break;
      case "update":
        if (!pixelId) {
          return new Response(
            JSON.stringify({ error: "pixelId é obrigatório para update" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        response = await handleUpdate(supabase, producerId, pixelId, data);
        break;
      case "delete":
        if (!pixelId) {
          return new Response(
            JSON.stringify({ error: "pixelId é obrigatório para delete" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        response = await handleDelete(supabase, producerId, pixelId);
        break;

      // Product Pixel Link actions
      case "list-product-links":
        if (!productId) {
          return new Response(
            JSON.stringify({ error: "productId é obrigatório" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        response = await handleListProductLinks(supabase, producerId, productId);
        break;
      case "link-to-product":
        if (!productId || !pixelId) {
          return new Response(
            JSON.stringify({ error: "productId e pixelId são obrigatórios" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        response = await handleLinkToProduct(supabase, producerId, productId, pixelId, data);
        break;
      case "unlink-from-product":
        if (!productId || !pixelId) {
          return new Response(
            JSON.stringify({ error: "productId e pixelId são obrigatórios" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        response = await handleUnlinkFromProduct(supabase, producerId, productId, pixelId);
        break;
      case "update-product-link":
        if (!productId || !pixelId) {
          return new Response(
            JSON.stringify({ error: "productId e pixelId são obrigatórios" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        response = await handleUpdateProductLink(supabase, producerId, productId, pixelId, data);
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Ação desconhecida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Adicionar CORS headers à resposta
    const responseHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error("[pixel-management] ❌ Unhandled error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
