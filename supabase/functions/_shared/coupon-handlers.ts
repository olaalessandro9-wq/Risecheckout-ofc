/**
 * Coupon Management Handlers
 * 
 * Extracted handlers for coupon-management edge function.
 * 
 * RISE Protocol Compliant
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { captureException } from "./sentry.ts";

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

// ============================================
// HELPERS
// ============================================

export function jsonResponse(data: any, corsHeaders: Record<string, string>, status = 200): Response {
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

export async function checkRateLimit(
  supabase: any,
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
    .gte("created_at", windowStart.toISOString());

  if (error) {
    console.error("[coupon-management] Rate limit check error:", error);
    return { allowed: true };
  }

  return attempts?.length >= MAX_ATTEMPTS 
    ? { allowed: false, retryAfter: 300 } 
    : { allowed: true };
}

export async function recordRateLimitAttempt(
  supabase: any,
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
  supabase: any,
  sessionToken: string
): Promise<{ valid: boolean; producerId?: string; error?: string }> {
  if (!sessionToken) {
    return { valid: false, error: "Token de sessão não fornecido" };
  }

  const { data: session, error } = await supabase
    .from("producer_sessions")
    .select("producer_id, expires_at, is_valid")
    .eq("session_token", sessionToken)
    .single();

  if (error || !session) {
    return { valid: false, error: "Sessão inválida" };
  }

  if (!session.is_valid) {
    return { valid: false, error: "Sessão expirada ou invalidada" };
  }

  if (new Date(session.expires_at) < new Date()) {
    await supabase.from("producer_sessions").update({ is_valid: false }).eq("session_token", sessionToken);
    return { valid: false, error: "Sessão expirada" };
  }

  await supabase.from("producer_sessions").update({ last_activity_at: new Date().toISOString() }).eq("session_token", sessionToken);

  return { valid: true, producerId: session.producer_id };
}

// ============================================
// OWNERSHIP VERIFICATION
// ============================================

export async function verifyProductOwnership(
  supabase: any,
  productId: string,
  producerId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("products")
    .select("id, user_id")
    .eq("id", productId)
    .single();

  return !error && data?.user_id === producerId;
}

// ============================================
// VALIDATION
// ============================================

export function validateCouponPayload(data: any): { valid: boolean; error?: string; sanitized?: CouponPayload } {
  if (!data.code || typeof data.code !== "string") {
    return { valid: false, error: "Código do cupom é obrigatório" };
  }

  const code = data.code.trim().toUpperCase();
  if (code.length < 3 || code.length > 50) {
    return { valid: false, error: "Código deve ter entre 3 e 50 caracteres" };
  }

  if (!["percentage", "fixed"].includes(data.discount_type)) {
    return { valid: false, error: "Tipo de desconto deve ser 'percentage' ou 'fixed'" };
  }

  if (typeof data.discount_value !== "number" || data.discount_value <= 0) {
    return { valid: false, error: "Valor do desconto deve ser positivo" };
  }

  if (data.discount_type === "percentage" && data.discount_value > 100) {
    return { valid: false, error: "Percentual de desconto não pode exceder 100%" };
  }

  return {
    valid: true,
    sanitized: {
      code,
      name: data.name?.trim() || null,
      description: data.description?.trim() || null,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      max_uses: data.max_uses || null,
      max_uses_per_customer: data.max_uses_per_customer || null,
      expires_at: data.expires_at || null,
      start_date: data.start_date || null,
      active: data.active !== false,
      apply_to_order_bumps: data.apply_to_order_bumps || false,
    },
  };
}

// ============================================
// CREATE COUPON
// ============================================

export async function handleCreateCoupon(
  supabase: any,
  productId: string,
  coupon: any,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const rateCheck = await checkRateLimit(supabase, producerId, "coupon_create");
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

  const existingCodes = existingCoupons?.map((cp: any) => cp.coupons?.code?.toUpperCase()) || [];
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
    .insert({ coupon_id: newCoupon.id, product_id: productId });

  if (linkError) {
    await supabase.from("coupons").delete().eq("id", newCoupon.id);
    return errorResponse("Erro ao vincular cupom ao produto", corsHeaders, 500);
  }

  await recordRateLimitAttempt(supabase, producerId, "coupon_create");

  console.log(`[coupon-management] Coupon created: ${newCoupon.id} for product ${productId}`);
  return jsonResponse({ success: true, coupon: newCoupon }, corsHeaders);
}

// ============================================
// UPDATE COUPON
// ============================================

export async function handleUpdateCoupon(
  supabase: any,
  couponId: string,
  productId: string | undefined,
  coupon: any,
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

    const existingCodes = existingCoupons?.map((cp: any) => cp.coupons?.code?.toUpperCase()) || [];
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
  supabase: any,
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
  supabase: any,
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

  const coupons = couponProducts
    ?.map((cp: any) => cp.coupons)
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return jsonResponse({ success: true, coupons: coupons || [] }, corsHeaders);
}
