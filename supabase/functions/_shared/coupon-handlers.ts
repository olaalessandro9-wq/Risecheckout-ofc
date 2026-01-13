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
  DEFAULT_RATE_LIMIT,
} from "./edge-helpers.ts";

import {
  type CouponPayload,
  validateCouponPayload,
  verifyProductOwnership,
  checkDuplicateCouponCode,
} from "./coupon-validation.ts";

// Re-export helpers
export { 
  jsonResponse, 
  errorResponse, 
  checkRateLimit, 
  recordRateLimitAttempt,
} from "./edge-helpers.ts";

export { validateCouponPayload, verifyProductOwnership } from "./coupon-validation.ts";
export type { CouponPayload } from "./coupon-validation.ts";

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
  const isDuplicate = await checkDuplicateCouponCode(supabase, productId, couponData.code);
  if (isDuplicate) {
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
    const isDuplicate = await checkDuplicateCouponCode(supabase, productId, couponData.code, couponId);
    if (isDuplicate) {
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
