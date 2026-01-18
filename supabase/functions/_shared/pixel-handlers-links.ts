/**
 * Pixel Management Handlers - Product Links
 * 
 * Handlers para gerenciamento de vínculos entre pixels e produtos
 * 
 * @refactored 2026-01-18 - jsonResponse signature standardized
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  PixelRecord, 
  ProductPixelLink, 
  PixelData,
  jsonResponse 
} from "./pixel-types.ts";

// ============================================================================
// Product Ownership Verification
// ============================================================================

export async function verifyProductOwnership(
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

// ============================================================================
// Product Pixel Link Handlers
// ============================================================================

export async function handleListProductLinks(
  supabase: SupabaseClient,
  producerId: string,
  productId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  console.log("[pixel-management] Listing product pixel links:", productId);

  const ownership = await verifyProductOwnership(supabase, productId, producerId);
  if (!ownership.valid) {
    return jsonResponse({ error: ownership.error }, corsHeaders, 403);
  }

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

  const linkedPixels = pixels
    .filter((p) => productLinks.some((l) => l.pixel_id === p.id))
    .map((pixel) => ({
      ...pixel,
      link: productLinks.find((l) => l.pixel_id === pixel.id),
    }));

  return jsonResponse({ success: true, vendorPixels: pixels, linkedPixels, links: productLinks }, corsHeaders);
}

export async function handleLinkToProduct(
  supabase: SupabaseClient,
  producerId: string,
  productId: string,
  pixelId: string,
  data: PixelData | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  console.log("[pixel-management] Linking pixel to product:", { pixelId, productId });

  const ownership = await verifyProductOwnership(supabase, productId, producerId);
  if (!ownership.valid) {
    return jsonResponse({ error: ownership.error }, corsHeaders, 403);
  }

  const { data: pixel, error: pixelError } = await supabase
    .from("vendor_pixels")
    .select("id, vendor_id")
    .eq("id", pixelId)
    .single();

  if (pixelError || !pixel) {
    return jsonResponse({ error: "Pixel não encontrado" }, corsHeaders, 404);
  }

  if (pixel.vendor_id !== producerId) {
    return jsonResponse({ error: "Acesso negado ao pixel" }, corsHeaders, 403);
  }

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
      return jsonResponse({ error: "Este pixel já está vinculado ao produto" }, corsHeaders, 409);
    }
    console.error("[pixel-management] Error linking pixel:", insertError);
    throw new Error("Erro ao vincular pixel");
  }

  console.log("[pixel-management] ✅ Pixel linked:", newLink.id);

  return jsonResponse({ success: true, link: newLink }, corsHeaders, 201);
}

export async function handleUnlinkFromProduct(
  supabase: SupabaseClient,
  producerId: string,
  productId: string,
  pixelId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  console.log("[pixel-management] Unlinking pixel from product:", { pixelId, productId });

  const ownership = await verifyProductOwnership(supabase, productId, producerId);
  if (!ownership.valid) {
    return jsonResponse({ error: ownership.error }, corsHeaders, 403);
  }

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

  return jsonResponse({ success: true }, corsHeaders);
}

export async function handleUpdateProductLink(
  supabase: SupabaseClient,
  producerId: string,
  productId: string,
  pixelId: string,
  data: PixelData | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  console.log("[pixel-management] Updating product pixel link:", { pixelId, productId });

  const ownership = await verifyProductOwnership(supabase, productId, producerId);
  if (!ownership.valid) {
    return jsonResponse({ error: ownership.error }, corsHeaders, 403);
  }

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

  return jsonResponse({ success: true, link: updatedLink }, corsHeaders);
}
