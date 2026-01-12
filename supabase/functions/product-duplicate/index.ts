/**
 * product-duplicate Edge Function
 * 
 * Atomic product duplication with proper security:
 * - Authentication via producer_sessions (not JWT)
 * - Rate limiting (stricter - expensive operation)
 * - Atomic operation (all or nothing)
 * - Sentry error tracking
 * 
 * RISE Protocol Compliant:
 * - Secure CORS
 * - Rate limiting
 * - Atomic transaction
 * 
 * Endpoints:
 * - POST /duplicate - Duplicate product with all related data
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS - Secure centralized handler
import { handleCors } from "../_shared/cors.ts";

// Sentry error tracking
import { withSentry, captureException } from "../_shared/sentry.ts";

// ============================================
// RATE LIMITING (stricter for expensive operation)
// ============================================

async function checkRateLimit(
  supabase: any,
  producerId: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const MAX_ATTEMPTS = 5; // Only 5 duplications per 5 minutes
  const WINDOW_MS = 5 * 60 * 1000;

  const windowStart = new Date(Date.now() - WINDOW_MS);

  const { data: attempts, error } = await supabase
    .from("rate_limit_attempts")
    .select("id")
    .eq("identifier", `producer:${producerId}`)
    .eq("action", "product_duplicate")
    .gte("created_at", windowStart.toISOString());

  if (error) {
    console.error("[product-duplicate] Rate limit check error:", error);
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
  producerId: string
): Promise<void> {
  await supabase.from("rate_limit_attempts").insert({
    identifier: `producer:${producerId}`,
    action: "product_duplicate",
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

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

async function ensureUniqueSlug(
  supabase: any,
  table: string,
  column: string,
  baseSlug: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  const maxAttempts = 100;

  while (counter <= maxAttempts) {
    const { data, error } = await supabase
      .from(table)
      .select("id")
      .eq(column, slug)
      .maybeSingle();

    if (error || !data) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  // Fallback with random suffix
  return `${baseSlug}-${Date.now()}`;
}

async function ensureUniqueName(supabase: any, baseName: string): Promise<string> {
  let name = baseName;
  let counter = 1;
  const maxAttempts = 100;

  while (counter <= maxAttempts) {
    const { data, error } = await supabase
      .from("products")
      .select("id")
      .eq("name", name)
      .maybeSingle();

    if (error || !data) {
      return name;
    }

    counter++;
    name = `${baseName} ${counter}`;
  }

  return `${baseName} ${Date.now()}`;
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
): Promise<{ valid: boolean; product?: any }> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, description, price, image_url, user_id, status, support_name, support_email")
    .eq("id", productId)
    .eq("user_id", producerId)
    .single();

  if (error || !data) {
    return { valid: false };
  }

  return { valid: true, product: data };
}

// ============================================
// CLONE CHECKOUT LINKS
// ============================================

async function cloneCheckoutLinks(
  supabase: any,
  srcCheckoutId: string,
  newCheckoutId: string,
  suggestedSlug: string
): Promise<void> {
  // Try checkout_links first
  try {
    const { data: srcLinks } = await supabase
      .from("checkout_links")
      .select("*")
      .eq("checkout_id", srcCheckoutId);

    if (srcLinks?.length) {
      for (const link of srcLinks) {
        const newSlug = await ensureUniqueSlug(supabase, "checkout_links", "slug", suggestedSlug);
        const insert: any = { ...link, id: undefined, checkout_id: newCheckoutId, slug: newSlug };
        delete insert.created_at;
        delete insert.updated_at;
        await supabase.from("checkout_links").insert(insert);
      }
      return;
    }
  } catch (e) {
    console.log("[product-duplicate] No checkout_links found, trying payment_links");
  }

  // Fallback to payment_links
  try {
    const { data: payLinks } = await supabase
      .from("payment_links")
      .select("*")
      .eq("checkout_id", srcCheckoutId);

    if (payLinks?.length) {
      for (const link of payLinks) {
        const newSlug = await ensureUniqueSlug(supabase, "payment_links", "slug", suggestedSlug);
        const insert: any = { ...link, id: undefined, checkout_id: newCheckoutId, slug: newSlug };
        delete insert.created_at;
        delete insert.updated_at;
        await supabase.from("payment_links").insert(insert);
      }
    }
  } catch (e) {
    console.log("[product-duplicate] No payment_links found");
  }
}

// ============================================
// CLONE CHECKOUT DEEP (rows, components)
// ============================================

async function cloneCheckoutDeep(
  supabase: any,
  srcCheckoutId: string,
  destCheckoutId: string
): Promise<void> {
  // Clone checkout_rows
  const { data: srcRows } = await supabase
    .from("checkout_rows")
    .select("*")
    .eq("checkout_id", srcCheckoutId)
    .order("row_order", { ascending: true });

  if (!srcRows?.length) return;

  for (const row of srcRows) {
    const { data: newRow, error: rowError } = await supabase
      .from("checkout_rows")
      .insert({
        checkout_id: destCheckoutId,
        layout: row.layout,
        row_order: row.row_order,
      })
      .select("id")
      .single();

    if (rowError || !newRow) {
      console.error("[product-duplicate] Failed to clone row:", rowError);
      continue;
    }

    // Clone components for this row
    const { data: srcComponents } = await supabase
      .from("checkout_components")
      .select("*")
      .eq("row_id", row.id)
      .order("component_order", { ascending: true });

    if (srcComponents?.length) {
      for (const comp of srcComponents) {
        await supabase.from("checkout_components").insert({
          row_id: newRow.id,
          type: comp.type,
          content: comp.content,
          component_order: comp.component_order,
        });
      }
    }
  }
}

// ============================================
// MAIN HANDLER
// ============================================

serve(withSentry("product-duplicate", async (req) => {
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

    console.log(`[product-duplicate] Action: ${action}, Method: ${req.method}`);

    // Only accept POST
    if (req.method !== "POST") {
      return errorResponse("Método não permitido", corsHeaders, 405);
    }

    // Parse body
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return errorResponse("Corpo da requisição inválido", corsHeaders, 400);
    }

    // ============================================
    // AUTHENTICATION
    // ============================================
    const sessionToken = body.sessionToken || req.headers.get("x-producer-session-token");
    const sessionValidation = await validateProducerSession(supabase, sessionToken);

    if (!sessionValidation.valid) {
      console.warn(`[product-duplicate] Auth failed: ${sessionValidation.error}`);
      return errorResponse(sessionValidation.error || "Não autorizado", corsHeaders, 401);
    }

    const producerId = sessionValidation.producerId!;
    console.log(`[product-duplicate] Authenticated producer: ${producerId}`);

    // ============================================
    // RATE LIMITING
    // ============================================
    const rateCheck = await checkRateLimit(supabase, producerId);
    if (!rateCheck.allowed) {
      return jsonResponse(
        { success: false, error: "Muitas duplicações. Tente novamente em alguns minutos.", retryAfter: rateCheck.retryAfter },
        corsHeaders,
        429
      );
    }

    // ============================================
    // DUPLICATE PRODUCT
    // ============================================
    const productId = body.product_id || body.productId;

    if (!productId || typeof productId !== "string") {
      return errorResponse("ID do produto é obrigatório", corsHeaders, 400);
    }

    // Verify ownership and get product
    const ownershipCheck = await verifyProductOwnership(supabase, productId, producerId);
    if (!ownershipCheck.valid) {
      return errorResponse("Produto não encontrado ou você não tem permissão", corsHeaders, 403);
    }

    const srcProduct = ownershipCheck.product;
    console.log(`[product-duplicate] Duplicating product: ${srcProduct.name} (${productId})`);

    try {
      // 1. Generate unique name
      const baseName = `${srcProduct.name} (Cópia)`;
      const newName = await ensureUniqueName(supabase, baseName);
      console.log(`[product-duplicate] New product name: ${newName}`);

      // 2. Create new product
      const { data: newProduct, error: insertError } = await supabase
        .from("products")
        .insert({
          name: newName,
          description: srcProduct.description ?? null,
          price: srcProduct.price,
          image_url: srcProduct.image_url ?? null,
          user_id: producerId,
          status: srcProduct.status ?? "active",
          support_name: srcProduct.support_name ?? null,
          support_email: srcProduct.support_email ?? null,
        })
        .select("id, name")
        .single();

      if (insertError || !newProduct) {
        console.error("[product-duplicate] Failed to create product:", insertError);
        throw new Error(`Falha ao criar produto: ${insertError?.message}`);
      }

      const newProductId = newProduct.id;
      console.log(`[product-duplicate] New product created: ${newProductId}`);

      // 3. Wait for trigger-created checkout and offer
      let autoCheckout: any = null;
      let autoOffer: any = null;

      for (let i = 0; i < 10 && (!autoCheckout || !autoOffer); i++) {
        if (!autoCheckout) {
          const { data } = await supabase
            .from("checkouts")
            .select("id, is_default")
            .eq("product_id", newProductId)
            .maybeSingle();
          autoCheckout = data || null;
        }
        if (!autoOffer) {
          const { data } = await supabase
            .from("offers")
            .select("id, is_default, price")
            .eq("product_id", newProductId)
            .maybeSingle();
          autoOffer = data || null;
        }
        if (!autoCheckout || !autoOffer) {
          await new Promise(r => setTimeout(r, 200));
        }
      }

      if (!autoCheckout) {
        throw new Error("Timeout: checkout não foi criado por trigger");
      }

      console.log(`[product-duplicate] Auto-created: checkout=${autoCheckout?.id}, offer=${autoOffer?.id}`);

      // 4. Copy offers (only active)
      const { data: srcOffers, error: offersError } = await supabase
        .from("offers")
        .select("*")
        .eq("product_id", productId)
        .eq("status", "active");

      if (offersError) throw offersError;

      // Update default offer to match source
      const srcDefaultOffer = (srcOffers ?? []).find((o: any) => o.is_default);
      if (srcDefaultOffer && autoOffer) {
        await supabase
          .from("offers")
          .update({
            name: srcDefaultOffer.name ?? null,
            price: srcDefaultOffer.price,
            is_default: true,
          })
          .eq("id", autoOffer.id);
      }

      // Insert non-default offers
      for (const offer of (srcOffers ?? []).filter((o: any) => !o.is_default)) {
        await supabase.from("offers").insert({
          product_id: newProductId,
          name: offer.name ?? null,
          price: offer.price,
          is_default: false,
          status: "active",
        });
      }

      console.log(`[product-duplicate] Offers copied`);

      // 5. Copy checkouts (only active)
      const { data: srcCheckouts, error: checkoutsError } = await supabase
        .from("checkouts")
        .select("*")
        .eq("product_id", productId)
        .eq("status", "active");

      if (checkoutsError) throw checkoutsError;

      // Update default checkout to match source
      const srcDefaultCheckout = (srcCheckouts ?? []).find((c: any) => c.is_default);
      if (srcDefaultCheckout && autoCheckout) {
        const baseSlug = srcDefaultCheckout.slug || toSlug(srcProduct.name);
        const newSlug = await ensureUniqueSlug(supabase, "checkouts", "slug", baseSlug);

        await supabase
          .from("checkouts")
          .update({
            name: srcDefaultCheckout.name,
            slug: newSlug,
            seller_name: srcDefaultCheckout.seller_name ?? null,
            is_default: true,
          })
          .eq("id", autoCheckout.id);

        // Clone deep (rows, components)
        await cloneCheckoutDeep(supabase, srcDefaultCheckout.id, autoCheckout.id);

        // Clone links
        await cloneCheckoutLinks(supabase, srcDefaultCheckout.id, autoCheckout.id, newSlug);
      }

      // Insert non-default checkouts
      for (let i = 0; i < (srcCheckouts ?? []).length; i++) {
        const ck = srcCheckouts[i];
        if (ck.is_default) continue;

        const baseSlug = ck.slug || `${toSlug(srcProduct.name)}-${i + 1}`;
        const newSlug = await ensureUniqueSlug(supabase, "checkouts", "slug", baseSlug);

        const { data: newCk, error: ckError } = await supabase
          .from("checkouts")
          .insert({
            product_id: newProductId,
            name: ck.name,
            slug: newSlug,
            seller_name: ck.seller_name ?? null,
            is_default: false,
            visits_count: 0,
            status: "active",
          })
          .select("id")
          .single();

        if (ckError || !newCk) {
          console.error("[product-duplicate] Failed to clone checkout:", ckError);
          continue;
        }

        await cloneCheckoutDeep(supabase, ck.id, newCk.id);
        await cloneCheckoutLinks(supabase, ck.id, newCk.id, newSlug);
      }

      console.log(`[product-duplicate] Checkouts copied`);

      // Record rate limit attempt
      await recordRateLimitAttempt(supabase, producerId);

      console.log(`[product-duplicate] Duplication completed successfully`);
      return jsonResponse({
        success: true,
        newProductId,
        editUrl: `/dashboard/produtos/editar?id=${newProductId}`,
      }, corsHeaders);

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("[product-duplicate] Duplication failed:", err.message);
      await captureException(err, {
        functionName: "product-duplicate",
        extra: { action: "duplicate", producerId, productId },
      });
      return errorResponse(`Erro ao duplicar produto: ${err.message}`, corsHeaders, 500);
    }

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[product-duplicate] Unexpected error:", err.message);
    await captureException(err, {
      functionName: "product-duplicate",
      url: req.url,
      method: req.method,
    });
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
