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
// Rate Limiting (Re-exported for convenience)
// ============================================================================
// The rate limiting module is in _shared/rate-limiting/
// These exports provide a convenient access point through edge-helpers.

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
  const MAX_LENGTH = 100;
  let name = baseName.substring(0, MAX_LENGTH);
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
    const suffix = ` ${counter}`;
    const maxBase = MAX_LENGTH - suffix.length;
    const truncatedBase = baseName.length > maxBase 
      ? baseName.substring(0, maxBase) 
      : baseName;
    name = `${truncatedBase}${suffix}`;
  }

  const finalSuffix = ` ${Date.now()}`;
  const maxBase = MAX_LENGTH - finalSuffix.length;
  return `${baseName.substring(0, maxBase)}${finalSuffix}`;
}

// ============================================================================
// Product Duplication Helpers
// ============================================================================

/**
 * Builds a safe duplicate name that respects the 100-char limit.
 * Truncates original name if needed to fit suffix and potential counter.
 */
export function buildDuplicateName(originalName: string): string {
  const COPY_SUFFIX = " (Cópia)";
  const MAX_LENGTH = 100;
  const SUFFIX_MARGIN = 12; // " (Cópia) 99" = 12 chars max
  
  const maxBaseLength = MAX_LENGTH - SUFFIX_MARGIN;
  
  const truncatedName = originalName.length > maxBaseLength
    ? originalName.substring(0, maxBaseLength - 3) + "..."
    : originalName;
  
  return `${truncatedName}${COPY_SUFFIX}`;
}

// ============================================================================
// Checkout Slug Generator (Correct Format: xxxxxxx_xxxxxx)
// ============================================================================

/**
 * Generates a fallback checkout slug in the correct format: xxxxxxx_xxxxxx
 * Used when RPC is unavailable
 */
function generateFallbackCheckoutSlug(): string {
  const hex = Math.random().toString(16).substring(2, 9).padEnd(7, '0');
  const num = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `${hex}_${num}`;
}

/**
 * Generates a unique checkout slug using the correct format.
 * First tries the database RPC, falls back to local generation if unavailable.
 * 
 * @returns Slug in format: xxxxxxx_xxxxxx (e.g., a3f7b2c_847291)
 */
export async function generateUniqueCheckoutSlug(
  supabase: SupabaseClient
): Promise<string> {
  // Try RPC first
  const { data, error } = await supabase.rpc("generate_checkout_slug");
  
  if (!error && data && typeof data === "string") {
    return data;
  }
  
  // Fallback: generate locally and verify uniqueness
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const slug = generateFallbackCheckoutSlug();
    
    const { data: existing } = await supabase
      .from("checkouts")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    
    if (!existing) {
      return slug;
    }
    
    attempts++;
  }
  
  // Last resort: add timestamp
  return `${generateFallbackCheckoutSlug().substring(0, 7)}_${Date.now().toString().slice(-6)}`;
}
