/**
 * Integration Management Handlers
 * 
 * Extracted handlers for integration-management edge function.
 * 
 * RISE Protocol V3 Compliant - Uses consolidated rate-limiting
 * @version 3.0.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  checkRateLimit as checkRateLimitCore, 
  RATE_LIMIT_CONFIGS,
  type RateLimitResult 
} from "./rate-limiting/index.ts";

// ============================================================================
// TYPES
// ============================================================================

export type IntegrationType = "MERCADOPAGO" | "STRIPE" | "ASAAS" | "PUSHINPAY";

export interface CredentialsPayload {
  integrationType: IntegrationType;
  config: Record<string, unknown>;
}

// ============================================================================
// RATE LIMITING (RISE V3 - wrapper for legacy signature)
// ============================================================================

/**
 * Rate limit check with legacy signature for backwards compatibility.
 * Delegates to consolidated rate-limiting module.
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  producerId: string,
  action: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const result: RateLimitResult = await checkRateLimitCore(
    supabase, 
    `producer:${producerId}:${action}`, 
    RATE_LIMIT_CONFIGS.PRODUCER_ACTION
  );
  
  // Convert ISO timestamp to seconds remaining
  let retryAfterSeconds: number | undefined;
  if (result.retryAfter) {
    const retryDate = new Date(result.retryAfter);
    retryAfterSeconds = Math.max(0, Math.ceil((retryDate.getTime() - Date.now()) / 1000));
  }
  
  return { 
    allowed: result.allowed, 
    retryAfter: retryAfterSeconds 
  };
}

// ============================================================================
// HELPERS
// ============================================================================

export function jsonResponse(data: unknown, corsHeaders: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errorResponse(message: string, corsHeaders: Record<string, string>, status = 400): Response {
  return jsonResponse({ success: false, error: message }, corsHeaders, status);
}


// ============================================================================
// NONCE GENERATION
// ============================================================================

export function generateSecureNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// HANDLER: SAVE CREDENTIALS
// ============================================================================

export async function handleSaveCredentials(
  supabase: SupabaseClient,
  producerId: string,
  body: { integrationType?: IntegrationType; config?: Record<string, unknown> },
  corsHeaders: Record<string, string>
): Promise<Response> {
  const rateCheck = await checkRateLimit(supabase, producerId, "integration_save");
  if (!rateCheck.allowed) {
    return jsonResponse(
      { success: false, error: "Muitas requisições.", retryAfter: rateCheck.retryAfter },
      corsHeaders,
      429
    );
  }

  const { integrationType, config } = body as CredentialsPayload;

  if (!integrationType) {
    return errorResponse("Tipo de integração é obrigatório", corsHeaders, 400);
  }

  if (!config || typeof config !== "object") {
    return errorResponse("Configuração é obrigatória", corsHeaders, 400);
  }

  const { data: existing } = await supabase
    .from("vendor_integrations")
    .select("id")
    .eq("vendor_id", producerId)
    .eq("integration_type", integrationType)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("vendor_integrations")
      .update({
        config,
        active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      console.error("[integration-management] Update error:", error);
      return errorResponse("Erro ao atualizar integração", corsHeaders, 500);
    }
  } else {
    const { error } = await supabase
      .from("vendor_integrations")
      .insert({
        vendor_id: producerId,
        integration_type: integrationType,
        config,
        active: true,
      });

    if (error) {
      console.error("[integration-management] Insert error:", error);
      return errorResponse("Erro ao criar integração", corsHeaders, 500);
    }
  }

  // Rate limit auto-records in consolidated module

  console.log(`[integration-management] Credentials saved for ${integrationType} by ${producerId}`);
  return jsonResponse({ success: true }, corsHeaders);
}

// ============================================================================
// HANDLER: DISCONNECT
// ============================================================================

export async function handleDisconnect(
  supabase: SupabaseClient,
  producerId: string,
  body: { integrationType?: string; integrationId?: string },
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { integrationType, integrationId } = body;

  if (!integrationType && !integrationId) {
    return errorResponse("Tipo de integração ou ID é obrigatório", corsHeaders, 400);
  }

  let query = supabase.from("vendor_integrations").delete();
  
  if (integrationId) {
    query = query.eq("id", integrationId).eq("vendor_id", producerId);
  } else {
    query = query.eq("vendor_id", producerId).eq("integration_type", integrationType);
  }

  const { error } = await query;

  if (error) {
    console.error("[integration-management] Disconnect error:", error);
    return errorResponse("Erro ao desconectar integração", corsHeaders, 500);
  }

  console.log(`[integration-management] Disconnected ${integrationType || integrationId} for ${producerId}`);
  return jsonResponse({ success: true }, corsHeaders);
}

// ============================================================================
// RE-EXPORT OAUTH HANDLERS
// ============================================================================

export { handleInitOAuth } from "./integration-oauth-handlers.ts";

// ============================================================================
// RE-EXPORT PROFILE & STATUS HANDLERS
// ============================================================================

export { 
  handleGetStatus,
  handleSaveProfileWallet, 
  handleClearProfileWallet,
  handleUpdateProfile,
} from "./integration-profile-handlers.ts";
