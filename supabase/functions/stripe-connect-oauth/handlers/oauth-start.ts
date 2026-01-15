/**
 * OAuth Start Handler
 * 
 * Responsabilidade: Iniciar fluxo OAuth do Stripe Connect
 * 
 * @module stripe-connect-oauth/handlers/oauth-start
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface OAuthStartResult {
  success: boolean;
  url?: string;
  state?: string;
  error?: string;
  errorCode?: string;
}

/**
 * Inicia o fluxo OAuth gerando URL de autorização do Stripe
 */
export async function startOAuthFlow(
  supabase: SupabaseClient,
  vendorId: string
): Promise<OAuthStartResult> {
  console.log('[OAuth Start] Iniciando OAuth para vendor:', vendorId);

  // Validar STRIPE_CLIENT_ID
  const stripeClientId = Deno.env.get("STRIPE_CLIENT_ID");
  if (!stripeClientId || stripeClientId.trim() === "" || stripeClientId.includes("PLACEHOLDER")) {
    console.error('[OAuth Start] STRIPE_CLIENT_ID não configurado ou inválido');
    return {
      success: false,
      error: "Stripe não está configurado corretamente. STRIPE_CLIENT_ID ausente ou inválido.",
      errorCode: "STRIPE_CONFIG_ERROR"
    };
  }

  // Validar STRIPE_REDIRECT_URL
  const redirectUri = Deno.env.get("STRIPE_REDIRECT_URL");
  if (!redirectUri || redirectUri.trim() === "" || redirectUri.includes("PLACEHOLDER")) {
    console.error('[OAuth Start] STRIPE_REDIRECT_URL não configurado');
    return {
      success: false,
      error: "Stripe não está configurado corretamente. STRIPE_REDIRECT_URL ausente.",
      errorCode: "STRIPE_CONFIG_ERROR"
    };
  }

  try {
    // Gerar state único para CSRF protection
    const state = crypto.randomUUID();
    
    // Salvar state no banco para validação posterior
    await supabase.from("oauth_states").insert({
      state,
      vendor_id: vendorId,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min
    });

    // Stripe Connect OAuth URL
    const stripeConnectUrl = new URL("https://connect.stripe.com/oauth/authorize");
    stripeConnectUrl.searchParams.set("response_type", "code");
    stripeConnectUrl.searchParams.set("client_id", stripeClientId);
    stripeConnectUrl.searchParams.set("scope", "read_write");
    stripeConnectUrl.searchParams.set("redirect_uri", redirectUri);
    stripeConnectUrl.searchParams.set("state", state);
    stripeConnectUrl.searchParams.set("stripe_user[country]", "BR");

    console.log('[OAuth Start] URL gerada com sucesso');

    return {
      success: true,
      url: stripeConnectUrl.toString(),
      state
    };

  } catch (error) {
    console.error('[OAuth Start] Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao iniciar OAuth'
    };
  }
}
