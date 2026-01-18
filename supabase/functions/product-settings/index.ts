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
 * 
 * @version 3.0.0 - RISE Protocol V3 (unified-auth)
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";
import { requireAuthenticatedProducer } from "../_shared/unified-auth.ts";
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
} from "../_shared/supabase-types.ts";

// ============================================
// TYPES
// ============================================

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}

interface OwnershipResult {
  valid: boolean;
  error?: string;
}

interface JsonResponseData {
  success: boolean;
  error?: string;
  retryAfter?: number;
  [key: string]: unknown;
}

interface ProductUpdateData {
  name?: string;
  description?: string;
  price?: number;
  support_name?: string;
  support_email?: string;
  delivery_url?: string | null;
  external_delivery?: boolean;
  image_url?: string;
  status?: string;
}

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

interface RateLimitAttempt {
  id: string;
}

interface ProductRecord {
  id: string;
  user_id: string;
}

// ============================================
// HELPERS
// ============================================

async function checkRateLimit(
  supabase: SupabaseClient, 
  producerId: string, 
  action: string
): Promise<RateLimitResult> {
  const MAX_ATTEMPTS = 20;
  const WINDOW_MS = 5 * 60 * 1000;
  const windowStart = new Date(Date.now() - WINDOW_MS);

  const { data: attempts } = await supabase
    .from("rate_limit_attempts")
    .select("id")
    .eq("identifier", `producer:${producerId}`)
    .eq("action", action)
    .gte("created_at", windowStart.toISOString());

  const attemptList = (attempts || []) as RateLimitAttempt[];
  if (attemptList.length >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfter: 300 };
  }
  return { allowed: true };
}

async function recordAttempt(
  supabase: SupabaseClient, 
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

function jsonResponse(
  data: JsonResponseData, 
  headers: Record<string, string>, 
  status = 200
): Response {
  return new Response(JSON.stringify(data), { 
    status, 
    headers: { ...headers, "Content-Type": "application/json" } 
  });
}

function errorResponse(
  message: string, 
  headers: Record<string, string>, 
  status = 400
): Response {
  return jsonResponse({ success: false, error: message }, headers, status);
}

async function verifyOwnership(
  supabase: SupabaseClient, 
  productId: string, 
  producerId: string
): Promise<OwnershipResult> {
  const { data: product, error } = await supabase
    .from("products")
    .select("id, user_id")
    .eq("id", productId)
    .single();
    
  if (error || !product) return { valid: false, error: "Produto não encontrado" };
  
  const productData = product as ProductRecord;
  if (productData.user_id !== producerId) {
    return { valid: false, error: "Você não tem permissão para editar este produto" };
  }
  return { valid: true };
}

// ============================================
// MAIN HANDLER
// ============================================

serve(withSentry("product-settings", async (req) => {
  const corsResult = handleCors(req);
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

    // Ownership check (all actions require it)
    const ownership = await verifyOwnership(supabase, productId, producerId);
    if (!ownership.valid) {
      return errorResponse(
        ownership.error!, 
        corsHeaders, 
        ownership.error === "Produto não encontrado" ? 404 : 403
      );
    }

    // Route to handlers
    if (action === "update-settings") {
      const rateCheck = await checkRateLimit(supabase, producerId, "product_settings");
      if (!rateCheck.allowed) {
        return jsonResponse(
          { success: false, error: "Muitas requisições", retryAfter: rateCheck.retryAfter }, 
          corsHeaders, 
          429
        );
      }
      
      if (!body.settings || typeof body.settings !== "object") {
        return errorResponse("settings é obrigatório para esta ação", corsHeaders, 400);
      }
      
      const response = await handleUpdateSettings(supabase, productId, body.settings, corsHeaders);
      await recordAttempt(supabase, producerId, "product_settings");
      return response;
    }

    if (action === "update-general") {
      const rateCheck = await checkRateLimit(supabase, producerId, "product_general");
      if (!rateCheck.allowed) {
        return jsonResponse(
          { success: false, error: "Muitas requisições", retryAfter: rateCheck.retryAfter }, 
          corsHeaders, 
          429
        );
      }
      
      if (!body.data || typeof body.data !== "object") {
        return errorResponse("data é obrigatório para esta ação", corsHeaders, 400);
      }
      
      const response = await handleUpdateGeneral(supabase, productId, body.data, corsHeaders);
      await recordAttempt(supabase, producerId, "product_general");
      return response;
    }

    if (action === "smart-delete") {
      return await handleSmartDelete(supabase, productId, corsHeaders);
    }

    if (action === "update-price") {
      const rateCheck = await checkRateLimit(supabase, producerId, "product_price");
      if (!rateCheck.allowed) {
        return jsonResponse(
          { success: false, error: "Muitas requisições", retryAfter: rateCheck.retryAfter }, 
          corsHeaders, 
          429
        );
      }
      const { price } = body;
      if (typeof price !== "number" || !Number.isInteger(price) || price <= 0) {
        return errorResponse("Preço deve ser um valor inteiro positivo em centavos", corsHeaders, 400);
      }
      const response = await handleUpdatePrice(supabase, productId, price, corsHeaders);
      await recordAttempt(supabase, producerId, "product_price");
      return response;
    }

    if (action === "update-affiliate-gateway-settings") {
      const rateCheck = await checkRateLimit(supabase, producerId, "affiliate_gateway_settings");
      if (!rateCheck.allowed) {
        return jsonResponse(
          { success: false, error: "Muitas requisições", retryAfter: rateCheck.retryAfter }, 
          corsHeaders, 
          429
        );
      }
      
      if (!body.gatewaySettings || typeof body.gatewaySettings !== "object") {
        return errorResponse("gatewaySettings é obrigatório para esta ação", corsHeaders, 400);
      }
      
      const response = await handleUpdateAffiliateGatewaySettings(supabase, productId, body.gatewaySettings, corsHeaders);
      await recordAttempt(supabase, producerId, "affiliate_gateway_settings");
      return response;
    }

    if (action === "update-members-area-settings") {
      const rateCheck = await checkRateLimit(supabase, producerId, "members_area_settings");
      if (!rateCheck.allowed) {
        return jsonResponse(
          { success: false, error: "Muitas requisições", retryAfter: rateCheck.retryAfter }, 
          corsHeaders, 
          429
        );
      }

      // OPTIMIZED: Se habilitando, usa handler consolidado que faz tudo em paralelo
      if (body.enabled === true) {
        const producerEmail = body.producerEmail || producer.email;
        if (!producerEmail) {
          return errorResponse("Email do produtor é obrigatório para habilitar área de membros", corsHeaders, 400);
        }
        const response = await handleEnableMembersArea(supabase, productId, producerEmail, producerId, corsHeaders);
        await recordAttempt(supabase, producerId, "members_area_settings");
        return response;
      }

      // Se desabilitando, usa handler simples
      if (body.enabled === false) {
        const response = await handleDisableMembersArea(supabase, productId, corsHeaders);
        await recordAttempt(supabase, producerId, "members_area_settings");
        return response;
      }

      // Se só atualizando settings (sem mudar enabled), usa handler legado
      const response = await handleUpdateMembersAreaSettings(supabase, productId, body.enabled, body.membersSettings, corsHeaders);
      await recordAttempt(supabase, producerId, "members_area_settings");
      return response;
    }

    // ✅ RISE V3: Dedicated handler for upsell_settings JSONB column
    if (action === "update-upsell-settings") {
      const rateCheck = await checkRateLimit(supabase, producerId, "upsell_settings");
      if (!rateCheck.allowed) {
        return jsonResponse(
          { success: false, error: "Muitas requisições", retryAfter: rateCheck.retryAfter }, 
          corsHeaders, 
          429
        );
      }
      
      if (!body.upsellSettings || typeof body.upsellSettings !== "object") {
        return errorResponse("upsellSettings é obrigatório para esta ação", corsHeaders, 400);
      }
      
      const response = await handleUpdateUpsellSettings(supabase, productId, body.upsellSettings, corsHeaders);
      await recordAttempt(supabase, producerId, "upsell_settings");
      return response;
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
