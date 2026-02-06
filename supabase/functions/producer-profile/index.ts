/**
 * Producer Profile Edge Function
 * 
 * RISE Protocol V3 - 10.0/10 Compliant
 * Uses 'users' table as SSOT for all profile queries
 * 
 * Actions:
 * - get-profile: Retorna perfil do produtor
 * - check-credentials: Verifica credenciais de gateway configuradas
 * - get-gateway-connections: Retorna conexões de gateway do produtor
 * 
 * @version 2.0.0 - Migrated from profiles to users (SSOT)
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("producer-profile");

// ==========================================
// TYPES
// ==========================================

type Action = "get-profile" | "check-credentials" | "get-gateway-connections";

interface RequestBody {
  action: Action;
  productId?: string;
}

// ==========================================
// HELPERS
// ==========================================

function jsonResponse(data: unknown, corsHeaders: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, code: string, corsHeaders: Record<string, string>, status = 400): Response {
  return jsonResponse({ error: message, code }, corsHeaders, status);
}

// ==========================================
// HANDLERS
// ==========================================

async function getProfile(
  supabase: SupabaseClient,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // RISE V3: Use 'users' table as SSOT
  const { data, error } = await supabase
    .from("users")
    .select("name, cpf_cnpj, phone")
    .eq("id", producerId)
    .single();

  if (error) {
    log.error("Get profile error:", error);
    return errorResponse("Perfil não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  return jsonResponse({ profile: data }, corsHeaders);
}

async function checkCredentials(
  supabase: SupabaseClient,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const [mpResult, ppResult, stripeResult, asaasResult] = await Promise.all([
      supabase
        .from("vendor_integrations")
        .select("id")
        .eq("vendor_id", producerId)
        .eq("integration_type", "MERCADOPAGO")
        .eq("active", true)
        .maybeSingle(),
      supabase
        .from("payment_gateway_settings")
        .select("user_id")
        .eq("user_id", producerId)
        .maybeSingle(),
      supabase
        .from("vendor_integrations")
        .select("id")
        .eq("vendor_id", producerId)
        .eq("integration_type", "STRIPE")
        .eq("active", true)
        .maybeSingle(),
      supabase
        .from("vendor_integrations")
        .select("id")
        .eq("vendor_id", producerId)
        .eq("integration_type", "ASAAS")
        .eq("active", true)
        .maybeSingle(),
    ]);

    return jsonResponse({
      credentials: {
        mercadopago: { configured: !!mpResult.data },
        pushinpay: { configured: !!ppResult.data },
        stripe: { configured: !!stripeResult.data },
        asaas: { configured: !!asaasResult.data },
      },
    }, corsHeaders);
  } catch (error: unknown) {
    log.error("Check credentials error:", error);
    return errorResponse("Erro ao verificar credenciais", "DB_ERROR", corsHeaders, 500);
  }
}

async function getGatewayConnections(
  supabase: SupabaseClient,
  producerId: string,
  productId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Get product gateway settings
    const { data: productData, error: productError } = await supabase
      .from("products")
      .select("affiliate_gateway_settings, user_id")
      .eq("id", productId)
      .single();

    if (productError || !productData) {
      return errorResponse("Produto não encontrado", "NOT_FOUND", corsHeaders, 404);
    }

    // RISE V3: Use 'users' table as SSOT
    const { data: userData } = await supabase
      .from("users")
      .select("asaas_wallet_id, mercadopago_collector_id, stripe_account_id")
      .eq("id", producerId)
      .single();

    const { data: pushinpayData } = await supabase
      .from("payment_gateway_settings")
      .select("pushinpay_account_id, pushinpay_token")
      .eq("user_id", producerId)
      .single();

    return jsonResponse({
      productSettings: productData.affiliate_gateway_settings,
      connections: {
        asaas: !!userData?.asaas_wallet_id,
        mercadopago: !!userData?.mercadopago_collector_id,
        stripe: !!userData?.stripe_account_id,
        pushinpay: !!(pushinpayData?.pushinpay_token && pushinpayData?.pushinpay_account_id),
      },
      credentials: {
        asaas_wallet_id: userData?.asaas_wallet_id,
        mercadopago_collector_id: userData?.mercadopago_collector_id,
        stripe_account_id: userData?.stripe_account_id,
        pushinpay_account_id: pushinpayData?.pushinpay_account_id,
      },
    }, corsHeaders);
  } catch (error: unknown) {
    log.error("Get gateway connections error:", error);
    return errorResponse("Erro ao buscar conexões", "DB_ERROR", corsHeaders, 500);
  }
}

// ==========================================
// MAIN HANDLER
// ==========================================

serve(async (req) => {
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabase: SupabaseClient = getSupabaseClient('general');

    const body = await req.json() as RequestBody;
    const { action, productId } = body;

    log.info(`Action: ${action}`);

    // All actions require authentication
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    log.debug(`Producer: ${producer.id}`);

    switch (action) {
      case "get-profile":
        return getProfile(supabase, producer.id, corsHeaders);

      case "check-credentials":
        return checkCredentials(supabase, producer.id, corsHeaders);

      case "get-gateway-connections":
        if (!productId) {
          return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getGatewayConnections(supabase, producer.id, productId, corsHeaders);

      default:
        return errorResponse(`Ação desconhecida: ${action}`, "INVALID_ACTION", corsHeaders, 400);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    log.error("Error:", errorMessage);
    return errorResponse("Erro interno do servidor", "INTERNAL_ERROR", corsHeaders, 500);
  }
});
