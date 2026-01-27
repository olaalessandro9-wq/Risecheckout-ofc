/**
 * Integration OAuth Handlers
 * 
 * Extracted OAuth-specific handlers for integration-management.
 * SSOT: Usa mercadopago-oauth-config.ts para gerar Authorization URL
 * 
 * @created 2026-01-13 - Extracted from integration-handlers.ts
 * @version 3.0.0 - RISE Protocol V3 SSOT Architecture
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

import { 
  jsonResponse, 
  errorResponse,
  checkRateLimit,
  generateSecureNonce,
} from "./integration-handlers.ts";
import { createLogger } from "./logger.ts";
import { buildAuthorizationUrl, validateOAuthSecrets } from "./mercadopago-oauth-config.ts";

const log = createLogger("IntegrationOAuth");

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

  // Validar secrets antes de prosseguir
  if (integrationType === 'MERCADOPAGO') {
    const secretsValidation = validateOAuthSecrets();
    if (!secretsValidation.valid) {
      log.error(`Secrets faltando: ${secretsValidation.missing.join(', ')}`);
      return errorResponse(
        "Configuração do Mercado Pago incompleta. Contate o suporte.",
        corsHeaders,
        500
      );
    }
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
    log.error("OAuth state insert error", error);
    return errorResponse("Erro ao iniciar autenticação", corsHeaders, 500);
  }

  // SSOT: Gerar Authorization URL no backend
  let authorizationUrl: string | null = null;
  
  if (integrationType === 'MERCADOPAGO') {
    authorizationUrl = buildAuthorizationUrl({ state: nonce });
    log.info(`Authorization URL gerada: ${authorizationUrl.substring(0, 80)}...`);
  }

  log.info(`OAuth state created for ${integrationType} by ${producerId}`);
  
  return jsonResponse({ 
    success: true, 
    state: nonce,
    authorizationUrl, // Frontend usa isso diretamente, sem montar URL
  }, corsHeaders);
}
