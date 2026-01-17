/**
 * Edge Function Shared Helpers
 * 
 * Funções comuns reutilizáveis por múltiplas Edge Functions:
 * - Rate limiting
 * - Session validation
 * - Ownership verification
 * - Response helpers
 * 
 * @refactored 2026-01-13 - Centralização de código duplicado
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// Response Helpers
// ============================================================================

export function jsonResponse(
  data: unknown, 
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

// ============================================================================
// Rate Limiting
// ============================================================================

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  action: string;
}

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 30,
  windowMs: 5 * 60 * 1000, // 5 minutos
  action: "generic",
};

export const STRICT_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 5 * 60 * 1000, // 5 minutos
  action: "strict_operation",
};

export async function checkRateLimit(
  supabase: SupabaseClient,
  producerId: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const windowStart = new Date(Date.now() - config.windowMs);

  const { data: attempts, error } = await supabase
    .from("rate_limit_attempts")
    .select("id")
    .eq("identifier", `producer:${producerId}`)
    .eq("action", config.action)
    .gte("created_at", windowStart.toISOString());

  if (error) {
    console.error(`[rate-limit] Check error for ${config.action}:`, error);
    return { allowed: true }; // Fail open
  }

  const count = attempts?.length || 0;
  if (count >= config.maxAttempts) {
    return { allowed: false, retryAfter: Math.ceil(config.windowMs / 1000) };
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

// ============================================================================
// Session Validation (DEPRECATED - Use unified-auth.ts instead)
// ============================================================================
// NOTE: This is kept for backwards compatibility with legacy code.
// New code should use requireAuthenticatedProducer from unified-auth.ts
// 
// @deprecated Use unified-auth.ts for authentication

// ============================================================================
// Ownership Verification
// ============================================================================

export interface OwnershipResult {
  valid: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

export async function verifyProductOwnership(
  supabase: SupabaseClient,
  productId: string,
  producerId: string
): Promise<OwnershipResult> {
  const { data: product, error } = await supabase
    .from("products")
    .select("id, user_id, name, members_area_enabled")
    .eq("id", productId)
    .single();

  if (error || !product) {
    return { valid: false, error: "Produto não encontrado" };
  }

  if (product.user_id !== producerId) {
    return { valid: false, error: "Você não tem permissão para acessar este produto" };
  }

  return { valid: true, data: product };
}

export async function verifyModuleOwnership(
  supabase: SupabaseClient,
  moduleId: string,
  producerId: string
): Promise<OwnershipResult & { productId?: string }> {
  const { data: module, error } = await supabase
    .from("product_member_modules")
    .select(`
      id,
      product_id,
      products!inner(user_id)
    `)
    .eq("id", moduleId)
    .single();

  if (error || !module) {
    return { valid: false, error: "Módulo não encontrado" };
  }

  // Handle both array and object responses from join
  const products = Array.isArray(module.products) ? module.products[0] : module.products;
  if (!products || products.user_id !== producerId) {
    return { valid: false, error: "Você não tem permissão para acessar este módulo" };
  }

  return { valid: true, productId: module.product_id };
}

// ============================================================================
// Slug Helpers
// ============================================================================

export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

export async function ensureUniqueSlug(
  supabase: SupabaseClient,
  table: string,
  column: string,
  baseSlug: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  const maxAttempts = 100;

  while (counter <= maxAttempts) {
    const { data, error } = await supabase
      .from(table)
      .select("id")
      .eq(column, slug)
      .maybeSingle();

    if (error || !data) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return `${baseSlug}-${Date.now()}`;
}

export async function ensureUniqueName(
  supabase: SupabaseClient,
  baseName: string
): Promise<string> {
  let name = baseName;
  let counter = 1;
  const maxAttempts = 100;

  while (counter <= maxAttempts) {
    const { data, error } = await supabase
      .from("products")
      .select("id")
      .eq("name", name)
      .maybeSingle();

    if (error || !data) {
      return name;
    }

    counter++;
    name = `${baseName} ${counter}`;
  }

  return `${baseName} ${Date.now()}`;
}
