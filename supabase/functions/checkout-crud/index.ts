/**
 * checkout-crud Edge Function
 * 
 * Handles checkout CRUD operations:
 * - create: Create new checkout with payment link
 * - update: Update checkout (name, default, offer)
 * - set-default: Set checkout as default
 * - delete: Delete checkout atomically (cascade)
 * - toggle-link-status: Toggle payment link status
 * 
 * RISE Protocol Compliant - Refactored from checkout-management
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";

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
    console.error("[checkout-crud] Rate limit check error:", error);
    return { allowed: true };
  }

  const count = attempts?.length || 0;
  if (count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfter: 300 };
  }

  return { allowed: true };
}

async function recordRateLimitAttempt(supabase: any, producerId: string, action: string): Promise<void> {
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
    await supabase.from("producer_sessions").update({ is_valid: false }).eq("session_token", sessionToken);
    return { valid: false, error: "Sessão expirada" };
  }

  await supabase.from("producer_sessions").update({ last_activity_at: new Date().toISOString() }).eq("session_token", sessionToken);

  return { valid: true, producerId: session.producer_id };
}

// ============================================
// OWNERSHIP VERIFICATION
// ============================================

async function verifyCheckoutOwnership(
  supabase: any,
  checkoutId: string,
  producerId: string
): Promise<{ valid: boolean; checkout?: any }> {
  const { data, error } = await supabase
    .from("checkouts")
    .select("id, name, is_default, product_id, products!inner(user_id)")
    .eq("id", checkoutId)
    .single();

  if (error || !data) return { valid: false };
  const product = data.products as any;
  if (product?.user_id !== producerId) return { valid: false };
  return { valid: true, checkout: data };
}

async function verifyProductOwnership(supabase: any, productId: string, producerId: string): Promise<boolean> {
  const { data, error } = await supabase.from("products").select("id, user_id").eq("id", productId).single();
  if (error || !data) return false;
  return data.user_id === producerId;
}

// ============================================
// PAYMENT LINK MANAGEMENT
// ============================================

function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 8; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

async function managePaymentLink(
  supabase: any,
  checkoutId: string,
  offerId: string,
  baseUrl: string
): Promise<{ success: boolean; linkId?: string; error?: string }> {
  try {
    const { data: currentLink } = await supabase
      .from("checkout_links")
      .select(`link_id, payment_links!inner (id, offer_id)`)
      .eq("checkout_id", checkoutId)
      .maybeSingle();

    if (currentLink && currentLink.payment_links?.offer_id === offerId) {
      return { success: true, linkId: currentLink.link_id };
    }

    const { data: offerInUse } = await supabase
      .from("checkout_links")
      .select(`id, payment_links!inner (offer_id)`)
      .eq("payment_links.offer_id", offerId)
      .neq("checkout_id", checkoutId)
      .maybeSingle();

    let linkId: string;

    if (offerInUse) {
      const slug = generateSlug();
      const { data: newLink, error: createLinkError } = await supabase
        .from("payment_links")
        .insert({ offer_id: offerId, slug, url: `${baseUrl}/c/${slug}`, status: "active", is_original: false })
        .select("id")
        .single();
      if (createLinkError) return { success: false, error: `Failed to create payment link: ${createLinkError.message}` };
      linkId = newLink.id;
    } else {
      const { data: availableLink } = await supabase
        .from("payment_links")
        .select("id")
        .eq("offer_id", offerId)
        .eq("status", "active")
        .maybeSingle();

      if (availableLink) {
        linkId = availableLink.id;
      } else {
        const slug = generateSlug();
        const { data: newLink, error: createLinkError } = await supabase
          .from("payment_links")
          .insert({ offer_id: offerId, slug, url: `${baseUrl}/c/${slug}`, status: "active", is_original: true })
          .select("id")
          .single();
        if (createLinkError) return { success: false, error: `Failed to create payment link: ${createLinkError.message}` };
        linkId = newLink.id;
      }
    }

    if (currentLink) {
      const { error: updateError } = await supabase.from("checkout_links").update({ link_id: linkId }).eq("checkout_id", checkoutId);
      if (updateError) return { success: false, error: `Failed to update link association: ${updateError.message}` };
    } else {
      const { error: insertError } = await supabase.from("checkout_links").insert({ checkout_id: checkoutId, link_id: linkId });
      if (insertError) return { success: false, error: `Failed to create link association: ${insertError.message}` };
    }

    return { success: true, linkId };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// ============================================
// MAIN HANDLER
// ============================================

serve(withSentry("checkout-crud", async (req) => {
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const action = pathParts[pathParts.length - 1];

    let body: any = {};
    if (req.method !== "GET") {
      try { body = await req.json(); } catch { return errorResponse("Corpo da requisição inválido", corsHeaders, 400); }
    }

    const sessionToken = body.sessionToken || req.headers.get("x-producer-session-token");
    const sessionValidation = await validateProducerSession(supabase, sessionToken);
    if (!sessionValidation.valid) return errorResponse(sessionValidation.error || "Não autorizado", corsHeaders, 401);

    const producerId = sessionValidation.producerId!;
    const baseUrl = req.headers.get("origin") || "https://risecheckout.com";

    console.log(`[checkout-crud] Action: ${action}, Producer: ${producerId}`);

    // ========== CREATE ==========
    if (action === "create" && req.method === "POST") {
      const rateCheck = await checkRateLimit(supabase, producerId, "checkout_create");
      if (!rateCheck.allowed) return jsonResponse({ success: false, error: "Muitas requisições.", retryAfter: rateCheck.retryAfter }, corsHeaders, 429);

      const { productId, name, isDefault, offerId } = body;
      if (!productId) return errorResponse("ID do produto é obrigatório", corsHeaders, 400);
      if (!name?.trim()) return errorResponse("Nome do checkout é obrigatório", corsHeaders, 400);
      if (!offerId) return errorResponse("ID da oferta é obrigatório", corsHeaders, 400);

      const isOwner = await verifyProductOwnership(supabase, productId, producerId);
      if (!isOwner) return errorResponse("Você não tem permissão para criar checkouts neste produto", corsHeaders, 403);

      try {
        const { data: newCheckout, error: createError } = await supabase
          .from("checkouts")
          .insert({ product_id: productId, name: name.trim(), is_default: !!isDefault })
          .select("id, name, is_default, product_id")
          .single();

        if (createError) throw new Error(`Falha ao criar checkout: ${createError.message}`);

        if (isDefault) {
          await supabase.from("checkouts").update({ is_default: false }).eq("product_id", productId).neq("id", newCheckout.id);
        }

        const linkResult = await managePaymentLink(supabase, newCheckout.id, offerId, baseUrl);
        if (!linkResult.success) {
          await supabase.from("checkouts").delete().eq("id", newCheckout.id);
          throw new Error(linkResult.error || "Falha ao criar link de pagamento");
        }

        await recordRateLimitAttempt(supabase, producerId, "checkout_create");
        return jsonResponse({ success: true, data: { checkout: { id: newCheckout.id, name: newCheckout.name, isDefault: newCheckout.is_default, linkId: linkResult.linkId } } }, corsHeaders);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        await captureException(err, { functionName: "checkout-crud", extra: { action: "create", producerId, productId } });
        return errorResponse(`Erro ao criar checkout: ${err.message}`, corsHeaders, 500);
      }
    }

    // ========== UPDATE ==========
    if (action === "update" && (req.method === "PUT" || req.method === "POST")) {
      const rateCheck = await checkRateLimit(supabase, producerId, "checkout_update");
      if (!rateCheck.allowed) return jsonResponse({ success: false, error: "Muitas requisições.", retryAfter: rateCheck.retryAfter }, corsHeaders, 429);

      const { checkoutId, name, isDefault, offerId } = body;
      if (!checkoutId) return errorResponse("ID do checkout é obrigatório", corsHeaders, 400);

      const ownershipCheck = await verifyCheckoutOwnership(supabase, checkoutId, producerId);
      if (!ownershipCheck.valid) return errorResponse("Você não tem permissão para editar este checkout", corsHeaders, 403);

      try {
        const updates: any = { updated_at: new Date().toISOString() };
        if (name?.trim()) updates.name = name.trim();
        if (isDefault !== undefined) updates.is_default = !!isDefault;

        const { data: updatedCheckout, error: updateError } = await supabase
          .from("checkouts")
          .update(updates)
          .eq("id", checkoutId)
          .select("id, name, is_default, product_id")
          .single();

        if (updateError) throw new Error(`Falha ao atualizar checkout: ${updateError.message}`);

        if (isDefault) {
          await supabase.from("checkouts").update({ is_default: false }).eq("product_id", updatedCheckout.product_id).neq("id", checkoutId);
        }

        let linkId: string | undefined;
        if (offerId) {
          const linkResult = await managePaymentLink(supabase, checkoutId, offerId, baseUrl);
          if (linkResult.success) linkId = linkResult.linkId;
        }

        await recordRateLimitAttempt(supabase, producerId, "checkout_update");
        return jsonResponse({ success: true, data: { checkout: { id: updatedCheckout.id, name: updatedCheckout.name, isDefault: updatedCheckout.is_default, linkId } } }, corsHeaders);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        await captureException(err, { functionName: "checkout-crud", extra: { action: "update", producerId, checkoutId } });
        return errorResponse(`Erro ao atualizar checkout: ${err.message}`, corsHeaders, 500);
      }
    }

    // ========== SET-DEFAULT ==========
    if (action === "set-default" && req.method === "POST") {
      const { checkoutId } = body;
      if (!checkoutId) return errorResponse("ID do checkout é obrigatório", corsHeaders, 400);

      const ownershipCheck = await verifyCheckoutOwnership(supabase, checkoutId, producerId);
      if (!ownershipCheck.valid) return errorResponse("Você não tem permissão para alterar este checkout", corsHeaders, 403);

      const productId = ownershipCheck.checkout?.product_id;

      try {
        await supabase.from("checkouts").update({ is_default: false }).eq("product_id", productId);
        const { error: updateError } = await supabase.from("checkouts").update({ is_default: true }).eq("id", checkoutId);
        if (updateError) throw new Error(`Falha ao definir checkout padrão: ${updateError.message}`);

        return jsonResponse({ success: true }, corsHeaders);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        await captureException(err, { functionName: "checkout-crud", extra: { action: "set-default", producerId, checkoutId } });
        return errorResponse(`Erro ao definir checkout padrão: ${err.message}`, corsHeaders, 500);
      }
    }

    // ========== DELETE ==========
    if (action === "delete" && (req.method === "DELETE" || req.method === "POST")) {
      const checkoutId = body.checkout_id || body.checkoutId;
      if (!checkoutId) return errorResponse("ID do checkout é obrigatório", corsHeaders, 400);

      const ownershipCheck = await verifyCheckoutOwnership(supabase, checkoutId, producerId);
      if (!ownershipCheck.valid) return errorResponse("Você não tem permissão para excluir este checkout", corsHeaders, 403);
      if (ownershipCheck.checkout?.is_default) return errorResponse("Não é possível excluir o checkout padrão", corsHeaders, 400);

      try {
        const { data: checkoutLink } = await supabase
          .from("checkout_links")
          .select(`link_id, payment_links (id, is_original)`)
          .eq("checkout_id", checkoutId)
          .maybeSingle();

        const paymentLinkData = checkoutLink?.payment_links as any;
        const isOriginal = Array.isArray(paymentLinkData) ? paymentLinkData[0]?.is_original : paymentLinkData?.is_original;

        await supabase.from("checkout_links").delete().eq("checkout_id", checkoutId);
        if (checkoutLink && isOriginal === false) {
          await supabase.from("payment_links").delete().eq("id", checkoutLink.link_id);
        }
        await supabase.from("order_bumps").delete().eq("checkout_id", checkoutId);
        await supabase.from("checkout_rows").delete().eq("checkout_id", checkoutId);

        const { error: deleteError } = await supabase.from("checkouts").delete().eq("id", checkoutId);
        if (deleteError) throw new Error(`Falha ao deletar checkout: ${deleteError.message}`);

        return jsonResponse({ success: true }, corsHeaders);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        await captureException(err, { functionName: "checkout-crud", extra: { action: "delete", producerId, checkoutId } });
        return errorResponse(`Erro ao excluir checkout: ${err.message}`, corsHeaders, 500);
      }
    }

    // ========== TOGGLE-LINK-STATUS ==========
    if (action === "toggle-link-status" && (req.method === "PUT" || req.method === "POST")) {
      const { linkId } = body;
      if (!linkId) return errorResponse("ID do link é obrigatório", corsHeaders, 400);

      const { data: link, error: linkError } = await supabase
        .from("payment_links")
        .select(`id, status, offers!inner(id, products!inner(user_id))`)
        .eq("id", linkId)
        .single();

      if (linkError || !link) return errorResponse("Link não encontrado", corsHeaders, 404);

      const offer = link.offers as any;
      if (offer?.products?.user_id !== producerId) return errorResponse("Você não tem permissão para editar este link", corsHeaders, 403);

      const newStatus = link.status === "active" ? "inactive" : "active";
      const { error: updateError } = await supabase.from("payment_links").update({ status: newStatus }).eq("id", linkId);
      if (updateError) return errorResponse("Erro ao atualizar status do link", corsHeaders, 500);

      return jsonResponse({ success: true, newStatus }, corsHeaders);
    }

    return errorResponse(`Ação desconhecida: ${action}`, corsHeaders, 404);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    await captureException(err, { functionName: "checkout-crud", url: req.url, method: req.method });
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
