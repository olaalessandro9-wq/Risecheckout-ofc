/**
 * product-settings Edge Function
 * 
 * Handles specialized product operations:
 * - update-settings: Payment, upsell, affiliate settings
 * - update-general: Full product update from GeneralTab
 * - smart-delete: Soft/hard delete based on orders
 * - update-price: Atomic price update (product + default offer)
 * 
 * RISE Protocol Compliant:
 * - Secure CORS
 * - Rate limiting
 * - Session validation
 * - Ownership verification
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";

// ============================================
// HELPERS
// ============================================

async function checkRateLimit(supabase: any, producerId: string, action: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const MAX_ATTEMPTS = 20;
  const WINDOW_MS = 5 * 60 * 1000;
  const windowStart = new Date(Date.now() - WINDOW_MS);

  const { data: attempts } = await supabase
    .from("rate_limit_attempts")
    .select("id")
    .eq("identifier", `producer:${producerId}`)
    .eq("action", action)
    .gte("created_at", windowStart.toISOString());

  if ((attempts?.length || 0) >= MAX_ATTEMPTS) return { allowed: false, retryAfter: 300 };
  return { allowed: true };
}

async function recordAttempt(supabase: any, producerId: string, action: string): Promise<void> {
  await supabase.from("rate_limit_attempts").insert({
    identifier: `producer:${producerId}`,
    action,
    success: true,
    created_at: new Date().toISOString(),
  });
}

function jsonResponse(data: any, headers: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...headers, "Content-Type": "application/json" } });
}

function errorResponse(message: string, headers: Record<string, string>, status = 400): Response {
  return jsonResponse({ success: false, error: message }, headers, status);
}

async function validateSession(supabase: any, token: string): Promise<{ valid: boolean; producerId?: string; error?: string }> {
  if (!token) return { valid: false, error: "Token de sessão não fornecido" };

  const { data: session, error } = await supabase
    .from("producer_sessions")
    .select("producer_id, expires_at, is_valid")
    .eq("session_token", token)
    .single();

  if (error || !session) return { valid: false, error: "Sessão inválida" };
  if (!session.is_valid) return { valid: false, error: "Sessão expirada ou invalidada" };
  if (new Date(session.expires_at) < new Date()) {
    await supabase.from("producer_sessions").update({ is_valid: false }).eq("session_token", token);
    return { valid: false, error: "Sessão expirada" };
  }

  await supabase.from("producer_sessions").update({ last_activity_at: new Date().toISOString() }).eq("session_token", token);
  return { valid: true, producerId: session.producer_id };
}

async function verifyOwnership(supabase: any, productId: string, producerId: string): Promise<{ valid: boolean; product?: any; error?: string }> {
  const { data: product, error } = await supabase.from("products").select("id, user_id, name, image_url").eq("id", productId).single();
  if (error || !product) return { valid: false, error: "Produto não encontrado" };
  if (product.user_id !== producerId) return { valid: false, error: "Você não tem permissão para editar este produto" };
  return { valid: true, product };
}

// ============================================
// MAIN HANDLER
// ============================================

serve(withSentry("product-settings", async (req) => {
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let body: any = {};
    if (req.method !== "GET") {
      try { body = await req.json(); } catch { return errorResponse("Corpo da requisição inválido", corsHeaders, 400); }
    }

    const { action, productId } = body;
    console.log(`[product-settings] Action: ${action}, ProductId: ${productId}`);

    // Auth
    const sessionToken = body.sessionToken || req.headers.get("x-producer-session-token");
    const sessionResult = await validateSession(supabase, sessionToken);
    if (!sessionResult.valid) return errorResponse(sessionResult.error || "Não autorizado", corsHeaders, 401);
    const producerId = sessionResult.producerId!;

    // Common validation
    if (!productId || typeof productId !== "string") {
      return errorResponse("ID do produto é obrigatório", corsHeaders, 400);
    }

    // ============================================
    // UPDATE SETTINGS
    // ============================================
    if (action === "update-settings") {
      const rateCheck = await checkRateLimit(supabase, producerId, "product_settings");
      if (!rateCheck.allowed) return jsonResponse({ success: false, error: "Muitas requisições", retryAfter: rateCheck.retryAfter }, corsHeaders, 429);

      const ownership = await verifyOwnership(supabase, productId, producerId);
      if (!ownership.valid) return errorResponse(ownership.error!, corsHeaders, ownership.error === "Produto não encontrado" ? 404 : 403);

      const { settings } = body;
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };

      // Payment settings
      if (settings.default_payment_method !== undefined) updates.default_payment_method = settings.default_payment_method;
      if (settings.pix_gateway !== undefined) updates.pix_gateway = settings.pix_gateway;
      if (settings.credit_card_gateway !== undefined) updates.credit_card_gateway = settings.credit_card_gateway;

      // Required fields
      if (settings.required_fields !== undefined) {
        updates.required_fields = { name: true, email: true, phone: !!settings.required_fields.phone, cpf: !!settings.required_fields.cpf };
      }

      // Upsell settings
      if (settings.upsell_enabled !== undefined) updates.upsell_enabled = settings.upsell_enabled;
      if (settings.upsell_product_id !== undefined) updates.upsell_product_id = settings.upsell_product_id || null;
      if (settings.upsell_offer_id !== undefined) updates.upsell_offer_id = settings.upsell_offer_id || null;
      if (settings.upsell_title !== undefined) updates.upsell_title = settings.upsell_title;
      if (settings.upsell_description !== undefined) updates.upsell_description = settings.upsell_description;
      if (settings.upsell_button_text !== undefined) updates.upsell_button_text = settings.upsell_button_text;
      if (settings.upsell_decline_text !== undefined) updates.upsell_decline_text = settings.upsell_decline_text;
      if (settings.upsell_timer_enabled !== undefined) updates.upsell_timer_enabled = settings.upsell_timer_enabled;
      if (settings.upsell_timer_minutes !== undefined) updates.upsell_timer_minutes = settings.upsell_timer_minutes;

      // Affiliate settings
      if (settings.affiliate_commission !== undefined) updates.affiliate_commission = settings.affiliate_commission;
      if (settings.marketplace_enabled !== undefined) {
        updates.marketplace_enabled = settings.marketplace_enabled;
        if (settings.marketplace_enabled) updates.marketplace_enabled_at = new Date().toISOString();
      }
      if (settings.marketplace_auto_approve !== undefined) updates.marketplace_auto_approve = settings.marketplace_auto_approve;

      const { data: updatedProduct, error: updateError } = await supabase.from("products").update(updates).eq("id", productId).select().single();
      if (updateError) {
        console.error("[product-settings] Update error:", updateError);
        return errorResponse("Erro ao atualizar configurações", corsHeaders, 500);
      }

      await recordAttempt(supabase, producerId, "product_settings");
      console.log(`[product-settings] Settings updated for: ${productId}`);
      return jsonResponse({ success: true, product: updatedProduct }, corsHeaders);
    }

    // ============================================
    // UPDATE GENERAL
    // ============================================
    if (action === "update-general") {
      const rateCheck = await checkRateLimit(supabase, producerId, "product_general");
      if (!rateCheck.allowed) return jsonResponse({ success: false, error: "Muitas requisições", retryAfter: rateCheck.retryAfter }, corsHeaders, 429);

      const ownership = await verifyOwnership(supabase, productId, producerId);
      if (!ownership.valid) return errorResponse(ownership.error!, corsHeaders, ownership.error === "Produto não encontrado" ? 404 : 403);

      const { data } = body;
      if (!data || typeof data !== "object") return errorResponse("Dados do produto são obrigatórios", corsHeaders, 400);

      const updates: Record<string, any> = { updated_at: new Date().toISOString() };

      if (data.name !== undefined) {
        if (typeof data.name !== "string" || data.name.trim().length < 1) return errorResponse("Nome do produto é obrigatório", corsHeaders, 400);
        updates.name = data.name.trim();
      }
      if (data.description !== undefined) updates.description = typeof data.description === "string" ? data.description.trim() : "";
      if (data.price !== undefined) {
        if (typeof data.price !== "number" || data.price <= 0) return errorResponse("Preço deve ser maior que zero", corsHeaders, 400);
        updates.price = data.price;
      }
      if (data.support_name !== undefined) updates.support_name = typeof data.support_name === "string" ? data.support_name.trim() : "";
      if (data.support_email !== undefined) {
        const email = typeof data.support_email === "string" ? data.support_email.trim().toLowerCase() : "";
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return errorResponse("E-mail de suporte inválido", corsHeaders, 400);
        updates.support_email = email;
      }
      if (data.delivery_url !== undefined) {
        if (data.delivery_url !== null && typeof data.delivery_url === "string") {
          const url = data.delivery_url.trim();
          if (url && !url.startsWith("https://")) return errorResponse("Link de entrega deve começar com https://", corsHeaders, 400);
          updates.delivery_url = url || null;
        } else {
          updates.delivery_url = null;
        }
      }
      if (data.external_delivery !== undefined) updates.external_delivery = data.external_delivery === true;
      if (data.image_url !== undefined) updates.image_url = data.image_url;
      if (data.status !== undefined) {
        if (!["active", "blocked", "deleted"].includes(data.status)) return errorResponse("Status inválido", corsHeaders, 400);
        updates.status = data.status;
      }

      const { data: updatedProduct, error: updateError } = await supabase.from("products").update(updates).eq("id", productId).select().single();
      if (updateError) {
        console.error("[product-settings] Update-general error:", updateError);
        return errorResponse("Erro ao atualizar produto", corsHeaders, 500);
      }

      await recordAttempt(supabase, producerId, "product_general");
      console.log(`[product-settings] General update for: ${productId}`);
      return jsonResponse({ success: true, product: updatedProduct }, corsHeaders);
    }

    // ============================================
    // SMART DELETE
    // ============================================
    if (action === "smart-delete") {
      const ownership = await verifyOwnership(supabase, productId, producerId);
      if (!ownership.valid) return errorResponse(ownership.error!, corsHeaders, ownership.error === "Produto não encontrado" ? 404 : 403);

      // Check orders
      const { count: orderCount } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("product_id", productId);
      const hasOrders = (orderCount || 0) > 0;

      if (hasOrders) {
        // SOFT DELETE
        console.log(`[product-settings] Soft deleting ${productId} (${orderCount} orders)`);

        await supabase.from("products").update({ status: "deleted", updated_at: new Date().toISOString() }).eq("id", productId);
        await supabase.from("checkouts").update({ status: "deleted" }).eq("product_id", productId);

        const { data: offers } = await supabase.from("offers").select("id").eq("product_id", productId);
        if (offers?.length) {
          await supabase.from("payment_links").update({ status: "inactive" }).in("offer_id", offers.map(o => o.id));
        }

        console.log(`[product-settings] Soft deleted: ${productId}`);
        return jsonResponse({ success: true, type: "soft", deletedId: productId }, corsHeaders);
      } else {
        // HARD DELETE
        console.log(`[product-settings] Hard deleting ${productId} (no orders)`);

        const { error: deleteError } = await supabase.from("products").delete().eq("id", productId);
        if (deleteError) {
          console.error("[product-settings] Hard delete error:", deleteError);
          return errorResponse("Erro ao excluir produto", corsHeaders, 500);
        }

        console.log(`[product-settings] Hard deleted: ${productId}`);
        return jsonResponse({ success: true, type: "hard", deletedId: productId }, corsHeaders);
      }
    }

    // ============================================
    // UPDATE PRICE (atomic)
    // ============================================
    if (action === "update-price") {
      const rateCheck = await checkRateLimit(supabase, producerId, "product_price");
      if (!rateCheck.allowed) return jsonResponse({ success: false, error: "Muitas requisições", retryAfter: rateCheck.retryAfter }, corsHeaders, 429);

      const { price } = body;
      if (typeof price !== "number" || !Number.isInteger(price) || price <= 0) {
        return errorResponse("Preço deve ser um valor inteiro positivo em centavos", corsHeaders, 400);
      }

      const ownership = await verifyOwnership(supabase, productId, producerId);
      if (!ownership.valid) return errorResponse(ownership.error!, corsHeaders, ownership.error === "Produto não encontrado" ? 404 : 403);

      console.log(`[product-settings] Updating price for ${productId} to ${price}`);

      // 1. Update product
      const { error: productError } = await supabase.from("products").update({ price, updated_at: new Date().toISOString() }).eq("id", productId);
      if (productError) {
        console.error("[product-settings] Product price error:", productError);
        return errorResponse("Erro ao atualizar preço do produto", corsHeaders, 500);
      }

      // 2. Update default offer
      const { error: offerError } = await supabase.from("offers").update({ price, updated_at: new Date().toISOString() }).eq("product_id", productId).eq("is_default", true);
      if (offerError) console.warn(`[product-settings] Failed to update default offer: ${offerError.message}`);

      await recordAttempt(supabase, producerId, "product_price");
      console.log(`[product-settings] Price updated for: ${productId}`);
      return jsonResponse({ success: true, price }, corsHeaders);
    }

    return errorResponse(`Ação desconhecida: ${action}`, corsHeaders, 404);

  } catch (error) {
    console.error("[product-settings] Unexpected error:", error);
    await captureException(error instanceof Error ? error : new Error(String(error)), { functionName: "product-settings" });
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
