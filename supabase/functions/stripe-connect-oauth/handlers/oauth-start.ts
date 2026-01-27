/**
 * OAuth Start Handler
 * 
 * Responsabilidade: Iniciar fluxo OAuth do Stripe Connect
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * SSOT: Usa stripe-oauth-config.ts para gerar Authorization URL
 * 
 * @module stripe-connect-oauth/handlers/oauth-start
 * @version 2.0.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { 
  buildStripeAuthorizationUrl, 
  validateStripeOAuthSecrets,
  getStripeDebugInfo 
} from "../../_shared/stripe-oauth-config.ts";

const log = createLogger("stripe-oauth-start");

export interface OAuthStartResult {
  success: boolean;
  url?: string;
  state?: string;
  error?: string;
  errorCode?: string;
}

/**
 * Inicia o fluxo OAuth gerando URL de autorização do Stripe
 * 
 * SSOT: A URL é gerada pelo módulo stripe-oauth-config.ts
 * garantindo consistência com o token exchange.
 */
export async function startOAuthFlow(
  supabase: SupabaseClient,
  vendorId: string
): Promise<OAuthStartResult> {
  log.info('Iniciando OAuth para vendor:', vendorId);

  // Validar secrets antes de prosseguir
  const secretsValidation = validateStripeOAuthSecrets();
  if (!secretsValidation.valid) {
    log.error(`Secrets faltando: ${secretsValidation.missing.join(', ')}`);
    return {
      success: false,
      error: `Stripe não está configurado corretamente. Faltam: ${secretsValidation.missing.join(', ')}`,
      errorCode: "STRIPE_CONFIG_ERROR"
    };
  }

  // Log debug info (sem expor secrets)
  const debugInfo = getStripeDebugInfo();
  log.info('Stripe OAuth config:', debugInfo);

  try {
    // Gerar state único para CSRF protection
    const state = crypto.randomUUID();
    
    // Salvar state no banco para validação posterior
    await supabase.from("oauth_states").insert({
      state,
      vendor_id: vendorId,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min
    });

    // SSOT: Gerar URL usando módulo de configuração
    const stripeConnectUrl = buildStripeAuthorizationUrl({ state });
    
    if (!stripeConnectUrl) {
      log.error('Falha ao construir URL de autorização - STRIPE_CLIENT_ID inválido');
      return {
        success: false,
        error: "Configuração do Stripe incompleta. STRIPE_CLIENT_ID não configurado.",
        errorCode: "STRIPE_CONFIG_ERROR"
      };
    }

    log.info('URL gerada com sucesso');

    return {
      success: true,
      url: stripeConnectUrl,
      state
    };

  } catch (error) {
    log.error('Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao iniciar OAuth'
    };
  }
}
