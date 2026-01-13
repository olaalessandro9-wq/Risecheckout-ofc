/**
 * Pixel Management Handlers - Core CRUD
 * 
 * Handlers extraídos do index.ts para manter arquivos < 300 linhas
 * 
 * @refactored 2026-01-13 - Rate limiting extraído para pixel-rate-limit.ts
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  PixelRecord, 
  ProductPixelLink, 
  PixelData,
  jsonResponse 
} from "./pixel-types.ts";

// Re-export rate limiting utilities for backwards compatibility
export { checkRateLimit, validateProducerSession } from "./pixel-rate-limit.ts";

// ============================================================================
// Vendor Pixel Handlers
// ============================================================================

export async function handleList(
  supabase: SupabaseClient,
  producerId: string
): Promise<Response> {
  console.log("[pixel-management] Listing pixels for producer:", producerId);

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

  const enrichedPixels = pixels.map((pixel) => ({
    ...pixel,
    linked_products_count: linkedCounts[pixel.id] || 0,
  }));

  return jsonResponse({ success: true, pixels: enrichedPixels });
}

export async function handleCreate(
  supabase: SupabaseClient,
  producerId: string,
  data: PixelData | undefined
): Promise<Response> {
  console.log("[pixel-management] Creating pixel for producer:", producerId);

  if (!data?.platform || !data?.name || !data?.pixel_id) {
    return jsonResponse({ error: "Dados obrigatórios: platform, name, pixel_id" }, 400);
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
      return jsonResponse({ error: "Este Pixel ID já está cadastrado para esta plataforma" }, 409);
    }
    console.error("[pixel-management] Error creating pixel:", error);
    throw new Error("Erro ao criar pixel");
  }

  const pixel = newPixel as PixelRecord;
  console.log("[pixel-management] ✅ Pixel created:", pixel.id);

  return jsonResponse({ success: true, pixel }, 201);
}

export async function handleUpdate(
  supabase: SupabaseClient,
  producerId: string,
  pixelId: string,
  data: PixelData | undefined
): Promise<Response> {
  console.log("[pixel-management] Updating pixel:", pixelId);

  const { data: existing, error: fetchError } = await supabase
    .from("vendor_pixels")
    .select("id, vendor_id")
    .eq("id", pixelId)
    .single();

  if (fetchError || !existing) {
    return jsonResponse({ error: "Pixel não encontrado" }, 404);
  }

  const existingPixel = existing as Pick<PixelRecord, "id" | "vendor_id">;

  if (existingPixel.vendor_id !== producerId) {
    console.error("[pixel-management] ⚠️ Ownership violation - producer:", producerId, "owner:", existingPixel.vendor_id);
    return jsonResponse({ error: "Acesso negado" }, 403);
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
    console.error("[pixel-management] Error updating pixel:", error);
    throw new Error("Erro ao atualizar pixel");
  }

  console.log("[pixel-management] ✅ Pixel updated:", pixelId);

  return jsonResponse({ success: true, pixel: updatedPixel });
}

export async function handleDelete(
  supabase: SupabaseClient,
  producerId: string,
  pixelId: string
): Promise<Response> {
  console.log("[pixel-management] Deleting pixel:", pixelId);

  const { data: existing, error: fetchError } = await supabase
    .from("vendor_pixels")
    .select("id, vendor_id")
    .eq("id", pixelId)
    .single();

  if (fetchError || !existing) {
    return jsonResponse({ error: "Pixel não encontrado" }, 404);
  }

  const existingPixel = existing as Pick<PixelRecord, "id" | "vendor_id">;

  if (existingPixel.vendor_id !== producerId) {
    console.error("[pixel-management] ⚠️ Ownership violation - producer:", producerId, "owner:", existingPixel.vendor_id);
    return jsonResponse({ error: "Acesso negado" }, 403);
  }

  const { error } = await supabase
    .from("vendor_pixels")
    .delete()
    .eq("id", pixelId);

  if (error) {
    console.error("[pixel-management] Error deleting pixel:", error);
    throw new Error("Erro ao excluir pixel");
  }

  console.log("[pixel-management] ✅ Pixel deleted:", pixelId);

  return jsonResponse({ success: true });
}
