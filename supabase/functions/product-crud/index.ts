/**
 * product-crud Edge Function
 * 
 * Handles basic product CRUD operations:
 * - create: Create new product
 * - update: Update product fields
 * - delete: Delete product (simple cascade)
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
// TYPES
// ============================================

interface ProductCreatePayload {
  name: string;
  description?: string;
  price: number;
  delivery_url?: string | null;
  external_delivery?: boolean;
  support_name?: string;
  support_email?: string;
  image_url?: string | null;
}

// ============================================
// VALIDATION
// ============================================

function validateCreateProduct(data: any): { valid: boolean; error?: string; sanitized?: ProductCreatePayload } {
  if (!data.name || typeof data.name !== "string") {
    return { valid: false, error: "Nome do produto é obrigatório" };
  }

  const name = data.name.trim();
  if (name.length < 1 || name.length > 200) {
    return { valid: false, error: "Nome deve ter entre 1 e 200 caracteres" };
  }

  if (typeof data.price !== "number" || !Number.isInteger(data.price) || data.price <= 0) {
    return { valid: false, error: "Preço deve ser um valor inteiro positivo em centavos" };
  }

  let description = "";
  if (data.description) {
    if (typeof data.description !== "string") {
      return { valid: false, error: "Descrição deve ser texto" };
    }
    description = data.description.trim();
    if (description.length > 2000) {
      return { valid: false, error: "Descrição deve ter no máximo 2000 caracteres" };
    }
  }

  let deliveryUrl: string | null = null;
  const externalDelivery = data.external_delivery === true;

  if (!externalDelivery && data.delivery_url) {
    if (typeof data.delivery_url !== "string") {
      return { valid: false, error: "Link de entrega deve ser texto" };
    }
    deliveryUrl = data.delivery_url.trim();
    if (deliveryUrl && !deliveryUrl.startsWith("https://")) {
      return { valid: false, error: "Link de entrega deve começar com https://" };
    }
    if (deliveryUrl) {
      try { new URL(deliveryUrl); } catch { return { valid: false, error: "Link de entrega inválido" }; }
    }
  }

  return {
    valid: true,
    sanitized: {
      name,
      description,
      price: data.price,
      delivery_url: deliveryUrl,
      external_delivery: externalDelivery,
      support_name: typeof data.support_name === "string" ? data.support_name.trim() : "",
      support_email: typeof data.support_email === "string" ? data.support_email.trim().toLowerCase() : "",
      image_url: data.image_url || null,
    },
  };
}

function validateUpdateProduct(data: any): { valid: boolean; error?: string; productId?: string; updates?: Record<string, any> } {
  if (!data.productId || typeof data.productId !== "string") {
    return { valid: false, error: "ID do produto é obrigatório" };
  }

  const updates: Record<string, any> = {};

  if (data.name !== undefined) {
    if (typeof data.name !== "string") return { valid: false, error: "Nome deve ser texto" };
    const name = data.name.trim();
    if (name.length < 1 || name.length > 200) return { valid: false, error: "Nome deve ter entre 1 e 200 caracteres" };
    updates.name = name;
  }

  if (data.description !== undefined) {
    if (typeof data.description !== "string") return { valid: false, error: "Descrição deve ser texto" };
    updates.description = data.description.trim();
  }

  if (data.price !== undefined) {
    if (typeof data.price !== "number" || !Number.isInteger(data.price) || data.price <= 0) {
      return { valid: false, error: "Preço deve ser um valor inteiro positivo em centavos" };
    }
    updates.price = data.price;
  }

  if (data.delivery_url !== undefined) {
    if (data.delivery_url !== null && typeof data.delivery_url !== "string") {
      return { valid: false, error: "Link de entrega deve ser texto" };
    }
    if (data.delivery_url) {
      const url = data.delivery_url.trim();
      if (url && !url.startsWith("https://")) return { valid: false, error: "Link de entrega deve começar com https://" };
      try { if (url) new URL(url); } catch { return { valid: false, error: "Link de entrega inválido" }; }
      updates.delivery_url = url;
    } else {
      updates.delivery_url = null;
    }
  }

  if (data.external_delivery !== undefined) updates.external_delivery = data.external_delivery === true;
  if (data.support_name !== undefined) updates.support_name = typeof data.support_name === "string" ? data.support_name.trim() : "";
  if (data.support_email !== undefined) updates.support_email = typeof data.support_email === "string" ? data.support_email.trim().toLowerCase() : "";
  if (data.image_url !== undefined) updates.image_url = data.image_url;
  if (data.status !== undefined) {
    if (!["active", "blocked"].includes(data.status)) return { valid: false, error: "Status deve ser 'active' ou 'blocked'" };
    updates.status = data.status;
  }

  return { valid: true, productId: data.productId, updates };
}

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

// ============================================
// MAIN HANDLER
// ============================================

serve(withSentry("product-crud", async (req) => {
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let body: any = {};
    if (req.method !== "GET") {
      try { body = await req.json(); } catch { return errorResponse("Corpo da requisição inválido", corsHeaders, 400); }
    }

    const { action } = body;
    console.log(`[product-crud] Action: ${action}, Method: ${req.method}`);

    // Auth
    const sessionToken = body.sessionToken || req.headers.get("x-producer-session-token");
    const sessionResult = await validateSession(supabase, sessionToken);
    if (!sessionResult.valid) return errorResponse(sessionResult.error || "Não autorizado", corsHeaders, 401);
    const producerId = sessionResult.producerId!;

    // ============================================
    // CREATE
    // ============================================
    if (action === "create") {
      const rateCheck = await checkRateLimit(supabase, producerId, "product_create");
      if (!rateCheck.allowed) return jsonResponse({ success: false, error: "Muitas requisições", retryAfter: rateCheck.retryAfter }, corsHeaders, 429);

      const validation = validateCreateProduct(body.product || body);
      if (!validation.valid) return errorResponse(validation.error!, corsHeaders, 400);

      const productData = validation.sanitized!;
      const { data: newProduct, error: insertError } = await supabase
        .from("products")
        .insert({ ...productData, user_id: producerId, status: "active" })
        .select()
        .single();

      if (insertError) {
        console.error("[product-crud] Insert error:", insertError);
        await captureException(new Error(insertError.message), { functionName: "product-crud", extra: { action: "create", producerId } });
        return errorResponse("Erro ao criar produto", corsHeaders, 500);
      }

      await recordAttempt(supabase, producerId, "product_create");
      console.log(`[product-crud] Product created: ${newProduct.id}`);
      return jsonResponse({ success: true, product: newProduct }, corsHeaders);
    }

    // ============================================
    // UPDATE
    // ============================================
    if (action === "update") {
      const rateCheck = await checkRateLimit(supabase, producerId, "product_update");
      if (!rateCheck.allowed) return jsonResponse({ success: false, error: "Muitas requisições", retryAfter: rateCheck.retryAfter }, corsHeaders, 429);

      const validation = validateUpdateProduct(body.product || body);
      if (!validation.valid) return errorResponse(validation.error!, corsHeaders, 400);

      const { productId, updates } = validation;

      // Verify ownership
      const { data: existingProduct, error: fetchError } = await supabase.from("products").select("id, user_id").eq("id", productId).single();
      if (fetchError || !existingProduct) return errorResponse("Produto não encontrado", corsHeaders, 404);
      if (existingProduct.user_id !== producerId) return errorResponse("Você não tem permissão para editar este produto", corsHeaders, 403);

      const { data: updatedProduct, error: updateError } = await supabase
        .from("products")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", productId)
        .select()
        .single();

      if (updateError) {
        console.error("[product-crud] Update error:", updateError);
        return errorResponse("Erro ao atualizar produto", corsHeaders, 500);
      }

      await recordAttempt(supabase, producerId, "product_update");
      console.log(`[product-crud] Product updated: ${productId}`);
      return jsonResponse({ success: true, product: updatedProduct }, corsHeaders);
    }

    // ============================================
    // DELETE
    // ============================================
    if (action === "delete") {
      const productId = body.productId;
      if (!productId) return errorResponse("ID do produto é obrigatório", corsHeaders, 400);

      // Verify ownership
      const { data: existingProduct, error: fetchError } = await supabase.from("products").select("id, user_id, name").eq("id", productId).single();
      if (fetchError || !existingProduct) return errorResponse("Produto não encontrado", corsHeaders, 404);
      if (existingProduct.user_id !== producerId) return errorResponse("Você não tem permissão para excluir este produto", corsHeaders, 403);

      const { error: deleteError } = await supabase.from("products").delete().eq("id", productId);
      if (deleteError) {
        console.error("[product-crud] Delete error:", deleteError);
        return errorResponse("Erro ao excluir produto", corsHeaders, 500);
      }

      console.log(`[product-crud] Product deleted: ${productId} (${existingProduct.name})`);
      return jsonResponse({ success: true, deletedId: productId }, corsHeaders);
    }

    return errorResponse(`Ação desconhecida: ${action}`, corsHeaders, 404);

  } catch (error) {
    console.error("[product-crud] Unexpected error:", error);
    await captureException(error instanceof Error ? error : new Error(String(error)), { functionName: "product-crud" });
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
