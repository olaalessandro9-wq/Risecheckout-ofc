/**
 * Edge Function Shared Helpers
 * 
 * Funções comuns reutilizáveis por múltiplas Edge Functions:
 * - Rate limiting
 * - Session validation
 * - Ownership verification
 * - Response helpers (delegated to response-helpers.ts)
 * 
 * RISE V3: Response helpers imported from response-helpers.ts
 * @refactored 2026-01-18 - Centralized response helpers
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// Response Helpers - Re-exported from response-helpers.ts
// ============================================================================

export { jsonResponse, errorResponse } from "./response-helpers.ts";

// ============================================================================
// Rate Limiting (Deprecated - use _shared/rate-limiting/ module)
// ============================================================================
// NOTE: Rate limiting has been consolidated into _shared/rate-limiting/
// These exports are kept for API stability only.
// New code should import directly from _shared/rate-limiting/index.ts

export {
  checkRateLimit,
  RATE_LIMIT_CONFIGS,
  type RateLimitConfig,
} from "./rate-limiting/index.ts";

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
