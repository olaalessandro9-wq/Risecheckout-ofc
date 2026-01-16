/**
 * checkout-editor Edge Function
 * 
 * Handles checkout editor operations:
 * - get-editor-data: Load all data for CheckoutCustomizer
 * - update-design: Save checkout customization
 * 
 * @version 2.0.0 - Zero `any` compliance (RISE Protocol V2)
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";

// ============================================
// TYPES
// ============================================

interface RequestBody {
  sessionToken?: string;
  checkoutId?: string;
  design?: DesignSettings;
  topComponents?: unknown[];
  bottomComponents?: unknown[];
}

interface DesignSettings {
  theme?: string;
  font?: string;
  colors?: ColorSettings;
  backgroundImage?: BackgroundImageSettings | null;
}

interface ColorSettings {
  background?: string;
  primaryText?: string;
  secondaryText?: string;
  active?: string;
  icon?: string;
  formBackground?: string;
  button?: { background?: string; text?: string };
  creditCardFields?: {
    background?: string;
    text?: string;
    border?: string;
    focusBorder?: string;
    focusText?: string;
    placeholder?: string;
  };
  selectedBox?: BoxColors;
  unselectedBox?: BoxColors;
  selectedButton?: ButtonColors;
  unselectedButton?: ButtonColors;
}

interface BoxColors {
  background?: string;
  headerBackground?: string;
  headerPrimaryText?: string;
  headerSecondaryText?: string;
  primaryText?: string;
  secondaryText?: string;
}

interface ButtonColors {
  background?: string;
  text?: string;
  icon?: string;
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
// RATE LIMITING
// ============================================

async function checkRateLimit(
  supabase: SupabaseClient,
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

  if (error) return { allowed: true };
  if ((attempts?.length || 0) >= MAX_ATTEMPTS) return { allowed: false, retryAfter: 300 };
  return { allowed: true };
}

async function recordRateLimitAttempt(supabase: SupabaseClient, producerId: string, action: string): Promise<void> {
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
  supabase: SupabaseClient,
  sessionToken: string
): Promise<{ valid: boolean; producerId?: string; error?: string }> {
  if (!sessionToken) return { valid: false, error: "Token de sessão não fornecido" };

  const { data: session, error } = await supabase
    .from("producer_sessions")
    .select("producer_id, expires_at, is_valid")
    .eq("session_token", sessionToken)
    .single();

  if (error || !session) return { valid: false, error: "Sessão inválida" };
  if (!session.is_valid) return { valid: false, error: "Sessão expirada ou invalidada" };

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
// MAIN HANDLER
// ============================================

serve(withSentry("checkout-editor", async (req) => {
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const action = pathParts[pathParts.length - 1];

    let body: RequestBody = {};
    if (req.method !== "GET") {
      try { body = await req.json(); } catch { return errorResponse("Corpo da requisição inválido", corsHeaders, 400); }
    }

    const sessionToken = body.sessionToken || req.headers.get("x-producer-session-token");
    const sessionValidation = await validateProducerSession(supabase, sessionToken || '');
    if (!sessionValidation.valid) return errorResponse(sessionValidation.error || "Não autorizado", corsHeaders, 401);

    const producerId = sessionValidation.producerId!;
    console.log(`[checkout-editor] Action: ${action}, Producer: ${producerId}`);

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

        const { data: orderBumps } = await supabase
          .from("order_bumps")
          .select(`*, products!order_bumps_product_id_fkey(*), offers(*)`)
          .eq("checkout_id", checkoutId)
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
      const rateCheck = await checkRateLimit(supabase, producerId, "checkout_update_design");
      if (!rateCheck.allowed) return jsonResponse({ success: false, error: "Muitas requisições.", retryAfter: rateCheck.retryAfter }, corsHeaders, 429);

      const { checkoutId, design, topComponents, bottomComponents } = body;
      if (!checkoutId) return errorResponse("ID do checkout é obrigatório", corsHeaders, 400);

      const ownershipCheck = await verifyCheckoutOwnership(supabase, checkoutId, producerId);
      if (!ownershipCheck.valid) return errorResponse("Você não tem permissão para editar este checkout", corsHeaders, 403);

      try {
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

        if (design?.theme !== undefined) updates.theme = design.theme;
        if (design?.font !== undefined) updates.font = design.font;

        if (design?.colors) {
          const colors = design.colors;
          if (colors.background !== undefined) updates.background_color = colors.background;
          if (colors.primaryText !== undefined) updates.primary_text_color = colors.primaryText;
          if (colors.secondaryText !== undefined) updates.secondary_text_color = colors.secondaryText;
          if (colors.active !== undefined) updates.active_text_color = colors.active;
          if (colors.icon !== undefined) updates.icon_color = colors.icon;
          if (colors.formBackground !== undefined) updates.form_background_color = colors.formBackground;

          if (colors.button) {
            if (colors.button.background !== undefined) updates.payment_button_bg_color = colors.button.background;
            if (colors.button.text !== undefined) updates.payment_button_text_color = colors.button.text;
          }

          if (colors.creditCardFields) {
            const ccFields = colors.creditCardFields;
            if (ccFields.background !== undefined) updates.cc_field_background_color = ccFields.background;
            if (ccFields.text !== undefined) updates.cc_field_text_color = ccFields.text;
            if (ccFields.border !== undefined) updates.cc_field_border_color = ccFields.border;
            if (ccFields.focusBorder !== undefined) updates.cc_field_focus_border_color = ccFields.focusBorder;
            if (ccFields.focusText !== undefined) updates.cc_field_focus_text_color = ccFields.focusText;
            if (ccFields.placeholder !== undefined) updates.cc_field_placeholder_color = ccFields.placeholder;
          }

          if (colors.selectedBox) {
            const sb = colors.selectedBox;
            if (sb.background !== undefined) updates.selected_box_bg_color = sb.background;
            if (sb.headerBackground !== undefined) updates.selected_box_header_bg_color = sb.headerBackground;
            if (sb.headerPrimaryText !== undefined) updates.selected_box_header_primary_text_color = sb.headerPrimaryText;
            if (sb.headerSecondaryText !== undefined) updates.selected_box_header_secondary_text_color = sb.headerSecondaryText;
            if (sb.primaryText !== undefined) updates.selected_box_primary_text_color = sb.primaryText;
            if (sb.secondaryText !== undefined) updates.selected_box_secondary_text_color = sb.secondaryText;
          }

          if (colors.unselectedBox) {
            const ub = colors.unselectedBox;
            if (ub.background !== undefined) updates.unselected_box_bg_color = ub.background;
            if (ub.headerBackground !== undefined) updates.unselected_box_header_bg_color = ub.headerBackground;
            if (ub.headerPrimaryText !== undefined) updates.unselected_box_header_primary_text_color = ub.headerPrimaryText;
            if (ub.headerSecondaryText !== undefined) updates.unselected_box_header_secondary_text_color = ub.headerSecondaryText;
            if (ub.primaryText !== undefined) updates.unselected_box_primary_text_color = ub.primaryText;
            if (ub.secondaryText !== undefined) updates.unselected_box_secondary_text_color = ub.secondaryText;
          }

          if (colors.selectedButton) {
            const sb = colors.selectedButton;
            if (sb.background !== undefined) updates.selected_button_bg_color = sb.background;
            if (sb.text !== undefined) updates.selected_button_text_color = sb.text;
            if (sb.icon !== undefined) updates.selected_button_icon_color = sb.icon;
          }

          if (colors.unselectedButton) {
            const ub = colors.unselectedButton;
            if (ub.background !== undefined) updates.unselected_button_bg_color = ub.background;
            if (ub.text !== undefined) updates.unselected_button_text_color = ub.text;
            if (ub.icon !== undefined) updates.unselected_button_icon_color = ub.icon;
          }
        }

        if (design?.backgroundImage !== undefined) {
          updates.design = { backgroundImage: design.backgroundImage };
          if (design.backgroundImage) {
            updates.background_image_url = design.backgroundImage.url || null;
            updates.background_image_expand = design.backgroundImage.expand ?? true;
            updates.background_image_fixed = design.backgroundImage.fixed ?? true;
            updates.background_image_repeat = design.backgroundImage.repeat ?? false;
          } else {
            updates.background_image_url = null;
            updates.background_image_expand = null;
            updates.background_image_fixed = null;
            updates.background_image_repeat = null;
          }
        } else if (design !== undefined) {
          updates.design = design;
        }

        if (topComponents !== undefined) updates.top_components = topComponents;
        if (bottomComponents !== undefined) updates.bottom_components = bottomComponents;
        updates.components = [];

        const { error: updateError } = await supabase.from("checkouts").update(updates).eq("id", checkoutId);
        if (updateError) throw new Error(`Falha ao salvar design: ${updateError.message}`);

        await recordRateLimitAttempt(supabase, producerId, "checkout_update_design");
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
