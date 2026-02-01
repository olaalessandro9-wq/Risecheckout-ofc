/**
 * order-bump-crud Helpers
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Shared utility functions for order bump CRUD operations.
 * 
 * @module order-bump-crud/helpers
 */

import type { JsonResponseData, OrderBumpWithOwner, ProductWithOwner } from "./types.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// RESPONSE HELPERS
// ============================================

export function jsonResponse(
  data: JsonResponseData, 
  corsHeaders: Record<string, string>, 
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errorResponse(
  message: string, 
  corsHeaders: Record<string, string>, 
  status = 400
): Response {
  return jsonResponse({ success: false, error: message }, corsHeaders, status);
}

// ============================================
// OWNERSHIP VERIFICATION
// ============================================

/**
 * RISE V3: Verify product ownership for order bump creation
 * Now checks product directly, not via checkout
 */
export async function verifyProductForOrderBump(
  supabase: SupabaseClient, 
  productId: string, 
  producerId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("products")
    .select("id, user_id")
    .eq("id", productId)
    .single();

  if (error || !data) return false;
  
  const product = data as ProductWithOwner;
  return product.user_id === producerId;
}

/**
 * Extract user_id from products join result.
 * Supabase may return single object or array depending on query.
 */
export function extractOwnerUserId(
  products: { user_id: string } | { user_id: string }[] | null | undefined
): string | null {
  if (!products) return null;
  if (Array.isArray(products)) {
    return products[0]?.user_id ?? null;
  }
  return products.user_id;
}

/**
 * RISE V3: Verify order bump ownership via parent_product_id
 */
export async function verifyOrderBumpOwnership(
  supabase: SupabaseClient,
  orderBumpId: string,
  producerId: string
): Promise<{ valid: boolean; orderBump?: Record<string, unknown> }> {
  const { data, error } = await supabase
    .from("order_bumps")
    .select(`id, parent_product_id, products!order_bumps_parent_product_id_fkey(user_id)`)
    .eq("id", orderBumpId)
    .single();

  if (error || !data) return { valid: false };
  
  // RISE V3: Type assertion to explicit interface - Supabase returns generic join type
  const orderBumpData = data as unknown as OrderBumpWithOwner;
  const ownerUserId = extractOwnerUserId(orderBumpData.products);
  if (ownerUserId !== producerId) return { valid: false };
  return { valid: true, orderBump: data as Record<string, unknown> };
}

// ============================================
// PARENT PRODUCT RESOLUTION
// ============================================

/**
 * Resolve parent_product_id from checkoutId (backwards compatibility)
 */
export async function resolveParentProductId(
  supabase: SupabaseClient,
  parentProductId: string | undefined,
  checkoutId: string | undefined
): Promise<string | undefined> {
  if (parentProductId) return parentProductId;
  
  if (checkoutId) {
    const { data: checkout } = await supabase
      .from("checkouts")
      .select("product_id")
      .eq("id", checkoutId)
      .maybeSingle();
    return checkout?.product_id;
  }
  
  return undefined;
}
