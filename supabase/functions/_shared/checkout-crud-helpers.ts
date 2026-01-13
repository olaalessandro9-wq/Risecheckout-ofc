/**
 * Shared helpers for checkout-crud Edge Function
 * Extracted for RISE Protocol compliance (< 300 lines per file)
 * 
 * @rise-protocol-compliant true
 * @version 2.0.0 - Zero `any` compliance
 */

import { SupabaseClient, CheckoutWithProduct, JsonResponseData } from "./supabase-types.ts";

// ============================================
// TYPES
// ============================================

interface SessionValidationResult {
  valid: boolean;
  producerId?: string;
  error?: string;
}

interface OwnershipValidationResult {
  valid: boolean;
  checkout?: CheckoutWithProduct;
}

interface ProducerSession {
  producer_id: string;
  expires_at: string;
  is_valid: boolean;
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
// RATE LIMITING
// ============================================

interface RateLimitAttempt {
  id: string;
}

export async function checkRateLimit(
  supabase: SupabaseClient,
  producerId: string,
  action: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const MAX_ATTEMPTS = 30;
  const WINDOW_MS = 5 * 60 * 1000;
  const windowStart = new Date(Date.now() - WINDOW_MS);

  const { data: attempts, error } = await supabase
    .from("rate_limit_attempts")
    .select("id")
    .eq("identifier", `producer:${producerId}`)
    .eq("action", action)
    .gte("created_at", windowStart.toISOString()) as { data: RateLimitAttempt[] | null; error: unknown };

  if (error) {
    console.error("[checkout-crud] Rate limit check error:", error);
    return { allowed: true };
  }

  const count = attempts?.length || 0;
  if (count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfter: 300 };
  }

  return { allowed: true };
}

export async function recordRateLimitAttempt(
  supabase: SupabaseClient,
  producerId: string,
  action: string
): Promise<void> {
  await supabase.from("rate_limit_attempts").insert({
    identifier: `producer:${producerId}`,
    action,
    success: true,
    created_at: new Date().toISOString(),
  });
}

// ============================================
// SESSION VALIDATION
// ============================================

export async function validateProducerSession(
  supabase: SupabaseClient,
  sessionToken: string
): Promise<SessionValidationResult> {
  if (!sessionToken) {
    return { valid: false, error: "Token de sessão não fornecido" };
  }

  const { data: session, error } = await supabase
    .from("producer_sessions")
    .select("producer_id, expires_at, is_valid")
    .eq("session_token", sessionToken)
    .single() as { data: ProducerSession | null; error: unknown };

  if (error || !session) {
    return { valid: false, error: "Sessão inválida" };
  }

  if (!session.is_valid) {
    return { valid: false, error: "Sessão expirada ou invalidada" };
  }

  if (new Date(session.expires_at) < new Date()) {
    await supabase
      .from("producer_sessions")
      .update({ is_valid: false })
      .eq("session_token", sessionToken);
    return { valid: false, error: "Sessão expirada" };
  }

  await supabase
    .from("producer_sessions")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("session_token", sessionToken);

  return { valid: true, producerId: session.producer_id };
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
