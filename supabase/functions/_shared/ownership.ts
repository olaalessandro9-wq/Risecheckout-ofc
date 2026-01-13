/**
 * Ownership Verification Utilities
 * 
 * Centralizes ownership verification logic for products, checkouts, offers, etc.
 * 
 * @version 1.0.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Verifies that a producer owns a product
 */
export async function verifyProductOwnership(
  supabase: SupabaseClient,
  productId: string,
  producerId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("user_id", producerId)
    .single();

  return !error && !!data;
}

/**
 * Verifies that a producer owns a checkout (via product)
 */
export async function verifyCheckoutOwnership(
  supabase: SupabaseClient,
  checkoutId: string,
  producerId: string
): Promise<{ valid: boolean; checkout?: Record<string, unknown> }> {
  const { data, error } = await supabase
    .from("checkouts")
    .select("id, name, is_default, product_id, products!inner(user_id)")
    .eq("id", checkoutId)
    .single();

  if (error || !data) {
    return { valid: false };
  }

  const product = data.products as { user_id: string } | null;
  if (product?.user_id !== producerId) {
    return { valid: false };
  }

  return { valid: true, checkout: data as Record<string, unknown> };
}

/**
 * Verifies that a producer owns an offer (via product)
 */
export async function verifyOfferOwnership(
  supabase: SupabaseClient,
  offerId: string,
  producerId: string
): Promise<{ valid: boolean; productId?: string }> {
  const { data, error } = await supabase
    .from("offers")
    .select("id, product_id, products!inner(user_id)")
    .eq("id", offerId)
    .single();

  if (error || !data) {
    return { valid: false };
  }

  const product = data.products as { user_id: string } | null;
  if (product?.user_id !== producerId) {
    return { valid: false };
  }

  return { valid: true, productId: data.product_id };
}

/**
 * Verifies that a producer owns an order bump (via checkout → product)
 */
export async function verifyOrderBumpOwnership(
  supabase: SupabaseClient,
  orderBumpId: string,
  producerId: string
): Promise<{ valid: boolean; orderBump?: Record<string, unknown> }> {
  const { data, error } = await supabase
    .from("order_bumps")
    .select(`
      id, 
      checkout_id,
      checkouts!inner(
        product_id,
        products!inner(user_id)
      )
    `)
    .eq("id", orderBumpId)
    .single();

  if (error || !data) {
    return { valid: false };
  }

  const checkout = data.checkouts as { products: { user_id: string } } | null;
  if (checkout?.products?.user_id !== producerId) {
    return { valid: false };
  }

  return { valid: true, orderBump: data as Record<string, unknown> };
}

/**
 * Verifies that a producer owns a pixel
 */
export async function verifyPixelOwnership(
  supabase: SupabaseClient,
  pixelId: string,
  producerId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("vendor_pixels")
    .select("id")
    .eq("id", pixelId)
    .eq("vendor_id", producerId)
    .single();

  return !error && !!data;
}
