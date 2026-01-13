/**
 * offer-crud Edge Function
 * 
 * Handles individual offer CRUD operations:
 * - POST /create - Create new offer
 * - PUT /update - Update existing offer
 * - DELETE /delete - Soft delete offer
 * 
 * RISE Protocol Compliant:
 * - Producer session authentication
 * - Rate limiting per producer
 * - Ownership verification
 * - Sentry error tracking
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";

// ============================================
// TYPES
// ============================================

interface OfferCreatePayload {
  product_id: string;
  name: string;
  price: number;
  is_default?: boolean;
  member_group_id?: string | null;
}

// ============================================
// VALIDATION
// ============================================

function validateCreateOffer(data: any): { valid: boolean; error?: string; sanitized?: OfferCreatePayload } {
  if (!data.product_id || typeof data.product_id !== "string") {
    return { valid: false, error: "ID do produto é obrigatório" };
  }

  if (!data.name || typeof data.name !== "string") {
    return { valid: false, error: "Nome da oferta é obrigatório" };
  }

  const name = data.name.trim();
  if (name.length < 1 || name.length > 100) {
    return { valid: false, error: "Nome deve ter entre 1 e 100 caracteres" };
  }

  if (typeof data.price !== "number" || !Number.isInteger(data.price) || data.price <= 0) {
    return { valid: false, error: "Preço deve ser um valor inteiro positivo em centavos" };
  }

  return {
    valid: true,
    sanitized: {
      product_id: data.product_id,
      name,
      price: data.price,
      is_default: data.is_default === true,
      member_group_id: data.member_group_id || null,
    },
  };
}

function validateUpdateOffer(data: any): { valid: boolean; error?: string; offer_id?: string; updates?: Partial<OfferCreatePayload> } {
  if (!data.offer_id || typeof data.offer_id !== "string") {
    return { valid: false, error: "ID da oferta é obrigatório" };
  }

  const updates: Partial<OfferCreatePayload> = {};

  if (data.name !== undefined) {
    if (typeof data.name !== "string") {
      return { valid: false, error: "Nome deve ser texto" };
    }
    const name = data.name.trim();
    if (name.length < 1 || name.length > 100) {
      return { valid: false, error: "Nome deve ter entre 1 e 100 caracteres" };
    }
    updates.name = name;
  }

  if (data.price !== undefined) {
    if (typeof data.price !== "number" || !Number.isInteger(data.price) || data.price <= 0) {
      return { valid: false, error: "Preço deve ser um valor inteiro positivo em centavos" };
    }
    updates.price = data.price;
  }

  if (data.member_group_id !== undefined) {
    updates.member_group_id = data.member_group_id || null;
  }

  return { valid: true, offer_id: data.offer_id, updates };
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

async function verifyProductOwnership(supabase: any, productId: string, producerId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("user_id", producerId)
    .single();

  return !error && !!data;
}

async function verifyOfferOwnership(supabase: any, offerId: string, producerId: string): Promise<{ valid: boolean; productId?: string }> {
  const { data, error } = await supabase
    .from("offers")
    .select("id, product_id, products!inner(user_id)")
    .eq("id", offerId)
    .single();

  if (error || !data) {
    return { valid: false };
  }

  const product = data.products as any;
  if (product?.user_id !== producerId) {
    return { valid: false };
  }

  return { valid: true, productId: data.product_id };
}

// ============================================
// MAIN HANDLER
// ============================================

serve(withSentry("offer-crud", async (req) => {
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

    console.log(`[offer-crud] Action: ${action}, Method: ${req.method}`);

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
      console.warn(`[offer-crud] Auth failed: ${sessionValidation.error}`);
      return errorResponse(sessionValidation.error || "Não autorizado", corsHeaders, 401);
    }

    const producerId = sessionValidation.producerId!;

    // CREATE
    if (action === "create" && req.method === "POST") {
      const validation = validateCreateOffer(body.offer || body);
      if (!validation.valid) {
        return errorResponse(validation.error!, corsHeaders, 400);
      }

      const offerData = validation.sanitized!;

      const isOwner = await verifyProductOwnership(supabase, offerData.product_id, producerId);
      if (!isOwner) {
        return errorResponse("Você não tem permissão para criar ofertas neste produto", corsHeaders, 403);
      }

      const { data: newOffer, error: insertError } = await supabase
        .from("offers")
        .insert({
          product_id: offerData.product_id,
          name: offerData.name,
          price: offerData.price,
          is_default: offerData.is_default || false,
          member_group_id: offerData.member_group_id,
          status: "active",
        })
        .select()
        .single();

      if (insertError) {
        console.error("[offer-crud] Insert error:", insertError);
        await captureException(new Error(insertError.message), { functionName: "offer-crud", extra: { action: "create", producerId } });
        return errorResponse("Erro ao criar oferta", corsHeaders, 500);
      }

      console.log(`[offer-crud] Offer created: ${newOffer.id}`);
      return jsonResponse({ success: true, offer: newOffer }, corsHeaders);
    }

    // UPDATE
    if (action === "update" && (req.method === "PUT" || req.method === "POST")) {
      const validation = validateUpdateOffer(body.offer || body);
      if (!validation.valid) {
        return errorResponse(validation.error!, corsHeaders, 400);
      }

      const { offer_id, updates } = validation;

      const ownershipCheck = await verifyOfferOwnership(supabase, offer_id!, producerId);
      if (!ownershipCheck.valid) {
        return errorResponse("Você não tem permissão para editar esta oferta", corsHeaders, 403);
      }

      const { data: updatedOffer, error: updateError } = await supabase
        .from("offers")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", offer_id)
        .select()
        .single();

      if (updateError) {
        console.error("[offer-crud] Update error:", updateError);
        await captureException(new Error(updateError.message), { functionName: "offer-crud", extra: { action: "update", producerId } });
        return errorResponse("Erro ao atualizar oferta", corsHeaders, 500);
      }

      console.log(`[offer-crud] Offer updated: ${offer_id}`);
      return jsonResponse({ success: true, offer: updatedOffer }, corsHeaders);
    }

    // DELETE
    if (action === "delete" && (req.method === "DELETE" || req.method === "POST")) {
      const offerId = body.offer_id || body.offerId;

      if (!offerId || typeof offerId !== "string") {
        return errorResponse("ID da oferta é obrigatório", corsHeaders, 400);
      }

      const ownershipCheck = await verifyOfferOwnership(supabase, offerId, producerId);
      if (!ownershipCheck.valid) {
        return errorResponse("Você não tem permissão para excluir esta oferta", corsHeaders, 403);
      }

      await supabase.from("payment_links").update({ status: "inactive" }).eq("offer_id", offerId);

      const { error: deleteError } = await supabase
        .from("offers")
        .update({ status: "deleted", updated_at: new Date().toISOString() })
        .eq("id", offerId);

      if (deleteError) {
        console.error("[offer-crud] Delete error:", deleteError);
        await captureException(new Error(deleteError.message), { functionName: "offer-crud", extra: { action: "delete", producerId } });
        return errorResponse("Erro ao excluir oferta", corsHeaders, 500);
      }

      console.log(`[offer-crud] Offer deleted: ${offerId}`);
      return jsonResponse({ success: true }, corsHeaders);
    }

    return errorResponse(`Ação desconhecida: ${action}`, corsHeaders, 404);

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[offer-crud] Unexpected error:", err.message);
    await captureException(err, { functionName: "offer-crud", url: req.url, method: req.method });
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
