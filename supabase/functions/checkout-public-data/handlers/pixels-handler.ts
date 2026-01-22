/**
 * Pixels Handler
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Handles product pixels fetching for tracking.
 * 
 * @module checkout-public-data/handlers/pixels
 */

import { createLogger } from "../../_shared/logger.ts";
import type { HandlerContext, PixelData } from "../types.ts";

const log = createLogger("checkout-public-data/pixels");

interface PixelLink {
  pixel_id: string;
  fire_on_initiate_checkout: boolean;
  fire_on_purchase: boolean;
  fire_on_pix: boolean;
  fire_on_card: boolean;
  fire_on_boleto: boolean;
  custom_value_percent: number | null;
}

interface VendorPixel {
  id: string;
  platform: string;
  pixel_id: string;
  access_token: string | null;
  conversion_label: string | null;
  domain: string | null;
  is_active: boolean;
}

export async function handleProductPixels(ctx: HandlerContext): Promise<Response> {
  const { supabase, body, jsonResponse } = ctx;
  const { productId } = body;

  if (!productId) {
    return jsonResponse({ error: "productId required" }, 400);
  }

  // Fetch pixel links for this product
  const { data: links, error: linksError } = await supabase
    .from("product_pixels")
    .select(`
      pixel_id,
      fire_on_initiate_checkout,
      fire_on_purchase,
      fire_on_pix,
      fire_on_card,
      fire_on_boleto,
      custom_value_percent
    `)
    .eq("product_id", productId);

  if (linksError) {
    log.error("Product pixels links error:", linksError);
    return jsonResponse({ success: true, data: [] });
  }

  if (!links || links.length === 0) {
    return jsonResponse({ success: true, data: [] });
  }

  // Fetch actual pixel data
  const pixelIds = (links as PixelLink[]).map(l => l.pixel_id);
  const { data: pixelsData, error: pixelsError } = await supabase
    .from("vendor_pixels")
    .select("id, platform, pixel_id, access_token, conversion_label, domain, is_active")
    .in("id", pixelIds)
    .eq("is_active", true);

  if (pixelsError) {
    log.error("Pixels data error:", pixelsError);
    return jsonResponse({ success: true, data: [] });
  }

  // Combine data
  const combined: PixelData[] = [];
  for (const link of links as PixelLink[]) {
    const pixel = (pixelsData as VendorPixel[] | null)?.find(p => p.id === link.pixel_id);
    if (pixel && pixel.is_active) {
      combined.push({
        id: pixel.id,
        platform: pixel.platform,
        pixel_id: pixel.pixel_id,
        access_token: pixel.access_token,
        conversion_label: pixel.conversion_label,
        domain: pixel.domain,
        is_active: pixel.is_active,
        fire_on_initiate_checkout: link.fire_on_initiate_checkout,
        fire_on_purchase: link.fire_on_purchase,
        fire_on_pix: link.fire_on_pix,
        fire_on_card: link.fire_on_card,
        fire_on_boleto: link.fire_on_boleto,
        custom_value_percent: link.custom_value_percent,
      });
    }
  }

  return jsonResponse({ success: true, data: combined });
}
