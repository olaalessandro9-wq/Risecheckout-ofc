/**
 * Coupon Validation Utilities
 * 
 * Validation functions for coupon payloads.
 * Extracted from coupon-handlers.ts to keep files < 300 lines.
 * 
 * RISE Protocol Compliant - Zero `any`
 */

import { SupabaseClient } from "./supabase-types.ts";

// ============================================
// TYPES
// ============================================

export interface CouponPayload {
  code: string;
  name?: string;
  description?: string;
  discount_type: "percentage"; // RISE V3: Apenas porcentagem suportado
  discount_value: number;
  max_uses?: number | null;
  max_uses_per_customer?: number | null;
  expires_at?: string | null;
  start_date?: string | null;
  active?: boolean;
  apply_to_order_bumps?: boolean;
}

export interface CouponProductJoin {
  coupon_id?: string;
  coupons?: { code?: string } | null;
}

// ============================================
// PAYLOAD VALIDATION
// ============================================

export function validateCouponPayload(data: unknown): { valid: boolean; error?: string; sanitized?: CouponPayload } {
  // RISE V3: Tratamento explícito de null/undefined
  if (data === null || data === undefined) {
    return { valid: false, error: "Payload inválido" };
  }

  // Verificação adicional para garantir que é um objeto
  if (typeof data !== "object") {
    return { valid: false, error: "Payload deve ser um objeto" };
  }

  const payload = data as Record<string, unknown>;
  
  if (!payload.code || typeof payload.code !== "string") {
    return { valid: false, error: "Código do cupom é obrigatório" };
  }

  const code = (payload.code as string).trim().toUpperCase();
  if (code.length < 3 || code.length > 50) {
    return { valid: false, error: "Código deve ter entre 3 e 50 caracteres" };
  }

  // RISE V3: Apenas porcentagem é suportado
  if (payload.discount_type !== "percentage") {
    return { valid: false, error: "Apenas desconto por porcentagem é suportado" };
  }

  if (typeof payload.discount_value !== "number" || payload.discount_value <= 0) {
    return { valid: false, error: "Valor do desconto deve ser positivo" };
  }

  if ((payload.discount_value as number) > 99) {
    return { valid: false, error: "Percentual de desconto não pode exceder 99%" };
  }

  return {
    valid: true,
    sanitized: {
      code,
      name: (payload.name as string)?.trim() || undefined,
      description: (payload.description as string)?.trim() || undefined,
      discount_type: "percentage" as const,
      discount_value: payload.discount_value as number,
      max_uses: (payload.max_uses as number) || null,
      max_uses_per_customer: (payload.max_uses_per_customer as number) || null,
      expires_at: (payload.expires_at as string) || null,
      start_date: (payload.start_date as string) || null,
      active: payload.active !== false,
      apply_to_order_bumps: Boolean(payload.apply_to_order_bumps),
    },
  };
}

// ============================================
// OWNERSHIP VERIFICATION
// ============================================

export async function verifyProductOwnership(
  supabase: SupabaseClient,
  productId: string,
  producerId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("products")
    .select("id, user_id")
    .eq("id", productId)
    .single();

  return !error && (data as { user_id: string } | null)?.user_id === producerId;
}

// ============================================
// DUPLICATE CODE CHECK
// ============================================

export async function checkDuplicateCouponCode(
  supabase: SupabaseClient,
  productId: string,
  code: string,
  excludeCouponId?: string
): Promise<boolean> {
  let query = supabase
    .from("coupon_products")
    .select(`coupons!inner(code)`)
    .eq("product_id", productId);

  if (excludeCouponId) {
    query = query.neq("coupon_id", excludeCouponId);
  }

  const { data: existingCoupons } = await query;

  const existingCodes = (existingCoupons as CouponProductJoin[] | null)
    ?.map((cp) => cp.coupons?.code?.toUpperCase()) || [];
  
  return existingCodes.includes(code.toUpperCase());
}
