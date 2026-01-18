/**
 * Shared helpers for checkout-crud Edge Function
 * Extracted for RISE Protocol compliance (< 300 lines per file)
 * 
 * RISE Protocol V3 Compliant - Uses consolidated rate-limiting
 * @version 3.0.0
 */

import { SupabaseClient, CheckoutWithProduct, JsonResponseData } from "./supabase-types.ts";
import { 
  checkRateLimit as checkRateLimitCore, 
  RATE_LIMIT_CONFIGS,
  type RateLimitResult 
} from "./rate-limiting/index.ts";

// ============================================
// TYPES
// ============================================

interface OwnershipValidationResult {
  valid: boolean;
  checkout?: CheckoutWithProduct;
}

interface ProductOwnership {
  id: string;
  user_id: string;
}

// ============================================
// RESPONSE HELPERS
// ============================================

export function jsonResponse(data: JsonResponseData, corsHeaders: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errorResponse(message: string, corsHeaders: Record<string, string>, status = 400): Response {
  return jsonResponse({ success: false, error: message }, corsHeaders, status);
}

// ============================================
// RATE LIMITING (RISE V3 - wrapper for legacy signature)
// ============================================

/**
 * Rate limit check with legacy signature for backwards compatibility.
 * Delegates to consolidated rate-limiting module.
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  producerId: string,
  action: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const result: RateLimitResult = await checkRateLimitCore(
    supabase, 
    `producer:${producerId}:${action}`, 
    RATE_LIMIT_CONFIGS.PRODUCER_ACTION
  );
  
  // Convert ISO timestamp to seconds remaining
  let retryAfterSeconds: number | undefined;
  if (result.retryAfter) {
    const retryDate = new Date(result.retryAfter);
    retryAfterSeconds = Math.max(0, Math.ceil((retryDate.getTime() - Date.now()) / 1000));
  }
  
  return { 
    allowed: result.allowed, 
    retryAfter: retryAfterSeconds 
  };
}

// ============================================
// SESSION VALIDATION (DEPRECATED)
// ============================================
// NOTE: Use unified-auth.ts instead for authentication
// This is kept for backwards compatibility only
// @deprecated Use requireAuthenticatedProducer from unified-auth.ts

// ============================================
// OWNERSHIP VERIFICATION
// ============================================

export async function verifyCheckoutOwnership(
  supabase: SupabaseClient,
  checkoutId: string,
  producerId: string
): Promise<OwnershipValidationResult> {
  const { data, error } = await supabase
    .from("checkouts")
    .select("id, name, is_default, product_id, products!inner(user_id)")
    .eq("id", checkoutId)
    .single() as { data: CheckoutWithProduct | null; error: unknown };

  if (error || !data) return { valid: false };

  const product = data.products;
  if (product?.user_id !== producerId) return { valid: false };

  return { valid: true, checkout: data };
}

export async function verifyProductOwnership(
  supabase: SupabaseClient,
  productId: string,
  producerId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("products")
    .select("id, user_id")
    .eq("id", productId)
    .single() as { data: ProductOwnership | null; error: unknown };

  if (error || !data) return false;
  return data.user_id === producerId;
}
