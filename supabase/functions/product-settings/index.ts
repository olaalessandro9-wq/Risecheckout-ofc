/**
 * product-settings Edge Function
 * 
 * Handles specialized product operations:
 * - update-settings: Payment, upsell, affiliate settings
 * - update-general: Full product update from GeneralTab
 * - smart-delete: Soft/hard delete based on orders
 * - update-price: Atomic price update (product + default offer)
 * - update-affiliate-gateway-settings: Affiliate gateway config
 * - update-members-area-settings: Members area config
 * - update-upsell-settings: Upsell JSONB settings
 * 
 * @version 3.1.0 - RISE Protocol V3 (refactored < 300 lines)
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";
import { requireAuthenticatedProducer } from "../_shared/unified-auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response-helpers.ts";
import { verifyProductOwnership } from "../_shared/ownership.ts";
import { checkRateLimit, PRODUCT_SETTINGS } from "../_shared/rate-limiting/index.ts";
import {
  handleUpdateSettings,
  handleUpdateGeneral,
  handleSmartDelete,
  handleUpdatePrice,
  handleUpdateAffiliateGatewaySettings,
  handleUpdateMembersAreaSettings,
  handleUpdateUpsellSettings,
} from "../_shared/product-settings-handlers.ts";
import {
  handleEnableMembersArea,
  handleDisableMembersArea,
} from "../_shared/product-members-area-handlers.ts";
import type { 
  ProductSettings, 
  AffiliateGatewaySettings,
  MembersAreaSettings,
  UpsellSettingsInput,
  ProductUpdateData,
} from "../_shared/supabase-types.ts";

// ============================================
// TYPES
// ============================================

interface RequestBody {
  action?: string;
  productId?: string;
  settings?: ProductSettings;
  data?: ProductUpdateData;
  price?: number;
  gatewaySettings?: AffiliateGatewaySettings;
  enabled?: boolean;
  membersSettings?: MembersAreaSettings;
  upsellSettings?: UpsellSettingsInput;
  producerEmail?: string;
}

// ============================================
// ACTION HANDLERS
// ============================================

async function handleRateLimitedAction(
  supabase: SupabaseClient,
  producerId: string,
  corsHeaders: Record<string, string>,
  handler: () => Promise<Response>
): Promise<Response> {
  const rateCheck = await checkRateLimit(supabase, `producer:${producerId}`, PRODUCT_SETTINGS);
  if (!rateCheck.allowed) {
    return jsonResponse(
      { success: false, error: "Muitas requisições", retryAfter: rateCheck.retryAfter },
      corsHeaders,
      429
    );
  }
  return await handler();
}

// ============================================
// MAIN HANDLER
// ============================================

serve(withSentry("product-settings", async (req) => {
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabase: SupabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let body: RequestBody = {};
    if (req.method !== "GET") {
      try {
        body = await req.json() as RequestBody;
      } catch {
        return errorResponse("Corpo da requisição inválido", corsHeaders, 400);
      }
    }

    const { action, productId } = body;
    console.log(`[product-settings] Action: ${action}, ProductId: ${productId}`);

    // Auth via unified-auth
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return errorResponse("Não autorizado", corsHeaders, 401);
    }
    const producerId = producer.id;

    // Common validation
    if (!productId || typeof productId !== "string") {
      return errorResponse("ID do produto é obrigatório", corsHeaders, 400);
    }

    // Ownership check using shared utility
    const isOwner = await verifyProductOwnership(supabase, productId, producerId);
    if (!isOwner) {
      return errorResponse("Produto não encontrado ou sem permissão", corsHeaders, 403);
    }

    // Route to handlers
    if (action === "update-settings") {
      if (!body.settings || typeof body.settings !== "object") {
      return errorResponse("settings é obrigatório para esta ação", corsHeaders, 400);
      }
      return handleRateLimitedAction(supabase, producerId, corsHeaders, () =>
        handleUpdateSettings(supabase, productId, body.settings!, corsHeaders)
      );
    }

    if (action === "update-general") {
      if (!body.data || typeof body.data !== "object") {
      return errorResponse("data é obrigatório para esta ação", corsHeaders, 400);
      }
      return handleRateLimitedAction(supabase, producerId, corsHeaders, () =>
        handleUpdateGeneral(supabase, productId, body.data!, corsHeaders)
      );
    }

    if (action === "smart-delete") {
      return await handleSmartDelete(supabase, productId, corsHeaders);
    }

    if (action === "update-price") {
      const { price } = body;
      if (typeof price !== "number" || !Number.isInteger(price) || price <= 0) {
        return errorResponse("Preço deve ser um valor inteiro positivo em centavos", corsHeaders, 400);
      }
      return handleRateLimitedAction(supabase, producerId, corsHeaders, () =>
        handleUpdatePrice(supabase, productId, price, corsHeaders)
      );
    }

    if (action === "update-affiliate-gateway-settings") {
      if (!body.gatewaySettings || typeof body.gatewaySettings !== "object") {
        return errorResponse("gatewaySettings é obrigatório para esta ação", corsHeaders, 400);
      }
      return handleRateLimitedAction(supabase, producerId, corsHeaders, () =>
        handleUpdateAffiliateGatewaySettings(supabase, productId, body.gatewaySettings!, corsHeaders)
      );
    }

    if (action === "update-members-area-settings") {
      // Enable members area with consolidated handler
      if (body.enabled === true) {
        const producerEmail = body.producerEmail || producer.email;
        if (!producerEmail) {
          return errorResponse("Email do produtor é obrigatório para habilitar área de membros", corsHeaders, 400);
        }
        return handleRateLimitedAction(supabase, producerId, corsHeaders, () =>
          handleEnableMembersArea(supabase, productId, producerEmail, producerId, corsHeaders)
        );
      }

      // Disable members area
      if (body.enabled === false) {
        return handleRateLimitedAction(supabase, producerId, corsHeaders, () =>
          handleDisableMembersArea(supabase, productId, corsHeaders)
        );
      }

      // Update settings only (without changing enabled state)
      return handleRateLimitedAction(supabase, producerId, corsHeaders, () =>
        handleUpdateMembersAreaSettings(supabase, productId, body.enabled, body.membersSettings, corsHeaders)
      );
    }

    if (action === "update-upsell-settings") {
      if (!body.upsellSettings || typeof body.upsellSettings !== "object") {
        return errorResponse("upsellSettings é obrigatório para esta ação", corsHeaders, 400);
      }
      return handleRateLimitedAction(supabase, producerId, corsHeaders, () =>
        handleUpdateUpsellSettings(supabase, productId, body.upsellSettings!, corsHeaders)
      );
    }

    return errorResponse(`Ação desconhecida: ${action}`, corsHeaders, 404);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[product-settings] Unexpected error:", errorMessage);
    await captureException(
      error instanceof Error ? error : new Error(String(error)),
      { functionName: "product-settings" }
    );
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
