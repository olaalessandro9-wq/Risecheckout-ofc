/**
 * Shared helpers for checkout-crud Edge Function
 * Extracted for RISE Protocol compliance (< 300 lines per file)
 * 
 * RISE Protocol V3 Compliant:
 * - Response helpers from response-helpers.ts
 * - Uses consolidated rate-limiting
 * @version 3.0.0
 */

import { SupabaseClient, CheckoutWithProduct, JsonResponseData } from "./supabase-types.ts";
import { 
  checkRateLimit as checkRateLimitCore, 
  RATE_LIMIT_CONFIGS,
  type RateLimitResult 
} from "./rate-limiting/index.ts";
import { jsonResponse as jsonResponseBase, errorResponse as errorResponseBase } from "./response-helpers.ts";

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
// RESPONSE HELPERS - Wrapper for type compatibility
// ============================================

export function jsonResponse(data: JsonResponseData, corsHeaders: Record<string, string>, status = 200): Response {
  return jsonResponseBase(data, corsHeaders, status);
}

export function errorResponse(message: string, corsHeaders: Record<string, string>, status = 400): Response {
  return errorResponseBase(message, corsHeaders, status);
}

// ============================================
// RATE LIMITING (RISE V3 - simplified signature wrapper)
// ============================================

/**
 * Rate limit check with simplified signature for API stability.
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

// ============================================
// DEFAULT CHECKOUT MANAGEMENT
// ============================================

interface SetDefaultResult {
  success: boolean;
  error?: string;
}

/**
 * Define um checkout como padrão, desmarcando os outros do mesmo produto.
 * Executa na ordem correta para respeitar a constraint unique_default_checkout_per_product.
 * 
 * RISE V3 Compliant: Single Source of Truth para lógica de default.
 * 
 * @param supabase - Cliente Supabase
 * @param checkoutId - ID do checkout a definir como padrão
 * @param productId - ID do produto (para desmarcar outros checkouts)
 * @returns success: true se operação completou, false se houve erro
 */
export async function setCheckoutAsDefault(
  supabase: SupabaseClient,
  checkoutId: string,
  productId: string
): Promise<SetDefaultResult> {
  // PASSO 1: Desmarcar TODOS os checkouts do produto (ordem obrigatória)
  const { error: unsetError } = await supabase
    .from("checkouts")
    .update({ is_default: false })
    .eq("product_id", productId);
    
  if (unsetError) {
    return { success: false, error: `Falha ao desmarcar checkouts: ${unsetError.message}` };
  }
  
  // PASSO 2: Marcar o checkout específico como padrão
  const { error: setError } = await supabase
    .from("checkouts")
    .update({ is_default: true })
    .eq("id", checkoutId);
    
  if (setError) {
    return { success: false, error: `Falha ao definir checkout padrão: ${setError.message}` };
  }
  
  return { success: true };
}
