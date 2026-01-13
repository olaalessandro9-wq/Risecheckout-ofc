/**
 * Integration OAuth Handlers
 * 
 * Extracted OAuth-specific handlers for integration-management.
 * RISE Protocol Compliant - < 300 lines
 * 
 * @created 2026-01-13 - Extracted from integration-handlers.ts
 */

// deno-lint-ignore-file no-explicit-any
type SupabaseClientAny = any;

import { 
  jsonResponse, 
  errorResponse,
  checkRateLimit,
  recordRateLimitAttempt,
  generateSecureNonce,
} from "./integration-handlers.ts";

// ============================================================================
// HANDLER: INIT OAUTH
// ============================================================================

export async function handleInitOAuth(
  supabase: SupabaseClientAny,
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

  await recordRateLimitAttempt(supabase, producerId, "oauth_init");

  console.log(`[integration-management] OAuth state created for ${integrationType} by ${producerId}`);
  return jsonResponse({ success: true, state: nonce }, corsHeaders);
}
