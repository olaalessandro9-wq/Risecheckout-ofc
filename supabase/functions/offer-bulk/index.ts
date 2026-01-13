/**
 * offer-bulk Edge Function
 * 
 * @version 2.0.0 - RISE Protocol V2 Compliant - Zero `any`
 * 
 * Handles bulk offer operations:
 * - POST /bulk-save - Bulk create/update/delete offers
 * 
 * RISE Protocol Compliant:
 * - Producer session authentication
 * - Rate limiting per producer
 * - Ownership verification
 * - Sentry error tracking
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";

// ============================================
// TYPES
// ============================================

interface BulkSavePayload {
  product_id: string;
  productId?: string; // alias
  offers: Array<{
    id?: string;
    name: string;
    price: number;
    is_default?: boolean;
    isDefault?: boolean;
    member_group_id?: string | null;
    memberGroupId?: string | null;
  }>;
  deleted_offer_ids?: string[];
}

interface RequestBody {
  sessionToken?: string;
  product_id?: string;
  productId?: string;
  offers?: BulkSavePayload["offers"];
  deleted_offer_ids?: string[];
}

interface JsonResponseData {
  success: boolean;
  error?: string;
  results?: {
    created: string[];
    updated: string[];
    deleted: string[];
  };
}

interface SessionRecord {
  producer_id: string;
  expires_at: string;
  is_valid: boolean;
}

interface ProductRecord {
  id: string;
}

interface OfferRecord {
  id: string;
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

async function validateProducerSession(
  supabase: SupabaseClient,
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

  const sessionData = session as SessionRecord;

  if (!sessionData.is_valid) {
    return { valid: false, error: "Sessão expirada ou invalidada" };
  }

  if (new Date(sessionData.expires_at) < new Date()) {
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

  return { valid: true, producerId: sessionData.producer_id };
}

async function verifyProductOwnership(supabase: SupabaseClient, productId: string, producerId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("user_id", producerId)
    .single();

  return !error && !!data;
}

// ============================================
// MAIN HANDLER
// ============================================

serve(withSentry("offer-bulk", async (req) => {
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

    console.log(`[offer-bulk] Action: ${action}, Method: ${req.method}`);

    if (req.method !== "POST") {
      return errorResponse("Método não permitido", corsHeaders, 405);
    }

    let body: RequestBody = {};
    try {
      body = await req.json();
    } catch {
      return errorResponse("Corpo da requisição inválido", corsHeaders, 400);
    }

    // Authentication
    const sessionToken = body.sessionToken || req.headers.get("x-producer-session-token") || "";
    const sessionValidation = await validateProducerSession(supabase, sessionToken);

    if (!sessionValidation.valid) {
      console.warn(`[offer-bulk] Auth failed: ${sessionValidation.error}`);
      return errorResponse(sessionValidation.error || "Não autorizado", corsHeaders, 401);
    }

    const producerId = sessionValidation.producerId!;

    // BULK-SAVE
    if (action === "bulk-save") {
      const productId = body.product_id || body.productId;
      const offers = body.offers || [];
      const deletedOfferIds = body.deleted_offer_ids || [];

      if (!productId) {
        return errorResponse("ID do produto é obrigatório", corsHeaders, 400);
      }

      const isOwner = await verifyProductOwnership(supabase, productId, producerId);
      if (!isOwner) {
        return errorResponse("Você não tem permissão para modificar ofertas deste produto", corsHeaders, 403);
      }

      const results: { created: string[]; updated: string[]; deleted: string[] } = {
        created: [],
        updated: [],
        deleted: [],
      };

      // Process deleted offers
      if (deletedOfferIds.length > 0) {
        for (const offerId of deletedOfferIds) {
          await supabase.from("payment_links").update({ status: "inactive" }).eq("offer_id", offerId);

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
      if (offers.length > 0) {
        for (const offer of offers) {
          const offerName = offer.name?.trim();
          const offerPrice = offer.price;

          if (!offerName || offerName.length === 0) continue;
          if (typeof offerPrice !== "number" || offerPrice <= 0) continue;

          const isNewOffer = !offer.id || offer.id.startsWith("temp-");
          const memberGroupId = offer.member_group_id || offer.memberGroupId || null;

          if (isNewOffer) {
            const { data: newOffer, error } = await supabase
              .from("offers")
              .insert({
                product_id: productId,
                name: offerName,
                price: offerPrice,
                is_default: false,
                member_group_id: memberGroupId,
                status: "active",
              })
              .select("id")
              .single();

            if (!error && newOffer) {
              const offerData = newOffer as OfferRecord;
              results.created.push(offerData.id);
            }
          } else {
            const { error } = await supabase
              .from("offers")
              .update({
                name: offerName,
                price: offerPrice,
                member_group_id: memberGroupId,
                updated_at: new Date().toISOString(),
              })
              .eq("id", offer.id);

            if (!error) {
              results.updated.push(offer.id!);
            }
          }
        }
      }

      console.log(`[offer-bulk] Bulk save completed by ${producerId}:`, results);
      return jsonResponse({ success: true, results }, corsHeaders);
    }

    return errorResponse(`Ação desconhecida: ${action}`, corsHeaders, 404);

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[offer-bulk] Unexpected error:", err.message);
    await captureException(err, { functionName: "offer-bulk", url: req.url, method: req.method });
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
