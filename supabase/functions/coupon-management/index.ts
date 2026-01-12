/**
 * coupon-management Edge Function
 * 
 * Centralizes all coupon CRUD operations with proper security:
 * - Authentication via producer_sessions
 * - Rate limiting per producer
 * - Backend validation
 * - Sentry error tracking
 * 
 * RISE Protocol Compliant
 * 
 * Endpoints:
 * - POST /create - Create coupon and link to product
 * - POST /update - Update coupon
 * - POST /delete - Delete coupon and links
 * - POST /list - List coupons for a product
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS
import { handleCors } from "../_shared/cors.ts";

// Sentry
import { withSentry, captureException } from "../_shared/sentry.ts";

// ============================================
// TYPES
// ============================================

interface CouponPayload {
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
// RATE LIMITING
// ============================================

async function checkRateLimit(
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

  const count = attempts?.length || 0;
  if (count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfter: 300 };
  }

  return { allowed: true };
}

async function recordRateLimitAttempt(
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
// HELPERS
// ============================================

function jsonResponse(data: any, corsHeaders: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, corsHeaders: Record<string, string>, status = 400): Response {
  return jsonResponse({ success: false, error: message }, corsHeaders, status);
}

// ============================================
// SESSION VALIDATION
// ============================================

async function validateProducerSession(
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

async function verifyProductOwnership(
  supabase: any,
  productId: string,
  producerId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("products")
    .select("id, user_id")
    .eq("id", productId)
    .single();

  if (error || !data) {
    return false;
  }

  return data.user_id === producerId;
}

// ============================================
// VALIDATION
// ============================================

function validateCouponPayload(data: any): { valid: boolean; error?: string; sanitized?: CouponPayload } {
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
// MAIN HANDLER
// ============================================

serve(withSentry("coupon-management", async (req) => {
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    console.log(`[coupon-management] Action: ${action}, Method: ${req.method}`);

    let body: any = {};
    if (req.method !== "GET") {
      try {
        body = await req.json();
      } catch {
        return errorResponse("Corpo da requisição inválido", corsHeaders, 400);
      }
    }

    // Authentication
    const sessionToken = body.sessionToken || req.headers.get("x-producer-session-token");
    const sessionValidation = await validateProducerSession(supabase, sessionToken);

    if (!sessionValidation.valid) {
      console.warn(`[coupon-management] Auth failed: ${sessionValidation.error}`);
      return errorResponse(sessionValidation.error || "Não autorizado", corsHeaders, 401);
    }

    const producerId = sessionValidation.producerId!;
    console.log(`[coupon-management] Authenticated producer: ${producerId}`);

    // ============================================
    // CREATE COUPON
    // ============================================
    if (action === "create" && req.method === "POST") {
      const rateCheck = await checkRateLimit(supabase, producerId, "coupon_create");
      if (!rateCheck.allowed) {
        return jsonResponse(
          { success: false, error: "Muitas requisições.", retryAfter: rateCheck.retryAfter },
          corsHeaders,
          429
        );
      }

      const { productId, coupon } = body;

      if (!productId) {
        return errorResponse("ID do produto é obrigatório", corsHeaders, 400);
      }

      // Verify ownership
      const isOwner = await verifyProductOwnership(supabase, productId, producerId);
      if (!isOwner) {
        return errorResponse("Você não tem permissão para criar cupons neste produto", corsHeaders, 403);
      }

      // Validate coupon
      const validation = validateCouponPayload(coupon);
      if (!validation.valid) {
        return errorResponse(validation.error!, corsHeaders, 400);
      }

      const couponData = validation.sanitized!;

      // Check for duplicate code in this product
      const { data: existingCoupons } = await supabase
        .from("coupon_products")
        .select(`
          coupons!inner(code)
        `)
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
        .insert({
          coupon_id: newCoupon.id,
          product_id: productId,
        });

      if (linkError) {
        console.error("[coupon-management] Link error:", linkError);
        // Rollback: delete coupon
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
    if (action === "update" && (req.method === "PUT" || req.method === "POST")) {
      const { couponId, productId, coupon } = body;

      if (!couponId) {
        return errorResponse("ID do cupom é obrigatório", corsHeaders, 400);
      }

      // Verify product ownership
      if (productId) {
        const isOwner = await verifyProductOwnership(supabase, productId, producerId);
        if (!isOwner) {
          return errorResponse("Você não tem permissão para editar cupons neste produto", corsHeaders, 403);
        }
      }

      // Validate coupon data
      const validation = validateCouponPayload(coupon);
      if (!validation.valid) {
        return errorResponse(validation.error!, corsHeaders, 400);
      }

      const couponData = validation.sanitized!;

      // Check for duplicate code (excluding current coupon)
      if (productId) {
        const { data: existingCoupons } = await supabase
          .from("coupon_products")
          .select(`
            coupon_id,
            coupons!inner(code)
          `)
          .eq("product_id", productId)
          .neq("coupon_id", couponId);

        const existingCodes = existingCoupons?.map((cp: any) => cp.coupons?.code?.toUpperCase()) || [];
        if (existingCodes.includes(couponData.code)) {
          return errorResponse("Já existe outro cupom com este código neste produto", corsHeaders, 400);
        }
      }

      // Update coupon
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
    if (action === "delete" && (req.method === "DELETE" || req.method === "POST")) {
      const { couponId, productId } = body;

      if (!couponId || !productId) {
        return errorResponse("IDs do cupom e produto são obrigatórios", corsHeaders, 400);
      }

      // Verify ownership
      const isOwner = await verifyProductOwnership(supabase, productId, producerId);
      if (!isOwner) {
        return errorResponse("Você não tem permissão para deletar cupons neste produto", corsHeaders, 403);
      }

      // Delete link first
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

      // If no more links, delete the coupon itself
      if (count === 0) {
        const { error: deleteError } = await supabase
          .from("coupons")
          .delete()
          .eq("id", couponId);

        if (deleteError) {
          console.error("[coupon-management] Delete error:", deleteError);
        }
      }

      console.log(`[coupon-management] Coupon ${couponId} removed from product ${productId}`);
      return jsonResponse({ success: true }, corsHeaders);
    }

    // ============================================
    // LIST COUPONS
    // ============================================
    if (action === "list" && (req.method === "GET" || req.method === "POST")) {
      const productId = body.productId || url.searchParams.get("productId");

      if (!productId) {
        return errorResponse("ID do produto é obrigatório", corsHeaders, 400);
      }

      // Verify ownership
      const isOwner = await verifyProductOwnership(supabase, productId, producerId);
      if (!isOwner) {
        return errorResponse("Você não tem permissão para ver cupons deste produto", corsHeaders, 403);
      }

      // Fetch coupons
      const { data: couponProducts, error: listError } = await supabase
        .from("coupon_products")
        .select(`
          coupons(*)
        `)
        .eq("product_id", productId);

      if (listError) {
        console.error("[coupon-management] List error:", listError);
        return errorResponse("Erro ao listar cupons", corsHeaders, 500);
      }

      const coupons = couponProducts?.map((cp: any) => cp.coupons).filter(Boolean) || [];

      return jsonResponse({ success: true, coupons }, corsHeaders);
    }

    // Unknown action
    return errorResponse(`Ação desconhecida: ${action}`, corsHeaders, 404);

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[coupon-management] Unexpected error:", err.message);
    await captureException(err, {
      functionName: "coupon-management",
      url: req.url,
      method: req.method,
    });
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
