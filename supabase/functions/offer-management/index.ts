/**
 * offer-management Edge Function
 * 
 * Centralizes all offer CRUD operations with proper security:
 * - Authentication via producer_sessions (not JWT)
 * - Rate limiting per producer
 * - Backend validation
 * - Ownership verification
 * - Sentry error tracking
 * 
 * RISE Protocol Compliant:
 * - Secure CORS
 * - Rate limiting on all endpoints
 * - Consistent with product-management patterns
 * 
 * Endpoints:
 * - POST /create - Create new offer
 * - PUT /update - Update existing offer
 * - DELETE /delete - Soft delete offer (set status to 'deleted')
 * - POST /bulk-save - Bulk save offers (create new, update existing, delete removed)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS - Secure centralized handler
import { handleCors } from "../_shared/cors.ts";

// Sentry error tracking
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

interface OfferUpdatePayload {
  offer_id: string;
  name?: string;
  price?: number;
  member_group_id?: string | null;
}

interface OfferDeletePayload {
  offer_id: string;
}

interface BulkSavePayload {
  product_id: string;
  offers: Array<{
    id?: string;
    name: string;
    price: number;
    is_default?: boolean;
    member_group_id?: string | null;
  }>;
  deleted_offer_ids?: string[];
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
// RATE LIMITING
// ============================================

async function checkRateLimit(
  supabase: any,
  producerId: string,
  action: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const MAX_ATTEMPTS = 30; // 30 requests per window
  const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  const windowStart = new Date(Date.now() - WINDOW_MS);

  const { data: attempts, error } = await supabase
    .from("rate_limit_attempts")
    .select("id")
    .eq("identifier", `producer:${producerId}`)
    .eq("action", action)
    .gte("created_at", windowStart.toISOString());

  if (error) {
    console.error("[offer-management] Rate limit check error:", error);
    return { allowed: true }; // Fail open
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

  // Update last activity
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
    .select("id")
    .eq("id", productId)
    .eq("user_id", producerId)
    .single();

  return !error && !!data;
}

async function verifyOfferOwnership(
  supabase: any,
  offerId: string,
  producerId: string
): Promise<{ valid: boolean; productId?: string }> {
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

serve(withSentry("offer-management", async (req) => {
  // ============================================
  // CORS VALIDATION
  // ============================================
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

    console.log(`[offer-management] Action: ${action}, Method: ${req.method}`);

    // Parse body
    let body: any = {};
    if (req.method !== "GET") {
      try {
        body = await req.json();
      } catch {
        return errorResponse("Corpo da requisição inválido", corsHeaders, 400);
      }
    }

    // ============================================
    // AUTHENTICATION
    // ============================================
    const sessionToken = body.sessionToken || req.headers.get("x-producer-session-token");
    const sessionValidation = await validateProducerSession(supabase, sessionToken);

    if (!sessionValidation.valid) {
      console.warn(`[offer-management] Auth failed: ${sessionValidation.error}`);
      return errorResponse(sessionValidation.error || "Não autorizado", corsHeaders, 401);
    }

    const producerId = sessionValidation.producerId!;
    console.log(`[offer-management] Authenticated producer: ${producerId}`);

    // ============================================
    // CREATE OFFER
    // ============================================
    if (action === "create" && req.method === "POST") {
      // Rate limiting
      const rateCheck = await checkRateLimit(supabase, producerId, "offer_create");
      if (!rateCheck.allowed) {
        return jsonResponse(
          { success: false, error: "Muitas requisições. Tente novamente em alguns minutos.", retryAfter: rateCheck.retryAfter },
          corsHeaders,
          429
        );
      }

      // Validate input
      const validation = validateCreateOffer(body.offer || body);
      if (!validation.valid) {
        return errorResponse(validation.error!, corsHeaders, 400);
      }

      const offerData = validation.sanitized!;

      // Verify product ownership
      const isOwner = await verifyProductOwnership(supabase, offerData.product_id, producerId);
      if (!isOwner) {
        return errorResponse("Você não tem permissão para criar ofertas neste produto", corsHeaders, 403);
      }

      // Insert offer
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
        console.error("[offer-management] Insert error:", insertError);
        await captureException(new Error(insertError.message), {
          functionName: "offer-management",
          extra: { action: "create", producerId, offerData },
        });
        return errorResponse("Erro ao criar oferta", corsHeaders, 500);
      }

      await recordRateLimitAttempt(supabase, producerId, "offer_create");

      console.log(`[offer-management] Offer created: ${newOffer.id} by ${producerId}`);
      return jsonResponse({ success: true, offer: newOffer }, corsHeaders);
    }

    // ============================================
    // UPDATE OFFER
    // ============================================
    if (action === "update" && (req.method === "PUT" || req.method === "POST")) {
      // Rate limiting
      const rateCheck = await checkRateLimit(supabase, producerId, "offer_update");
      if (!rateCheck.allowed) {
        return jsonResponse(
          { success: false, error: "Muitas requisições. Tente novamente em alguns minutos.", retryAfter: rateCheck.retryAfter },
          corsHeaders,
          429
        );
      }

      // Validate input
      const validation = validateUpdateOffer(body.offer || body);
      if (!validation.valid) {
        return errorResponse(validation.error!, corsHeaders, 400);
      }

      const { offer_id, updates } = validation;

      // Verify ownership
      const ownershipCheck = await verifyOfferOwnership(supabase, offer_id!, producerId);
      if (!ownershipCheck.valid) {
        console.warn(`[offer-management] Unauthorized update attempt: ${producerId} on offer ${offer_id}`);
        return errorResponse("Você não tem permissão para editar esta oferta", corsHeaders, 403);
      }

      // Update offer
      const { data: updatedOffer, error: updateError } = await supabase
        .from("offers")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", offer_id)
        .select()
        .single();

      if (updateError) {
        console.error("[offer-management] Update error:", updateError);
        await captureException(new Error(updateError.message), {
          functionName: "offer-management",
          extra: { action: "update", producerId, offer_id, updates },
        });
        return errorResponse("Erro ao atualizar oferta", corsHeaders, 500);
      }

      await recordRateLimitAttempt(supabase, producerId, "offer_update");

      console.log(`[offer-management] Offer updated: ${offer_id} by ${producerId}`);
      return jsonResponse({ success: true, offer: updatedOffer }, corsHeaders);
    }

    // ============================================
    // DELETE OFFER (soft delete)
    // ============================================
    if (action === "delete" && (req.method === "DELETE" || req.method === "POST")) {
      const offerId = body.offer_id || body.offerId;

      if (!offerId || typeof offerId !== "string") {
        return errorResponse("ID da oferta é obrigatório", corsHeaders, 400);
      }

      // Verify ownership
      const ownershipCheck = await verifyOfferOwnership(supabase, offerId, producerId);
      if (!ownershipCheck.valid) {
        console.warn(`[offer-management] Unauthorized delete attempt: ${producerId} on offer ${offerId}`);
        return errorResponse("Você não tem permissão para excluir esta oferta", corsHeaders, 403);
      }

      // Soft delete: inactivate payment links first
      await supabase
        .from("payment_links")
        .update({ status: "inactive" })
        .eq("offer_id", offerId);

      // Soft delete offer
      const { error: deleteError } = await supabase
        .from("offers")
        .update({ status: "deleted", updated_at: new Date().toISOString() })
        .eq("id", offerId);

      if (deleteError) {
        console.error("[offer-management] Delete error:", deleteError);
        await captureException(new Error(deleteError.message), {
          functionName: "offer-management",
          extra: { action: "delete", producerId, offerId },
        });
        return errorResponse("Erro ao excluir oferta", corsHeaders, 500);
      }

      console.log(`[offer-management] Offer deleted: ${offerId} by ${producerId}`);
      return jsonResponse({ success: true }, corsHeaders);
    }

    // ============================================
    // BULK SAVE (create, update, delete in one call)
    // ============================================
    if (action === "bulk-save" && req.method === "POST") {
      // Rate limiting
      const rateCheck = await checkRateLimit(supabase, producerId, "offer_bulk_save");
      if (!rateCheck.allowed) {
        return jsonResponse(
          { success: false, error: "Muitas requisições. Tente novamente em alguns minutos.", retryAfter: rateCheck.retryAfter },
          corsHeaders,
          429
        );
      }

      const { product_id, offers, deleted_offer_ids } = body as BulkSavePayload;

      if (!product_id) {
        return errorResponse("ID do produto é obrigatório", corsHeaders, 400);
      }

      // Verify product ownership
      const isOwner = await verifyProductOwnership(supabase, product_id, producerId);
      if (!isOwner) {
        return errorResponse("Você não tem permissão para modificar ofertas deste produto", corsHeaders, 403);
      }

      const results: { created: string[]; updated: string[]; deleted: string[] } = {
        created: [],
        updated: [],
        deleted: [],
      };

      // Process deleted offers
      if (deleted_offer_ids && deleted_offer_ids.length > 0) {
        for (const offerId of deleted_offer_ids) {
          // Inactivate payment links
          await supabase
            .from("payment_links")
            .update({ status: "inactive" })
            .eq("offer_id", offerId);

          // Soft delete offer
          const { error } = await supabase
            .from("offers")
            .update({ status: "deleted", updated_at: new Date().toISOString() })
            .eq("id", offerId);

          if (!error) {
            results.deleted.push(offerId);
          }
        }
      }

      // Process offers (create or update)
      if (offers && offers.length > 0) {
        for (const offer of offers) {
          // Validate offer
          if (!offer.name || typeof offer.name !== "string" || offer.name.trim().length === 0) {
            continue; // Skip invalid offers
          }
          if (typeof offer.price !== "number" || offer.price <= 0) {
            continue;
          }

          const isNewOffer = !offer.id || offer.id.startsWith("temp-");

          if (isNewOffer) {
            // Create new offer
            const { data: newOffer, error } = await supabase
              .from("offers")
              .insert({
                product_id,
                name: offer.name.trim(),
                price: offer.price,
                is_default: false,
                member_group_id: offer.member_group_id || null,
                status: "active",
              })
              .select("id")
              .single();

            if (!error && newOffer) {
              results.created.push(newOffer.id);
            }
          } else {
            // Update existing offer
            const { error } = await supabase
              .from("offers")
              .update({
                name: offer.name.trim(),
                price: offer.price,
                member_group_id: offer.member_group_id || null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", offer.id);

            if (!error) {
              results.updated.push(offer.id!);
            }
          }
        }
      }

      await recordRateLimitAttempt(supabase, producerId, "offer_bulk_save");

      console.log(`[offer-management] Bulk save completed by ${producerId}:`, results);
      return jsonResponse({ success: true, results }, corsHeaders);
    }

    // ============================================
    // UNKNOWN ACTION
    // ============================================
    return errorResponse(`Ação desconhecida: ${action}`, corsHeaders, 404);

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[offer-management] Unexpected error:", err.message);
    await captureException(err, {
      functionName: "offer-management",
      url: req.url,
      method: req.method,
    });
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
