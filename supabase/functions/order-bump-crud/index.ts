/**
 * order-bump-crud Edge Function
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * - Uses unified-auth.ts for authentication
 * - Removed local validateProducerSession
 *
 * Handles order bump CRUD operations:
 * - create: Create new order bump
 * - update: Update order bump
 * - delete: Delete order bump
 * - reorder: Reorder order bumps
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";

// ============================================
// INTERFACES
// ============================================

interface JsonResponseData {
  success?: boolean;
  error?: string;
  orderBump?: OrderBumpRecord | null;
  retryAfter?: number;
}

interface OrderBumpPayload {
  id?: string;
  order_bump_id?: string;
  checkout_id?: string;
  product_id?: string;
  offer_id?: string;
  active?: boolean;
  discount_enabled?: boolean;
  discount_price?: number;
  call_to_action?: string;
  custom_title?: string;
  custom_description?: string;
  show_image?: boolean;
}

interface OrderBumpRecord {
  id: string;
  checkout_id: string;
  product_id: string;
  offer_id: string;
  active: boolean;
  discount_enabled: boolean;
  discount_price: number | null;
  call_to_action: string | null;
  custom_title: string | null;
  custom_description: string | null;
  show_image: boolean;
  position?: number;
  updated_at?: string;
}

interface OrderBumpUpdates {
  updated_at: string;
  product_id?: string;
  offer_id?: string;
  active?: boolean;
  discount_enabled?: boolean;
  discount_price?: number | null;
  call_to_action?: string | null;
  custom_title?: string | null;
  custom_description?: string | null;
  show_image?: boolean;
}

interface RequestBody {
  action?: string;
  orderBump?: OrderBumpPayload;
  checkoutId?: string;
  orderedIds?: string[];
  id?: string;
  order_bump_id?: string;
  orderBumpId?: string;
}

interface CheckoutWithProduct {
  id: string;
  products: {
    user_id: string;
  };
}

interface OrderBumpWithCheckout {
  id: string;
  checkout_id: string;
  checkouts: {
    product_id: string;
    products: {
      user_id: string;
    };
  };
}

// ============================================
// HELPERS
// ============================================

function jsonResponse(data: JsonResponseData, corsHeaders: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, corsHeaders: Record<string, string>, status = 400): Response {
  return jsonResponse({ success: false, error: message }, corsHeaders, status);
}

// ============================================
// RATE LIMITING
// ============================================

async function checkRateLimit(
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
    .gte("created_at", windowStart.toISOString());

  if (error) return { allowed: true };
  if ((attempts?.length || 0) >= MAX_ATTEMPTS) return { allowed: false, retryAfter: 300 };
  return { allowed: true };
}

async function recordRateLimitAttempt(supabase: SupabaseClient, producerId: string, action: string): Promise<void> {
  await supabase.from("rate_limit_attempts").insert({
    identifier: `producer:${producerId}`,
    action,
    success: true,
    created_at: new Date().toISOString(),
  });
}

// ============================================
// OWNERSHIP VERIFICATION
// ============================================

async function verifyCheckoutForOrderBump(supabase: SupabaseClient, checkoutId: string, producerId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("checkouts")
    .select("id, products!inner(user_id)")
    .eq("id", checkoutId)
    .single();

  if (error || !data) return false;
  
  const checkoutData = data as unknown as CheckoutWithProduct;
  return checkoutData.products?.user_id === producerId;
}

async function verifyOrderBumpOwnership(
  supabase: SupabaseClient,
  orderBumpId: string,
  producerId: string
): Promise<{ valid: boolean; orderBump?: OrderBumpWithCheckout }> {
  const { data, error } = await supabase
    .from("order_bumps")
    .select(`id, checkout_id, checkouts!inner(product_id, products!inner(user_id))`)
    .eq("id", orderBumpId)
    .single();

  if (error || !data) return { valid: false };
  
  const orderBumpData = data as unknown as OrderBumpWithCheckout;
  if (orderBumpData.checkouts?.products?.user_id !== producerId) return { valid: false };
  return { valid: true, orderBump: orderBumpData };
}

// ============================================
// MAIN HANDLER
// ============================================

serve(withSentry("order-bump-crud", async (req) => {
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse body first to get action
    let body: RequestBody = {};
    if (req.method !== "GET") {
      try { 
        body = await req.json() as RequestBody; 
      } catch { 
        return errorResponse("Corpo da requisição inválido", corsHeaders, 400); 
      }
    }

    // Prioritize action from body, fallback to path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const pathAction = pathParts[pathParts.length - 1];
    const action = body.action || (pathAction !== "order-bump-crud" ? pathAction : null);

    if (!action) {
      return errorResponse("Ação não especificada", corsHeaders, 400);
    }

    // ============================================
    // AUTHENTICATION via unified-auth.ts
    // ============================================
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }
    const producerId = producer.id;

    console.log(`[order-bump-crud] Action: ${action}, Producer: ${producerId}`);

    // ========== CREATE ==========
    if (action === "create" && req.method === "POST") {
      const rateCheck = await checkRateLimit(supabase, producerId, "order_bump_create");
      if (!rateCheck.allowed) return jsonResponse({ success: false, error: "Muitas requisições.", retryAfter: rateCheck.retryAfter }, corsHeaders, 429);

      const payload: OrderBumpPayload = body.orderBump || body;
      if (!payload.checkout_id) return errorResponse("ID do checkout é obrigatório", corsHeaders, 400);
      if (!payload.product_id) return errorResponse("ID do produto do bump é obrigatório", corsHeaders, 400);
      if (!payload.offer_id) return errorResponse("ID da oferta é obrigatório", corsHeaders, 400);

      const isOwner = await verifyCheckoutForOrderBump(supabase, payload.checkout_id, producerId);
      if (!isOwner) return errorResponse("Você não tem permissão para criar order bumps neste checkout", corsHeaders, 403);

      if (payload.discount_enabled && payload.discount_price !== undefined) {
        if (typeof payload.discount_price !== "number" || payload.discount_price <= 0) {
          return errorResponse("Preço de desconto deve ser um valor positivo", corsHeaders, 400);
        }
      }

      const { data: newOrderBump, error: insertError } = await supabase
        .from("order_bumps")
        .insert({
          checkout_id: payload.checkout_id,
          product_id: payload.product_id,
          offer_id: payload.offer_id,
          active: payload.active !== false,
          discount_enabled: !!payload.discount_enabled,
          discount_price: payload.discount_enabled ? payload.discount_price : null,
          call_to_action: payload.call_to_action?.trim() || null,
          custom_title: payload.custom_title?.trim() || null,
          custom_description: payload.custom_description?.trim() || null,
          show_image: payload.show_image !== false,
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === "23505") return errorResponse("Este produto já está configurado como order bump", corsHeaders, 400);
        await captureException(new Error(insertError.message), { functionName: "order-bump-crud", extra: { action: "create", payload } });
        return errorResponse("Erro ao criar order bump", corsHeaders, 500);
      }

      await recordRateLimitAttempt(supabase, producerId, "order_bump_create");
      return jsonResponse({ success: true, orderBump: newOrderBump as OrderBumpRecord }, corsHeaders);
    }

    // ========== UPDATE ==========
    if (action === "update" && (req.method === "PUT" || req.method === "POST")) {
      const rateCheck = await checkRateLimit(supabase, producerId, "order_bump_update");
      if (!rateCheck.allowed) return jsonResponse({ success: false, error: "Muitas requisições.", retryAfter: rateCheck.retryAfter }, corsHeaders, 429);

      const payload: OrderBumpPayload = body.orderBump || body;
      const orderBumpId = payload.id || payload.order_bump_id;
      if (!orderBumpId) return errorResponse("ID do order bump é obrigatório", corsHeaders, 400);

      const ownershipCheck = await verifyOrderBumpOwnership(supabase, orderBumpId, producerId);
      if (!ownershipCheck.valid) return errorResponse("Você não tem permissão para editar este order bump", corsHeaders, 403);

      const updates: OrderBumpUpdates = { updated_at: new Date().toISOString() };
      if (payload.product_id !== undefined) updates.product_id = payload.product_id;
      if (payload.offer_id !== undefined) updates.offer_id = payload.offer_id;
      if (payload.active !== undefined) updates.active = payload.active;
      if (payload.discount_enabled !== undefined) {
        updates.discount_enabled = payload.discount_enabled;
        updates.discount_price = payload.discount_enabled ? payload.discount_price : null;
      }
      if (payload.call_to_action !== undefined) updates.call_to_action = payload.call_to_action?.trim() || null;
      if (payload.custom_title !== undefined) updates.custom_title = payload.custom_title?.trim() || null;
      if (payload.custom_description !== undefined) updates.custom_description = payload.custom_description?.trim() || null;
      if (payload.show_image !== undefined) updates.show_image = payload.show_image;

      const { data: updatedOrderBump, error: updateError } = await supabase
        .from("order_bumps")
        .update(updates)
        .eq("id", orderBumpId)
        .select()
        .single();

      if (updateError) {
        await captureException(new Error(updateError.message), { functionName: "order-bump-crud", extra: { action: "update", orderBumpId } });
        return errorResponse("Erro ao atualizar order bump", corsHeaders, 500);
      }

      await recordRateLimitAttempt(supabase, producerId, "order_bump_update");
      return jsonResponse({ success: true, orderBump: updatedOrderBump as OrderBumpRecord }, corsHeaders);
    }

    // ========== DELETE ==========
    if (action === "delete" && (req.method === "DELETE" || req.method === "POST")) {
      const orderBumpId = body.order_bump_id || body.orderBumpId || body.id;
      if (!orderBumpId) return errorResponse("ID do order bump é obrigatório", corsHeaders, 400);

      const ownershipCheck = await verifyOrderBumpOwnership(supabase, orderBumpId, producerId);
      if (!ownershipCheck.valid) return errorResponse("Você não tem permissão para excluir este order bump", corsHeaders, 403);

      const { error: deleteError } = await supabase.from("order_bumps").delete().eq("id", orderBumpId);
      if (deleteError) {
        await captureException(new Error(deleteError.message), { functionName: "order-bump-crud", extra: { action: "delete", orderBumpId } });
        return errorResponse("Erro ao excluir order bump", corsHeaders, 500);
      }

      return jsonResponse({ success: true }, corsHeaders);
    }

    // ========== REORDER ==========
    if (action === "reorder" && (req.method === "PUT" || req.method === "POST")) {
      const rateCheck = await checkRateLimit(supabase, producerId, "order_bump_reorder");
      if (!rateCheck.allowed) return jsonResponse({ success: false, error: "Muitas requisições.", retryAfter: rateCheck.retryAfter }, corsHeaders, 429);

      const { checkoutId, orderedIds } = body;
      if (!checkoutId) return errorResponse("ID do checkout é obrigatório", corsHeaders, 400);
      if (!orderedIds || !Array.isArray(orderedIds) || orderedIds.length === 0) return errorResponse("orderedIds é obrigatório", corsHeaders, 400);

      const isOwner = await verifyCheckoutForOrderBump(supabase, checkoutId, producerId);
      if (!isOwner) return errorResponse("Você não tem permissão para reordenar order bumps deste checkout", corsHeaders, 403);

      try {
        const updates = orderedIds.map((id, index) =>
          supabase.from("order_bumps").update({ position: index }).eq("id", id).eq("checkout_id", checkoutId)
        );

        const results = await Promise.all(updates);
        if (results.some((r) => r.error)) return errorResponse("Erro ao reordenar order bumps", corsHeaders, 500);

        await recordRateLimitAttempt(supabase, producerId, "order_bump_reorder");
        return jsonResponse({ success: true }, corsHeaders);
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        await captureException(err, { functionName: "order-bump-crud", extra: { action: "reorder", checkoutId } });
        return errorResponse(`Erro ao reordenar: ${err.message}`, corsHeaders, 500);
      }
    }

    return errorResponse(`Ação desconhecida: ${action}`, corsHeaders, 404);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await captureException(err, { functionName: "order-bump-crud", url: req.url, method: req.method });
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
