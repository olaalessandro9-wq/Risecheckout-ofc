/**
 * Pixel Management Handlers - Core CRUD
 * 
 * Handlers extraídos do index.ts para manter arquivos < 300 linhas
 * 
 * RISE Protocol V3 Compliant - Uses consolidated rate-limiting
 * @version 3.1.0 - Migrated to centralized logger
 * @refactored 2026-01-18 - jsonResponse signature standardized
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  PixelRecord, 
  ProductPixelLink, 
  PixelData,
  jsonResponse 
} from "./pixel-types.ts";
import { 
  checkRateLimit as checkRateLimitCore, 
  RATE_LIMIT_CONFIGS,
  type RateLimitResult 
} from "./rate-limiting/index.ts";
import { createLogger } from "./logger.ts";

const log = createLogger("PixelHandlers");

// Re-export rate limiting with simplified signature for API stability
export async function checkRateLimit(
  supabase: SupabaseClient,
  producerId: string,
  action: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const result: RateLimitResult = await checkRateLimitCore(
    supabase, 
    `pixel:${producerId}:${action}`, 
    RATE_LIMIT_CONFIGS.PIXEL_MANAGEMENT
  );
  
  // Convert ISO timestamp to seconds remaining
  let retryAfterSeconds: number | undefined;
  if (result.retryAfter) {
    const retryDate = new Date(result.retryAfter);
    retryAfterSeconds = Math.max(0, Math.ceil((retryDate.getTime() - Date.now()) / 1000));
  }
  
  return { allowed: result.allowed, retryAfter: retryAfterSeconds };
}

// ============================================================================
// Vendor Pixel Handlers
// ============================================================================

export async function handleList(
  supabase: SupabaseClient,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  log.info("Listing pixels for producer", { producerId });

  const { data: pixelsData, error: pixelsError } = await supabase
    .from("vendor_pixels")
    .select("*")
    .eq("vendor_id", producerId)
    .order("platform", { ascending: true })
    .order("name", { ascending: true });

  if (pixelsError) {
    log.error("Error listing pixels", pixelsError);
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

  const enrichedPixels = pixels.map((pixel) => ({
    ...pixel,
    linked_products_count: linkedCounts[pixel.id] || 0,
  }));

  return jsonResponse({ success: true, pixels: enrichedPixels }, corsHeaders);
}

export async function handleCreate(
  supabase: SupabaseClient,
  producerId: string,
  data: PixelData | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  log.info("Creating pixel for producer", { producerId });

  if (!data?.platform || !data?.name || !data?.pixel_id) {
    return jsonResponse({ error: "Dados obrigatórios: platform, name, pixel_id" }, corsHeaders, 400);
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
      return jsonResponse({ error: "Este Pixel ID já está cadastrado para esta plataforma" }, corsHeaders, 409);
    }
    log.error("Error creating pixel", error);
    throw new Error("Erro ao criar pixel");
  }

  const pixel = newPixel as PixelRecord;
  log.info("✅ Pixel created", { pixelId: pixel.id });

  return jsonResponse({ success: true, pixel }, corsHeaders, 201);
}

export async function handleUpdate(
  supabase: SupabaseClient,
  producerId: string,
  pixelId: string,
  data: PixelData | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  log.info("Updating pixel", { pixelId });

  const { data: existing, error: fetchError } = await supabase
    .from("vendor_pixels")
    .select("id, vendor_id")
    .eq("id", pixelId)
    .single();

  if (fetchError || !existing) {
    return jsonResponse({ error: "Pixel não encontrado" }, corsHeaders, 404);
  }

  const existingPixel = existing as Pick<PixelRecord, "id" | "vendor_id">;

  if (existingPixel.vendor_id !== producerId) {
    log.warn("⚠️ Ownership violation", { producerId, ownerId: existingPixel.vendor_id });
    return jsonResponse({ error: "Acesso negado" }, corsHeaders, 403);
  }

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
    log.error("Error updating pixel", error);
    throw new Error("Erro ao atualizar pixel");
  }

  log.info("✅ Pixel updated", { pixelId });

  return jsonResponse({ success: true, pixel: updatedPixel }, corsHeaders);
}

export async function handleDelete(
  supabase: SupabaseClient,
  producerId: string,
  pixelId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  log.info("Deleting pixel", { pixelId });

  const { data: existing, error: fetchError } = await supabase
    .from("vendor_pixels")
    .select("id, vendor_id")
    .eq("id", pixelId)
    .single();

  if (fetchError || !existing) {
    return jsonResponse({ error: "Pixel não encontrado" }, corsHeaders, 404);
  }

  const existingPixel = existing as Pick<PixelRecord, "id" | "vendor_id">;

  if (existingPixel.vendor_id !== producerId) {
    log.warn("⚠️ Ownership violation", { producerId, ownerId: existingPixel.vendor_id });
    return jsonResponse({ error: "Acesso negado" }, corsHeaders, 403);
  }

  const { error } = await supabase
    .from("vendor_pixels")
    .delete()
    .eq("id", pixelId);

  if (error) {
    log.error("Error deleting pixel", error);
    throw new Error("Erro ao excluir pixel");
  }

  log.info("✅ Pixel deleted", { pixelId });

  return jsonResponse({ success: true }, corsHeaders);
}
