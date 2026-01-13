/**
 * Coupon Management Handlers
 * 
 * Extracted handlers for coupon-management edge function.
 * 
 * RISE Protocol Compliant - Zero `any`
 */

import { SupabaseClient, Coupon } from "./supabase-types.ts";
import { captureException } from "./sentry.ts";
import {
  jsonResponse,
  errorResponse,
  checkRateLimit,
  recordRateLimitAttempt,
  validateProducerSession,
  DEFAULT_RATE_LIMIT,
} from "./edge-helpers.ts";

// ============================================
// TYPES
// ============================================

export interface CouponPayload {
  code: string;
  name?: string;
  description?: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses?: number | null;
  max_uses_per_customer?: number | null;
  expires_at?: string | null;
  start_date?: string | null;
  active?: boolean;
  apply_to_order_bumps?: boolean;
}

interface CouponProductJoin {
  coupon_id?: string;
  coupons?: { code?: string } | null;
}

// ============================================
// RE-EXPORT HELPERS FROM EDGE-HELPERS
// ============================================

export { 
  jsonResponse, 
  errorResponse, 
  checkRateLimit, 
  recordRateLimitAttempt, 
  validateProducerSession 
} from "./edge-helpers.ts";

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
// VALIDATION
// ============================================

export function validateCouponPayload(data: unknown): { valid: boolean; error?: string; sanitized?: CouponPayload } {
  const payload = data as Record<string, unknown>;
  
  if (!payload.code || typeof payload.code !== "string") {
    return { valid: false, error: "Código do cupom é obrigatório" };
  }

  const code = (payload.code as string).trim().toUpperCase();
  if (code.length < 3 || code.length > 50) {
    return { valid: false, error: "Código deve ter entre 3 e 50 caracteres" };
  }

  if (!["percentage", "fixed"].includes(payload.discount_type as string)) {
    return { valid: false, error: "Tipo de desconto deve ser 'percentage' ou 'fixed'" };
  }

  if (typeof payload.discount_value !== "number" || payload.discount_value <= 0) {
    return { valid: false, error: "Valor do desconto deve ser positivo" };
  }

  if (payload.discount_type === "percentage" && (payload.discount_value as number) > 100) {
    return { valid: false, error: "Percentual de desconto não pode exceder 100%" };
  }

  return {
    valid: true,
    sanitized: {
      code,
      name: (payload.name as string)?.trim() || undefined,
      description: (payload.description as string)?.trim() || undefined,
      discount_type: payload.discount_type as "percentage" | "fixed",
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
// CREATE COUPON
// ============================================

export async function handleCreateCoupon(
  supabase: SupabaseClient,
  productId: string,
  coupon: unknown,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const rateCheck = await checkRateLimit(supabase, producerId, { 
    ...DEFAULT_RATE_LIMIT, 
    action: "coupon_create" 
  });
  if (!rateCheck.allowed) {
    return jsonResponse(
      { success: false, error: "Muitas requisições.", retryAfter: rateCheck.retryAfter },
      corsHeaders,
      429
    );
  }

  const isOwner = await verifyProductOwnership(supabase, productId, producerId);
  if (!isOwner) {
    return errorResponse("Você não tem permissão para criar cupons neste produto", corsHeaders, 403);
  }

  const validation = validateCouponPayload(coupon);
  if (!validation.valid) {
    return errorResponse(validation.error!, corsHeaders, 400);
  }

  const couponData = validation.sanitized!;

  // Check for duplicate code
  const { data: existingCoupons } = await supabase
    .from("coupon_products")
    .select(`coupons!inner(code)`)
    .eq("product_id", productId);

  const existingCodes = (existingCoupons as CouponProductJoin[] | null)
    ?.map((cp) => cp.coupons?.code?.toUpperCase()) || [];
  if (existingCodes.includes(couponData.code)) {
    return errorResponse("Já existe um cupom com este código neste produto", corsHeaders, 400);
  }

  // Create coupon
  const { data: newCoupon, error: createError } = await supabase
    .from("coupons")
    .insert({
      code: couponData.code,
      name: couponData.name,
      description: couponData.description,
      discount_type: couponData.discount_type,
      discount_value: couponData.discount_value,
      max_uses: couponData.max_uses,
      max_uses_per_customer: couponData.max_uses_per_customer,
      expires_at: couponData.expires_at,
      start_date: couponData.start_date,
      active: couponData.active,
      apply_to_order_bumps: couponData.apply_to_order_bumps,
    })
    .select()
    .single();

  if (createError) {
    console.error("[coupon-management] Create error:", createError);
    await captureException(new Error(createError.message), {
      functionName: "coupon-management",
      extra: { action: "create", producerId, productId },
    });
    return errorResponse("Erro ao criar cupom", corsHeaders, 500);
  }

  // Link to product
  const { error: linkError } = await supabase
    .from("coupon_products")
    .insert({ coupon_id: (newCoupon as Coupon).id, product_id: productId });

  if (linkError) {
    await supabase.from("coupons").delete().eq("id", (newCoupon as Coupon).id);
    return errorResponse("Erro ao vincular cupom ao produto", corsHeaders, 500);
  }

  await recordRateLimitAttempt(supabase, producerId, "coupon_create");

  console.log(`[coupon-management] Coupon created: ${(newCoupon as Coupon).id} for product ${productId}`);
  return jsonResponse({ success: true, coupon: newCoupon }, corsHeaders);
}

// ============================================
// UPDATE COUPON
// ============================================

export async function handleUpdateCoupon(
  supabase: SupabaseClient,
  couponId: string,
  productId: string | undefined,
  coupon: unknown,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (productId) {
    const isOwner = await verifyProductOwnership(supabase, productId, producerId);
    if (!isOwner) {
      return errorResponse("Você não tem permissão para editar cupons neste produto", corsHeaders, 403);
    }
  }

  const validation = validateCouponPayload(coupon);
  if (!validation.valid) {
    return errorResponse(validation.error!, corsHeaders, 400);
  }

  const couponData = validation.sanitized!;

  // Check for duplicate code (excluding current)
  if (productId) {
    const { data: existingCoupons } = await supabase
      .from("coupon_products")
      .select(`coupon_id, coupons!inner(code)`)
      .eq("product_id", productId)
      .neq("coupon_id", couponId);

    const existingCodes = (existingCoupons as CouponProductJoin[] | null)
      ?.map((cp) => cp.coupons?.code?.toUpperCase()) || [];
    if (existingCodes.includes(couponData.code)) {
      return errorResponse("Já existe outro cupom com este código neste produto", corsHeaders, 400);
    }
  }

  const { data: updatedCoupon, error: updateError } = await supabase
    .from("coupons")
    .update({
      code: couponData.code,
      name: couponData.name,
      description: couponData.description,
      discount_type: couponData.discount_type,
      discount_value: couponData.discount_value,
      max_uses: couponData.max_uses,
      max_uses_per_customer: couponData.max_uses_per_customer,
      expires_at: couponData.expires_at,
      start_date: couponData.start_date,
      active: couponData.active,
      apply_to_order_bumps: couponData.apply_to_order_bumps,
    })
    .eq("id", couponId)
    .select()
    .single();

  if (updateError) {
    console.error("[coupon-management] Update error:", updateError);
    return errorResponse("Erro ao atualizar cupom", corsHeaders, 500);
  }

  console.log(`[coupon-management] Coupon updated: ${couponId}`);
  return jsonResponse({ success: true, coupon: updatedCoupon }, corsHeaders);
}

// ============================================
// DELETE COUPON
// ============================================

export async function handleDeleteCoupon(
  supabase: SupabaseClient,
  couponId: string,
  productId: string,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const isOwner = await verifyProductOwnership(supabase, productId, producerId);
  if (!isOwner) {
    return errorResponse("Você não tem permissão para deletar cupons neste produto", corsHeaders, 403);
  }

  const { error: unlinkError } = await supabase
    .from("coupon_products")
    .delete()
    .eq("coupon_id", couponId)
    .eq("product_id", productId);

  if (unlinkError) {
    console.error("[coupon-management] Unlink error:", unlinkError);
    return errorResponse("Erro ao remover vínculo do cupom", corsHeaders, 500);
  }

  // Check if coupon is still linked to other products
  const { count } = await supabase
    .from("coupon_products")
    .select("id", { count: "exact", head: true })
    .eq("coupon_id", couponId);

  if (count === 0) {
    await supabase.from("coupons").delete().eq("id", couponId);
  }

  console.log(`[coupon-management] Coupon ${couponId} removed from product ${productId}`);
  return jsonResponse({ success: true }, corsHeaders);
}

// ============================================
// LIST COUPONS
// ============================================

export async function handleListCoupons(
  supabase: SupabaseClient,
  productId: string,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const isOwner = await verifyProductOwnership(supabase, productId, producerId);
  if (!isOwner) {
    return errorResponse("Você não tem permissão para ver cupons deste produto", corsHeaders, 403);
  }

  const { data: couponProducts, error: listError } = await supabase
    .from("coupon_products")
    .select(`coupons(*)`)
    .eq("product_id", productId);

  if (listError) {
    console.error("[coupon-management] List error:", listError);
    return errorResponse("Erro ao listar cupons", corsHeaders, 500);
  }

  // Extract coupons from join result - Supabase returns nested structure
  const rawProducts = couponProducts as unknown as Array<{ coupons: Coupon | null }> | null;
  const coupons = rawProducts
    ?.map((cp) => cp.coupons)
    .filter((c): c is Coupon => c !== null)
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

  return jsonResponse({ success: true, coupons: coupons || [] }, corsHeaders);
}
