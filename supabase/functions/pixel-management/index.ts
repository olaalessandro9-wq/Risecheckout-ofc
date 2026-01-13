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
  action: "list" | "create" | "update" | "delete";
  pixelId?: string;
  data?: {
    platform?: string;
    name?: string;
    pixel_id?: string;
    access_token?: string | null;
    conversion_label?: string | null;
    domain?: string | null;
    is_active?: boolean;
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
  pixel_id: string;
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
