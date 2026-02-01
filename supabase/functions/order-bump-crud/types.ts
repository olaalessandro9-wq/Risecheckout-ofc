/**
 * order-bump-crud Types
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * CRITICAL PRICE SEMANTICS:
 * - `original_price`: MARKETING price for strikethrough display only
 * - The REAL price charged comes from the linked offer/product
 * - `original_price` is NEVER used for billing calculations
 * 
 * @module order-bump-crud/types
 */

// ============================================
// RESPONSE TYPES
// ============================================

export interface JsonResponseData {
  success?: boolean;
  error?: string;
  orderBump?: OrderBumpRecord | null;
  retryAfter?: number;
}

// ============================================
// PAYLOAD TYPES
// ============================================

export interface OrderBumpPayload {
  id?: string;
  order_bump_id?: string;
  /** RISE V3: The product that owns this order bump (parent product) */
  parent_product_id?: string;
  /** @deprecated Use parent_product_id. Kept for backwards compatibility */
  checkout_id?: string;
  product_id?: string;
  offer_id?: string;
  active?: boolean;
  discount_enabled?: boolean;
  /** 
   * MARKETING price for strikethrough display.
   * The REAL price is always from the linked offer/product.
   * This field is NEVER used for billing calculations.
   */
  original_price?: number;
  /** @deprecated Use original_price instead */
  discount_price?: number;
  call_to_action?: string;
  custom_title?: string;
  custom_description?: string;
  show_image?: boolean;
}

// ============================================
// RECORD TYPES
// ============================================

export interface OrderBumpRecord {
  id: string;
  parent_product_id: string;
  checkout_id?: string | null;
  product_id: string;
  offer_id: string;
  active: boolean;
  discount_enabled: boolean;
  original_price: number | null;
  call_to_action: string | null;
  custom_title: string | null;
  custom_description: string | null;
  show_image: boolean;
  position?: number;
  updated_at?: string;
}

export interface OrderBumpUpdates {
  updated_at: string;
  product_id?: string;
  offer_id?: string;
  active?: boolean;
  discount_enabled?: boolean;
  /** MARKETING price - for display only, never used for billing */
  original_price?: number | null;
  call_to_action?: string | null;
  custom_title?: string | null;
  custom_description?: string | null;
  show_image?: boolean;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface RequestBody {
  action?: string;
  orderBump?: OrderBumpPayload;
  checkoutId?: string;
  orderedIds?: string[];
  id?: string;
  order_bump_id?: string;
  orderBumpId?: string;
}

// ============================================
// OWNERSHIP TYPES
// ============================================

export interface ProductWithOwner {
  id: string;
  user_id: string;
}

/**
 * Order bump with joined product owner data.
 * RISE V3: Explicit interface for Supabase join result.
 * Note: Supabase may return products as array for .single() queries.
 */
export interface OrderBumpWithOwner {
  id: string;
  parent_product_id: string;
  products?: {
    user_id: string;
  } | { user_id: string }[] | null;
}

// ============================================
// HANDLER CONTEXT
// ============================================

export interface HandlerContext {
  supabase: ReturnType<typeof import("https://esm.sh/@supabase/supabase-js@2").createClient>;
  producerId: string;
  corsHeaders: Record<string, string>;
}
