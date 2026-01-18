/**
 * Shared helpers for checkout-crud Edge Function
 * Extracted for RISE Protocol compliance (< 300 lines per file)
 * 
 * @version 2.0.0
 */

import { SupabaseClient, CheckoutWithProduct, JsonResponseData } from "./supabase-types.ts";
import { 
  checkRateLimit as checkRateLimitCore, 
  RATE_LIMIT_CONFIGS 
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
// RATE LIMITING (re-export from consolidated module)
// ============================================

export async function checkRateLimit(
  supabase: SupabaseClient,
  producerId: string,
  _action: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const result = await checkRateLimitCore(
    supabase, 
    `producer:${producerId}`, 
    RATE_LIMIT_CONFIGS.PRODUCER_ACTION
  );
  return { 
    allowed: result.allowed, 
    retryAfter: result.retryAfter ? 300 : undefined 
  };
}

// recordRateLimitAttempt is no longer needed - consolidated module auto-records

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
