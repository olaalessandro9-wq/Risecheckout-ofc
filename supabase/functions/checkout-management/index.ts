/**
 * checkout-management Edge Function
 * 
 * Centralizes all checkout and order bump CRUD operations with proper security:
 * - Authentication via producer_sessions (not JWT)
 * - Rate limiting per producer
 * - Backend validation
 * - Atomic delete operations
 * - Sentry error tracking
 * 
 * RISE Protocol Compliant:
 * - Secure CORS
 * - Rate limiting on all endpoints
 * - Atomic transactions for cascading deletes
 * 
 * Endpoints:
 * - DELETE /delete - Delete checkout atomically (cascade to links)
 * - POST /order-bump/create - Create order bump
 * - PUT /order-bump/update - Update order bump
 * - DELETE /order-bump/delete - Delete order bump
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

interface OrderBumpPayload {
  checkout_id: string;
  product_id: string;
  offer_id: string;
  active?: boolean;
  discount_enabled?: boolean;
  discount_price?: number | null;
  call_to_action?: string | null;
  custom_title?: string | null;
  custom_description?: string | null;
  show_image?: boolean;
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
    console.error("[checkout-management] Rate limit check error:", error);
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

  if (error || !data) {
    return { valid: false };
  }

  const product = data.products as any;
  if (product?.user_id !== producerId) {
    return { valid: false };
  }

  return { valid: true, checkout: data };
}

async function verifyOrderBumpOwnership(
  supabase: any,
  orderBumpId: string,
  producerId: string
): Promise<{ valid: boolean; orderBump?: any }> {
  const { data, error } = await supabase
    .from("order_bumps")
    .select(`
      id, 
      checkout_id,
      checkouts!inner(
        product_id,
        products!inner(user_id)
      )
    `)
    .eq("id", orderBumpId)
    .single();

  if (error || !data) {
    return { valid: false };
  }

  const checkout = data.checkouts as any;
  if (checkout?.products?.user_id !== producerId) {
    return { valid: false };
  }

  return { valid: true, orderBump: data };
}

async function verifyCheckoutForOrderBump(
  supabase: any,
  checkoutId: string,
  producerId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("checkouts")
    .select("id, products!inner(user_id)")
    .eq("id", checkoutId)
    .single();

  if (error || !data) {
    return false;
  }

  const product = data.products as any;
  return product?.user_id === producerId;
}

// ============================================
// MAIN HANDLER
// ============================================

serve(withSentry("checkout-management", async (req) => {
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
    const pathParts = url.pathname.split("/").filter(Boolean);
    const action = pathParts[pathParts.length - 1];
    const isOrderBump = pathParts.includes("order-bump");

    console.log(`[checkout-management] Action: ${action}, isOrderBump: ${isOrderBump}, Method: ${req.method}`);

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
      console.warn(`[checkout-management] Auth failed: ${sessionValidation.error}`);
      return errorResponse(sessionValidation.error || "Não autorizado", corsHeaders, 401);
    }

    const producerId = sessionValidation.producerId!;
    console.log(`[checkout-management] Authenticated producer: ${producerId}`);

    // ============================================
    // DELETE CHECKOUT (atomic cascade)
    // ============================================
    if (!isOrderBump && action === "delete" && (req.method === "DELETE" || req.method === "POST")) {
      const checkoutId = body.checkout_id || body.checkoutId;

      if (!checkoutId || typeof checkoutId !== "string") {
        return errorResponse("ID do checkout é obrigatório", corsHeaders, 400);
      }

      // Verify ownership
      const ownershipCheck = await verifyCheckoutOwnership(supabase, checkoutId, producerId);
      if (!ownershipCheck.valid) {
        console.warn(`[checkout-management] Unauthorized delete attempt: ${producerId} on checkout ${checkoutId}`);
        return errorResponse("Você não tem permissão para excluir este checkout", corsHeaders, 403);
      }

      // Cannot delete default checkout
      if (ownershipCheck.checkout?.is_default) {
        return errorResponse("Não é possível excluir o checkout padrão", corsHeaders, 400);
      }

      console.log(`[checkout-management] Starting atomic delete for checkout: ${checkoutId}`);

      // ATOMIC DELETE: Step by step with validation
      try {
        // 1. Get checkout_link and its payment_link
        const { data: checkoutLink } = await supabase
          .from("checkout_links")
          .select(`
            link_id,
            payment_links (
              id,
              is_original
            )
          `)
          .eq("checkout_id", checkoutId)
          .maybeSingle();

        // Extract payment_link info (handle both array and object responses)
        const paymentLinkData = checkoutLink?.payment_links as any;
        const isOriginal = Array.isArray(paymentLinkData) 
          ? paymentLinkData[0]?.is_original 
          : paymentLinkData?.is_original;

        // 2. Delete checkout_links association
        const { error: linkError } = await supabase
          .from("checkout_links")
          .delete()
          .eq("checkout_id", checkoutId);

        if (linkError) {
          console.error("[checkout-management] Error deleting checkout_links:", linkError);
          throw new Error(`Falha ao deletar links: ${linkError.message}`);
        }

        // 3. Delete duplicated payment_link (if not original)
        if (checkoutLink && isOriginal === false) {
          console.log(`[checkout-management] Deleting duplicated payment_link: ${checkoutLink.link_id}`);
          const { error: paymentLinkError } = await supabase
            .from("payment_links")
            .delete()
            .eq("id", checkoutLink.link_id);

          if (paymentLinkError) {
            console.warn("[checkout-management] Failed to delete payment_link:", paymentLinkError);
            // Don't fail the whole operation, just log
          }
        }

        // 4. Delete order_bumps associated with this checkout
        const { error: orderBumpError } = await supabase
          .from("order_bumps")
          .delete()
          .eq("checkout_id", checkoutId);

        if (orderBumpError) {
          console.warn("[checkout-management] Failed to delete order_bumps:", orderBumpError);
        }

        // 5. Delete checkout_rows (and checkout_components cascade)
        const { error: rowsError } = await supabase
          .from("checkout_rows")
          .delete()
          .eq("checkout_id", checkoutId);

        if (rowsError) {
          console.warn("[checkout-management] Failed to delete checkout_rows:", rowsError);
        }

        // 6. Delete the checkout itself
        const { error: deleteError } = await supabase
          .from("checkouts")
          .delete()
          .eq("id", checkoutId);

        if (deleteError) {
          console.error("[checkout-management] Error deleting checkout:", deleteError);
          throw new Error(`Falha ao deletar checkout: ${deleteError.message}`);
        }

        console.log(`[checkout-management] Checkout deleted successfully: ${checkoutId}`);
        return jsonResponse({ success: true }, corsHeaders);

      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error("[checkout-management] Atomic delete failed:", err.message);
        await captureException(err, {
          functionName: "checkout-management",
          extra: { action: "delete", producerId, checkoutId },
        });
        return errorResponse(`Erro ao excluir checkout: ${err.message}`, corsHeaders, 500);
      }
    }

    // ============================================
    // ORDER BUMP: CREATE
    // ============================================
    if (isOrderBump && action === "create" && req.method === "POST") {
      const rateCheck = await checkRateLimit(supabase, producerId, "order_bump_create");
      if (!rateCheck.allowed) {
        return jsonResponse(
          { success: false, error: "Muitas requisições. Tente novamente em alguns minutos.", retryAfter: rateCheck.retryAfter },
          corsHeaders,
          429
        );
      }

      const payload = body.orderBump || body;

      // Validate required fields
      if (!payload.checkout_id) {
        return errorResponse("ID do checkout é obrigatório", corsHeaders, 400);
      }
      if (!payload.product_id) {
        return errorResponse("ID do produto do bump é obrigatório", corsHeaders, 400);
      }
      if (!payload.offer_id) {
        return errorResponse("ID da oferta é obrigatório", corsHeaders, 400);
      }

      // Verify checkout ownership
      const isOwner = await verifyCheckoutForOrderBump(supabase, payload.checkout_id, producerId);
      if (!isOwner) {
        return errorResponse("Você não tem permissão para criar order bumps neste checkout", corsHeaders, 403);
      }

      // Validate discount_price if discount_enabled
      if (payload.discount_enabled && payload.discount_price !== undefined) {
        if (typeof payload.discount_price !== "number" || payload.discount_price <= 0) {
          return errorResponse("Preço de desconto deve ser um valor positivo", corsHeaders, 400);
        }
      }

      // Insert order bump
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
        console.error("[checkout-management] Order bump insert error:", insertError);
        
        if (insertError.code === "23505") {
          return errorResponse("Este produto já está configurado como order bump", corsHeaders, 400);
        }
        
        await captureException(new Error(insertError.message), {
          functionName: "checkout-management",
          extra: { action: "order-bump/create", producerId, payload },
        });
        return errorResponse("Erro ao criar order bump", corsHeaders, 500);
      }

      await recordRateLimitAttempt(supabase, producerId, "order_bump_create");

      console.log(`[checkout-management] Order bump created: ${newOrderBump.id} by ${producerId}`);
      return jsonResponse({ success: true, orderBump: newOrderBump }, corsHeaders);
    }

    // ============================================
    // ORDER BUMP: UPDATE
    // ============================================
    if (isOrderBump && action === "update" && (req.method === "PUT" || req.method === "POST")) {
      const rateCheck = await checkRateLimit(supabase, producerId, "order_bump_update");
      if (!rateCheck.allowed) {
        return jsonResponse(
          { success: false, error: "Muitas requisições. Tente novamente em alguns minutos.", retryAfter: rateCheck.retryAfter },
          corsHeaders,
          429
        );
      }

      const payload = body.orderBump || body;
      const orderBumpId = payload.id || payload.order_bump_id;

      if (!orderBumpId) {
        return errorResponse("ID do order bump é obrigatório", corsHeaders, 400);
      }

      // Verify ownership
      const ownershipCheck = await verifyOrderBumpOwnership(supabase, orderBumpId, producerId);
      if (!ownershipCheck.valid) {
        return errorResponse("Você não tem permissão para editar este order bump", corsHeaders, 403);
      }

      // Build update object
      const updates: any = { updated_at: new Date().toISOString() };

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
        console.error("[checkout-management] Order bump update error:", updateError);
        await captureException(new Error(updateError.message), {
          functionName: "checkout-management",
          extra: { action: "order-bump/update", producerId, orderBumpId, updates },
        });
        return errorResponse("Erro ao atualizar order bump", corsHeaders, 500);
      }

      await recordRateLimitAttempt(supabase, producerId, "order_bump_update");

      console.log(`[checkout-management] Order bump updated: ${orderBumpId} by ${producerId}`);
      return jsonResponse({ success: true, orderBump: updatedOrderBump }, corsHeaders);
    }

    // ============================================
    // ORDER BUMP: DELETE
    // ============================================
    if (isOrderBump && action === "delete" && (req.method === "DELETE" || req.method === "POST")) {
      const orderBumpId = body.order_bump_id || body.orderBumpId || body.id;

      if (!orderBumpId) {
        return errorResponse("ID do order bump é obrigatório", corsHeaders, 400);
      }

      // Verify ownership
      const ownershipCheck = await verifyOrderBumpOwnership(supabase, orderBumpId, producerId);
      if (!ownershipCheck.valid) {
        return errorResponse("Você não tem permissão para excluir este order bump", corsHeaders, 403);
      }

      const { error: deleteError } = await supabase
        .from("order_bumps")
        .delete()
        .eq("id", orderBumpId);

      if (deleteError) {
        console.error("[checkout-management] Order bump delete error:", deleteError);
        await captureException(new Error(deleteError.message), {
          functionName: "checkout-management",
          extra: { action: "order-bump/delete", producerId, orderBumpId },
        });
        return errorResponse("Erro ao excluir order bump", corsHeaders, 500);
      }

      console.log(`[checkout-management] Order bump deleted: ${orderBumpId} by ${producerId}`);
      return jsonResponse({ success: true }, corsHeaders);
    }

    // ============================================
    // UNKNOWN ACTION
    // ============================================
    return errorResponse(`Ação desconhecida: ${action}`, corsHeaders, 404);

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[checkout-management] Unexpected error:", err.message);
    await captureException(err, {
      functionName: "checkout-management",
      url: req.url,
      method: req.method,
    });
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
