/**
 * checkout-editor Edge Function
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Handles checkout editor operations:
 * - get-editor-data: Load all data for CheckoutCustomizer
 * - update-design: Save checkout customization
 * 
 * CRITICAL: All design data is saved ONLY to the `design` JSON field.
 * Individual color columns are DEPRECATED and will be removed.
 * 
 * @version 4.0.0 - SSOT: design JSON is the single source of truth
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";
import { getAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";
import { checkRateLimit, type RateLimitConfig } from "../_shared/rate-limiting/index.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("checkout-editor");

// ============================================
// RATE LIMIT CONFIG
// ============================================

const CHECKOUT_EDITOR_RATE_LIMIT: RateLimitConfig = {
  action: "checkout_update_design",
  maxAttempts: 30,
  windowMinutes: 5,
  blockDurationMinutes: 5,
};

// ============================================
// TYPES
// ============================================

interface RequestBody {
  action?: string;
  sessionToken?: string;
  checkoutId?: string;
  design?: DesignSettings;
  topComponents?: unknown[];
  bottomComponents?: unknown[];
  mobileTopComponents?: unknown[];
  mobileBottomComponents?: unknown[];
}

interface DesignSettings {
  theme?: string;
  font?: string;
  colors?: Record<string, unknown>;
  backgroundImage?: BackgroundImageSettings | null;
}

interface BackgroundImageSettings {
  url?: string | null;
  expand?: boolean;
  fixed?: boolean;
  repeat?: boolean;
}

interface CheckoutWithProduct {
  id: string;
  name: string;
  is_default: boolean;
  product_id: string | null;
  products: { user_id: string } | { user_id: string }[] | null;
}

// ============================================
// HELPERS
// ============================================

function jsonResponse(data: unknown, corsHeaders: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, corsHeaders: Record<string, string>, status = 400): Response {
  return jsonResponse({ success: false, error: message }, corsHeaders, status);
}

// ============================================
// OWNERSHIP VERIFICATION
// ============================================

async function verifyCheckoutOwnership(
  supabase: SupabaseClient,
  checkoutId: string,
  producerId: string
): Promise<{ valid: boolean; checkout?: CheckoutWithProduct }> {
  const { data, error } = await supabase
    .from("checkouts")
    .select("id, name, is_default, product_id, products!inner(user_id)")
    .eq("id", checkoutId)
    .single();

  if (error || !data) return { valid: false };
  
  const checkout = data as unknown as CheckoutWithProduct;
  const productsData = checkout.products;
  
  let userId: string | undefined;
  if (productsData) {
    if (Array.isArray(productsData)) {
      userId = productsData[0]?.user_id;
    } else {
      userId = productsData.user_id;
    }
  }
  
  if (userId !== producerId) return { valid: false };
  return { valid: true, checkout };
}

// ============================================
// DESIGN BUILDER - SSOT
// ============================================

/**
 * Builds the complete design object for saving.
 * RISE V3: design JSON is the SINGLE SOURCE OF TRUTH for all checkout styling.
 */
function buildDesignUpdate(
  existingDesign: Record<string, unknown> | null,
  incomingDesign: DesignSettings
): Record<string, unknown> {
  // Start with existing design or empty object
  const current = existingDesign ?? {};
  
  // Build merged design object
  const merged: Record<string, unknown> = {
    theme: incomingDesign.theme ?? current.theme ?? 'light',
    font: incomingDesign.font ?? current.font ?? 'Inter',
    colors: current.colors ?? {},
    backgroundImage: current.backgroundImage ?? null,
  };
  
  // Merge colors if provided (deep merge to preserve existing properties)
  if (incomingDesign.colors) {
    merged.colors = deepMergeColors(
      merged.colors as Record<string, unknown>,
      incomingDesign.colors
    );
  }
  
  // Update backgroundImage if explicitly provided
  if (incomingDesign.backgroundImage !== undefined) {
    merged.backgroundImage = incomingDesign.backgroundImage;
  }
  
  return merged;
}

/**
 * Deep merges color objects, preserving nested structures
 */
function deepMergeColors(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...target };
  
  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];
    
    if (
      sourceValue !== null &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue !== null &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      // Recursively merge nested objects
      result[key] = deepMergeColors(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      );
    } else if (sourceValue !== undefined) {
      // Direct assignment for primitives and null
      result[key] = sourceValue;
    }
  }
  
  return result;
}

// ============================================
// MAIN HANDLER
// ============================================

serve(withSentry("checkout-editor", async (req) => {
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabase: SupabaseClient = getSupabaseClient('general');

    // Parse body first to get action
    let body: RequestBody = {};
    if (req.method !== "GET") {
      try { body = await req.json(); } catch { return errorResponse("Corpo da requisição inválido", corsHeaders, 400); }
    }

    const action = body.action;
    if (!action) {
      log.error("Missing action in request body");
      return errorResponse("Ação é obrigatória", corsHeaders, 400);
    }

    // unified-auth.ts
    const producer = await getAuthenticatedProducer(supabase, req);
    if (!producer) {
      return unauthorizedResponse(corsHeaders);
    }

    const producerId = producer.id;
    log.info(`Action: ${action}, Producer: ${producerId}`);

    // ========== GET-EDITOR-DATA ==========
    if (action === "get-editor-data" && (req.method === "POST" || req.method === "GET")) {
      const { checkoutId } = body;
      if (!checkoutId) return errorResponse("ID do checkout é obrigatório", corsHeaders, 400);

      const ownershipCheck = await verifyCheckoutOwnership(supabase, checkoutId, producerId);
      if (!ownershipCheck.valid) return errorResponse("Você não tem permissão para acessar este checkout", corsHeaders, 403);

      try {
        const { data: checkout, error: checkoutError } = await supabase
          .from("checkouts")
          .select(`*, products (*), checkout_links (payment_links (offers (id, name, price)))`)
          .eq("id", checkoutId)
          .single();

        if (checkoutError) throw new Error(`Falha ao carregar checkout: ${checkoutError.message}`);

        let offers: unknown[] = [];
        if (checkout.product_id) {
          const { data: offersData } = await supabase.from("offers").select("*").eq("product_id", checkout.product_id);
          offers = offersData || [];
        }

        // RISE V3: Query by parent_product_id (product that owns the checkout)
        const { data: orderBumps } = await supabase
          .from("order_bumps")
          .select(`*, products!order_bumps_product_id_fkey(*), offers(*)`)
          .eq("parent_product_id", checkout.product_id)
          .eq("active", true)
          .order("position");

        return jsonResponse({
          success: true,
          data: { checkout, product: checkout.products, offers, orderBumps: orderBumps || [] },
        }, corsHeaders);
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        await captureException(err, { functionName: "checkout-editor", extra: { action: "get-editor-data", checkoutId } });
        return errorResponse(`Erro ao carregar dados: ${err.message}`, corsHeaders, 500);
      }
    }

    // ========== UPDATE-DESIGN ==========
    if (action === "update-design" && (req.method === "POST" || req.method === "PUT")) {
      const rateCheck = await checkRateLimit(supabase, producerId, CHECKOUT_EDITOR_RATE_LIMIT);
      if (!rateCheck.allowed) return jsonResponse({ success: false, error: rateCheck.error || "Muitas requisições.", retryAfter: rateCheck.retryAfter }, corsHeaders, 429);

      const { checkoutId, design, topComponents, bottomComponents, mobileTopComponents, mobileBottomComponents } = body;
      if (!checkoutId) return errorResponse("ID do checkout é obrigatório", corsHeaders, 400);

      const ownershipCheck = await verifyCheckoutOwnership(supabase, checkoutId, producerId);
      if (!ownershipCheck.valid) return errorResponse("Você não tem permissão para editar este checkout", corsHeaders, 403);

      try {
        // Fetch current design to merge with incoming changes
        const { data: currentCheckout, error: fetchError } = await supabase
          .from("checkouts")
          .select("design, theme, font")
          .eq("id", checkoutId)
          .single();

        if (fetchError) throw new Error(`Falha ao carregar checkout: ${fetchError.message}`);

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

        // SSOT: Build complete design object
        if (design !== undefined) {
          const existingDesign = currentCheckout?.design as Record<string, unknown> | null;
          updates.design = buildDesignUpdate(existingDesign, design);
          
          // Also update theme and font columns for query optimization
          if (design.theme !== undefined) updates.theme = design.theme;
          if (design.font !== undefined) updates.font = design.font;
        }

        if (topComponents !== undefined) updates.top_components = topComponents;
        if (bottomComponents !== undefined) updates.bottom_components = bottomComponents;
        
        // RISE V3: Dual-Layout - Save mobile components
        if (mobileTopComponents !== undefined) updates.mobile_top_components = mobileTopComponents;
        if (mobileBottomComponents !== undefined) updates.mobile_bottom_components = mobileBottomComponents;
        
        updates.components = [];

        const { error: updateError } = await supabase.from("checkouts").update(updates).eq("id", checkoutId);
        if (updateError) throw new Error(`Falha ao salvar design: ${updateError.message}`);

        log.info(`Design saved successfully for checkout ${checkoutId}`);
        return jsonResponse({ success: true }, corsHeaders);
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        await captureException(err, { functionName: "checkout-editor", extra: { action: "update-design", checkoutId } });
        return errorResponse(`Erro ao salvar design: ${err.message}`, corsHeaders, 500);
      }
    }

    return errorResponse(`Ação desconhecida: ${action}`, corsHeaders, 404);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await captureException(err, { functionName: "checkout-editor", url: req.url, method: req.method });
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
