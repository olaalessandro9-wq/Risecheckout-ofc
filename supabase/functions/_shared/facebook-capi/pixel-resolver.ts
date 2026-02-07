/**
 * ============================================================================
 * Facebook CAPI Pixel Resolver
 * ============================================================================
 * 
 * @module _shared/facebook-capi/pixel-resolver
 * @version 1.0.0 - RISE Protocol V3
 * 
 * Resolves all active Facebook pixels for a given product,
 * including their access tokens and event configuration.
 * 
 * Schema:
 *   vendor_pixels: id, vendor_id, platform, pixel_id, access_token, domain, is_active
 *   product_pixels: id, product_id, pixel_id→vendor_pixels.id, fire_on_purchase,
 *                   fire_on_pix, fire_on_card, fire_on_boleto, custom_value_percent
 * ============================================================================
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../logger.ts";
import type { ResolvedFacebookPixel } from "./types.ts";

const log = createLogger("FacebookPixelResolver");

/**
 * Maps payment method string to the corresponding fire_on_* column
 */
function getFireOnColumn(paymentMethod: string): string {
  switch (paymentMethod.toLowerCase()) {
    case 'pix':
      return 'fire_on_pix';
    case 'credit_card':
    case 'card':
      return 'fire_on_card';
    case 'boleto':
      return 'fire_on_boleto';
    default:
      return 'fire_on_purchase';
  }
}

/**
 * Resolves all active Facebook pixels configured for a product
 * that should fire for a given payment method.
 * 
 * @param supabase - Supabase client with service role
 * @param productId - The product UUID
 * @param paymentMethod - Payment method (pix, credit_card, boleto)
 * @returns Array of resolved pixels (empty if none configured)
 */
export async function resolveFacebookPixels(
  supabase: SupabaseClient,
  productId: string,
  paymentMethod: string
): Promise<ResolvedFacebookPixel[]> {
  
  // Query product_pixels joined with vendor_pixels for Facebook platform
  const { data, error } = await supabase
    .from("product_pixels")
    .select(`
      custom_value_percent,
      vendor_pixels!inner (
        id,
        pixel_id,
        access_token,
        domain,
        is_active,
        platform
      )
    `)
    .eq("product_id", productId)
    .eq("fire_on_purchase", true);

  if (error) {
    log.error(`Error resolving Facebook pixels for product ${productId}:`, {
      code: error.code,
      message: error.message,
    });
    return [];
  }

  if (!data || data.length === 0) {
    log.info(`No pixels configured for product ${productId}`);
    return [];
  }

  // Filter and map results
  const fireOnCol = getFireOnColumn(paymentMethod);
  const resolved: ResolvedFacebookPixel[] = [];

  for (const row of data) {
    const vp = row.vendor_pixels as unknown as {
      id: string;
      pixel_id: string;
      access_token: string;
      domain: string | null;
      is_active: boolean;
      platform: string;
    };

    // Skip non-Facebook, inactive, or missing access_token
    if (!vp || vp.platform !== 'facebook' || !vp.is_active || !vp.access_token) {
      continue;
    }

    // Check payment-method-specific flag (if not fire_on_purchase which we already filtered)
    if (fireOnCol !== 'fire_on_purchase') {
      const rowData = row as Record<string, unknown>;
      if (rowData[fireOnCol] === false) {
        continue;
      }
    }

    resolved.push({
      vendorPixelId: vp.id,
      pixelId: vp.pixel_id,
      accessToken: vp.access_token,
      domain: vp.domain,
      customValuePercent: row.custom_value_percent,
    });
  }

  log.info(`Resolved ${resolved.length} Facebook pixel(s) for product ${productId}`);
  return resolved;
}
