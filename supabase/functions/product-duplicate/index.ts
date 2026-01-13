/**
 * product-duplicate Edge Function
 * 
 * Atomic product duplication with proper security.
 * Uses shared helpers for rate limiting, session validation, etc.
 * 
 * @refactored 2026-01-13 - Usando edge-helpers.ts
 * @version 2.0.0
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { handleCors } from "../_shared/cors.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";

import {
  jsonResponse,
  errorResponse,
  checkRateLimit,
  recordRateLimitAttempt,
  validateProducerSession,
  toSlug,
  ensureUniqueSlug,
  ensureUniqueName,
  STRICT_RATE_LIMIT,
} from "../_shared/edge-helpers.ts";

// ============================================
// OWNERSHIP VERIFICATION (specific for duplicate)
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
// CLONE HELPERS
// ============================================

async function cloneCheckoutLinks(
  supabase: any,
  srcCheckoutId: string,
  newCheckoutId: string,
  suggestedSlug: string
): Promise<void> {
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

async function cloneCheckoutDeep(
  supabase: any,
  srcCheckoutId: string,
  destCheckoutId: string
): Promise<void> {
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
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (req.method !== "POST") {
      return errorResponse("Método não permitido", corsHeaders, 405);
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return errorResponse("Corpo da requisição inválido", corsHeaders, 400);
    }

    // Authentication
    const sessionToken = body.sessionToken || req.headers.get("x-producer-session-token");
    const sessionValidation = await validateProducerSession(supabase, sessionToken);

    if (!sessionValidation.valid) {
      return errorResponse(sessionValidation.error || "Não autorizado", corsHeaders, 401);
    }

    const producerId = sessionValidation.producerId!;

    // Rate limiting (strict for expensive operation)
    const rateCheck = await checkRateLimit(supabase, producerId, {
      ...STRICT_RATE_LIMIT,
      action: "product_duplicate",
    });
    if (!rateCheck.allowed) {
      return jsonResponse(
        { success: false, error: "Muitas duplicações. Tente novamente em alguns minutos.", retryAfter: rateCheck.retryAfter },
        corsHeaders,
        429
      );
    }

    const productId = body.product_id || body.productId;
    if (!productId || typeof productId !== "string") {
      return errorResponse("ID do produto é obrigatório", corsHeaders, 400);
    }

    const ownershipCheck = await verifyProductOwnership(supabase, productId, producerId);
    if (!ownershipCheck.valid) {
      return errorResponse("Produto não encontrado ou você não tem permissão", corsHeaders, 403);
    }

    const srcProduct = ownershipCheck.product;
    console.log(`[product-duplicate] Duplicating: ${srcProduct.name} (${productId})`);

    try {
      const baseName = `${srcProduct.name} (Cópia)`;
      const newName = await ensureUniqueName(supabase, baseName);

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
        throw new Error(`Falha ao criar produto: ${insertError?.message}`);
      }

      const newProductId = newProduct.id;

      // Wait for trigger-created checkout and offer
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

      // Copy offers
      const { data: srcOffers } = await supabase
        .from("offers")
        .select("*")
        .eq("product_id", productId)
        .eq("status", "active");

      const srcDefaultOffer = (srcOffers ?? []).find((o: any) => o.is_default);
      if (srcDefaultOffer && autoOffer) {
        await supabase
          .from("offers")
          .update({ name: srcDefaultOffer.name, price: srcDefaultOffer.price, is_default: true })
          .eq("id", autoOffer.id);
      }

      for (const offer of (srcOffers ?? []).filter((o: any) => !o.is_default)) {
        await supabase.from("offers").insert({
          product_id: newProductId,
          name: offer.name,
          price: offer.price,
          is_default: false,
          status: "active",
        });
      }

      // Copy checkouts
      const { data: srcCheckouts } = await supabase
        .from("checkouts")
        .select("*")
        .eq("product_id", productId)
        .eq("status", "active");

      const srcDefaultCheckout = (srcCheckouts ?? []).find((c: any) => c.is_default);
      if (srcDefaultCheckout && autoCheckout) {
        const baseSlug = srcDefaultCheckout.slug || toSlug(srcProduct.name);
        const newSlug = await ensureUniqueSlug(supabase, "checkouts", "slug", baseSlug);

        await supabase
          .from("checkouts")
          .update({ name: srcDefaultCheckout.name, slug: newSlug, seller_name: srcDefaultCheckout.seller_name, is_default: true })
          .eq("id", autoCheckout.id);

        await cloneCheckoutDeep(supabase, srcDefaultCheckout.id, autoCheckout.id);
        await cloneCheckoutLinks(supabase, srcDefaultCheckout.id, autoCheckout.id, newSlug);
      }

      for (let i = 0; i < (srcCheckouts ?? []).length; i++) {
        const ck = (srcCheckouts ?? [])[i];
        if (ck.is_default) continue;

        const baseSlug = ck.slug || `${toSlug(srcProduct.name)}-${i + 1}`;
        const newSlug = await ensureUniqueSlug(supabase, "checkouts", "slug", baseSlug);

        const { data: newCk, error: ckError } = await supabase
          .from("checkouts")
          .insert({
            product_id: newProductId,
            name: ck.name,
            slug: newSlug,
            seller_name: ck.seller_name,
            is_default: false,
            visits_count: 0,
            status: "active",
          })
          .select("id")
          .single();

        if (!ckError && newCk) {
          await cloneCheckoutDeep(supabase, ck.id, newCk.id);
          await cloneCheckoutLinks(supabase, ck.id, newCk.id, newSlug);
        }
      }

      await recordRateLimitAttempt(supabase, producerId, "product_duplicate");

      return jsonResponse({
        success: true,
        newProductId,
        editUrl: `/dashboard/produtos/editar?id=${newProductId}`,
      }, corsHeaders);

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("[product-duplicate] Failed:", err.message);
      await captureException(err, { functionName: "product-duplicate", extra: { producerId, productId } });
      return errorResponse(`Erro ao duplicar produto: ${err.message}`, corsHeaders, 500);
    }

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[product-duplicate] Unexpected error:", err.message);
    await captureException(err, { functionName: "product-duplicate" });
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
