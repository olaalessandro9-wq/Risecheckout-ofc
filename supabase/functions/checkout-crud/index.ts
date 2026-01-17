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
 * @version 2.0.0 - Zero `any` compliance (RISE Protocol V2)
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";
import {
  jsonResponse,
  errorResponse,
  checkRateLimit,
  recordRateLimitAttempt,
  verifyCheckoutOwnership,
  verifyProductOwnership,
} from "../_shared/checkout-crud-helpers.ts";
import { managePaymentLink } from "../_shared/checkout-link-handlers.ts";

// ==========================================
// TYPES
// ==========================================

interface RequestBody {
  action?: string;
  sessionToken?: string;
  productId?: string;
  checkoutId?: string;
  checkout_id?: string;
  name?: string;
  isDefault?: boolean;
  offerId?: string;
  linkId?: string;
}

interface PaymentLinkOffer {
  id: string;
  products?: { user_id: string } | { user_id: string }[];
}

interface PaymentLink {
  id: string;
  status: string;
  offers: PaymentLinkOffer | PaymentLinkOffer[];
}

interface CheckoutLinkData {
  link_id: string;
  payment_links: { id: string; is_original?: boolean } | { id: string; is_original?: boolean }[] | null;
}

serve(withSentry("checkout-crud", async (req) => {
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabase: SupabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let body: RequestBody = {};
    if (req.method !== "GET") {
      try { body = await req.json(); } catch { return errorResponse("Corpo da requisição inválido", corsHeaders, 400); }
    }

    // Prioriza action do body (padrão do frontend), fallback para path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const pathAction = pathParts[pathParts.length - 1];
    const action = body.action || (pathAction !== "checkout-crud" ? pathAction : undefined);

    if (!action) {
      return errorResponse("Ação não especificada", corsHeaders, 400);
    }

    // Auth via unified-auth
    let producerId: string;
    try {
      const producer = await requireAuthenticatedProducer(supabase, req);
      producerId = producer.id;
    } catch {
      return unauthorizedResponse(corsHeaders);
    }
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

      if (!await verifyProductOwnership(supabase, productId, producerId)) {
        return errorResponse("Você não tem permissão para criar checkouts neste produto", corsHeaders, 403);
      }

      const { data: newCheckout, error: createError } = await supabase
        .from("checkouts")
        .insert({ product_id: productId, name: name.trim(), is_default: !!isDefault })
        .select("id, name, is_default, product_id")
        .single();

      if (createError) return errorResponse(`Falha ao criar checkout: ${createError.message}`, corsHeaders, 500);

      if (isDefault) {
        await supabase.from("checkouts").update({ is_default: false }).eq("product_id", productId).neq("id", newCheckout.id);
      }

      const linkResult = await managePaymentLink(supabase, newCheckout.id, offerId, baseUrl);
      if (!linkResult.success) {
        await supabase.from("checkouts").delete().eq("id", newCheckout.id);
        return errorResponse(linkResult.error || "Falha ao criar link de pagamento", corsHeaders, 500);
      }

      await recordRateLimitAttempt(supabase, producerId, "checkout_create");
      return jsonResponse({ success: true, data: { checkout: { id: newCheckout.id, name: newCheckout.name, isDefault: newCheckout.is_default, linkId: linkResult.linkId } } }, corsHeaders);
    }

    // ========== UPDATE ==========
    if (action === "update" && (req.method === "PUT" || req.method === "POST")) {
      const rateCheck = await checkRateLimit(supabase, producerId, "checkout_update");
      if (!rateCheck.allowed) return jsonResponse({ success: false, error: "Muitas requisições.", retryAfter: rateCheck.retryAfter }, corsHeaders, 429);

      const { checkoutId, name, isDefault, offerId } = body;
      if (!checkoutId) return errorResponse("ID do checkout é obrigatório", corsHeaders, 400);

      const ownershipCheck = await verifyCheckoutOwnership(supabase, checkoutId, producerId);
      if (!ownershipCheck.valid) return errorResponse("Você não tem permissão para editar este checkout", corsHeaders, 403);

      const updates: Record<string, string | boolean> = { updated_at: new Date().toISOString() };
      if (name?.trim()) updates.name = name.trim();
      if (isDefault !== undefined) updates.is_default = !!isDefault;

      const { data: updatedCheckout, error: updateError } = await supabase
        .from("checkouts")
        .update(updates)
        .eq("id", checkoutId)
        .select("id, name, is_default, product_id")
        .single();

      if (updateError) return errorResponse(`Falha ao atualizar checkout: ${updateError.message}`, corsHeaders, 500);

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
    }

    // ========== SET-DEFAULT ==========
    if (action === "set-default" && req.method === "POST") {
      const { checkoutId } = body;
      if (!checkoutId) return errorResponse("ID do checkout é obrigatório", corsHeaders, 400);

      const ownershipCheck = await verifyCheckoutOwnership(supabase, checkoutId, producerId);
      if (!ownershipCheck.valid) return errorResponse("Você não tem permissão para alterar este checkout", corsHeaders, 403);

      const productId = ownershipCheck.checkout?.product_id;
      await supabase.from("checkouts").update({ is_default: false }).eq("product_id", productId);
      const { error: updateError } = await supabase.from("checkouts").update({ is_default: true }).eq("id", checkoutId);
      if (updateError) return errorResponse(`Falha ao definir checkout padrão: ${updateError.message}`, corsHeaders, 500);

      return jsonResponse({ success: true }, corsHeaders);
    }

    // ========== DELETE ==========
    if (action === "delete" && (req.method === "DELETE" || req.method === "POST")) {
      const checkoutId = body.checkout_id || body.checkoutId;
      if (!checkoutId) return errorResponse("ID do checkout é obrigatório", corsHeaders, 400);

      const ownershipCheck = await verifyCheckoutOwnership(supabase, checkoutId, producerId);
      if (!ownershipCheck.valid) return errorResponse("Você não tem permissão para excluir este checkout", corsHeaders, 403);
      if (ownershipCheck.checkout?.is_default) return errorResponse("Não é possível excluir o checkout padrão", corsHeaders, 400);

      const { data: checkoutLink } = await supabase
        .from("checkout_links")
        .select(`link_id, payment_links (id, is_original)`)
        .eq("checkout_id", checkoutId)
        .maybeSingle();

      const typedCheckoutLink = checkoutLink as CheckoutLinkData | null;
      let isOriginal = false;
      
      if (typedCheckoutLink?.payment_links) {
        const paymentLinkData = typedCheckoutLink.payment_links;
        if (Array.isArray(paymentLinkData)) {
          isOriginal = paymentLinkData[0]?.is_original ?? false;
        } else {
          isOriginal = paymentLinkData.is_original ?? false;
        }
      }

      await supabase.from("checkout_links").delete().eq("checkout_id", checkoutId);
      if (typedCheckoutLink && isOriginal === false) {
        await supabase.from("payment_links").delete().eq("id", typedCheckoutLink.link_id);
      }
      await supabase.from("order_bumps").delete().eq("checkout_id", checkoutId);
      await supabase.from("checkout_rows").delete().eq("checkout_id", checkoutId);

      const { error: deleteError } = await supabase.from("checkouts").delete().eq("id", checkoutId);
      if (deleteError) return errorResponse(`Falha ao deletar checkout: ${deleteError.message}`, corsHeaders, 500);

      return jsonResponse({ success: true }, corsHeaders);
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

      const typedLink = link as unknown as PaymentLink;
      const offersData = typedLink.offers;
      const offer: PaymentLinkOffer = Array.isArray(offersData) ? offersData[0] : offersData;
      
      const productsData = offer?.products;
      let offerUserId: string | undefined;
      if (productsData) {
        if (Array.isArray(productsData)) {
          offerUserId = productsData[0]?.user_id;
        } else {
          offerUserId = productsData.user_id;
        }
      }

      if (offerUserId !== producerId) return errorResponse("Você não tem permissão para editar este link", corsHeaders, 403);

      const newStatus = typedLink.status === "active" ? "inactive" : "active";
      const { error: updateError } = await supabase.from("payment_links").update({ status: newStatus }).eq("id", linkId);
      if (updateError) return errorResponse("Erro ao atualizar status do link", corsHeaders, 500);

      return jsonResponse({ success: true, newStatus }, corsHeaders);
    }

    return errorResponse(`Ação desconhecida: ${action}`, corsHeaders, 404);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await captureException(err, { functionName: "checkout-crud", url: req.url, method: req.method });
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
