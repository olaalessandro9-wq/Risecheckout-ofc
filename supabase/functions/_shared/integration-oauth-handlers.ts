/**
 * Integration OAuth Handlers
 * 
 * Extracted OAuth-specific handlers for integration-management.
 * 
 * @created 2026-01-13 - Extracted from integration-handlers.ts
 * @version 2.0.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

import { 
  jsonResponse, 
  errorResponse,
  checkRateLimit,
  generateSecureNonce,
} from "./integration-handlers.ts";

// ============================================================================
// HANDLER: INIT OAUTH
// ============================================================================

export async function handleInitOAuth(
  supabase: SupabaseClient,
  producerId: string,
  body: { integrationType?: string },
  corsHeaders: Record<string, string>
): Promise<Response> {
  const rateCheck = await checkRateLimit(supabase, producerId, "oauth_init");
  if (!rateCheck.allowed) {
    return jsonResponse(
      { success: false, error: "Muitas requisições.", retryAfter: rateCheck.retryAfter },
      corsHeaders,
      429
    );
  }

  const { integrationType } = body;

  if (!integrationType) {
    return errorResponse("Tipo de integração é obrigatório", corsHeaders, 400);
  }

  const nonce = generateSecureNonce();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  const { error } = await supabase
    .from("oauth_states")
    .insert({
      state: nonce,
      vendor_id: producerId,
      expires_at: expiresAt.toISOString(),
    });

  if (error) {
    console.error("[integration-management] OAuth state insert error:", error);
    return errorResponse("Erro ao iniciar autenticação", corsHeaders, 500);
  }

  // Rate limit auto-records in consolidated module

  console.log(`[integration-management] OAuth state created for ${integrationType} by ${producerId}`);
  return jsonResponse({ success: true, state: nonce }, corsHeaders);
}
