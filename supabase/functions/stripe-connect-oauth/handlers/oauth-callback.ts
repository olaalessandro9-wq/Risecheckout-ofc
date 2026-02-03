/**
 * OAuth Callback Handler
 * 
 * Responsabilidade: Processar callback do Stripe OAuth
 * 
 * @module stripe-connect-oauth/handlers/oauth-callback
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0";
import { saveCredentialsToVault } from "../../_shared/vault-credentials.ts";
import { createLogger } from "../../_shared/logger.ts";
import { buildSiteUrl } from "../../_shared/site-urls.ts";

const log = createLogger("stripe-oauth-callback");

interface StateRecord {
  vendor_id: string;
  expires_at: string;
  used_at: string | null;
}

export interface OAuthCallbackResult {
  success: boolean;
  vendorId?: string;
  stripeAccountId?: string;
  redirectUrl?: string;
  error?: string;
}

/**
 * Processa o callback OAuth do Stripe
 */
export async function processOAuthCallback(
  supabase: SupabaseClient,
  stripe: Stripe,
  code: string,
  state: string
): Promise<OAuthCallbackResult> {
  log.info('Processando callback...');

  try {
    // Validar state (CSRF protection)
    const { data: stateData, error: stateError } = await supabase
      .from("oauth_states")
      .select("vendor_id, expires_at, used_at")
      .eq("state", state)
      .maybeSingle();

    if (stateError || !stateData) {
      return { success: false, error: "Invalid OAuth state" };
    }

    const stateRecord = stateData as StateRecord;

    if (stateRecord.used_at) {
      return { success: false, error: "OAuth state already used" };
    }

    if (new Date(stateRecord.expires_at) < new Date()) {
      return { success: false, error: "OAuth state expired" };
    }

    const vendorId = stateRecord.vendor_id;
    log.info('State validado, vendor:', vendorId);

    // Marcar state como usado
    await supabase
      .from("oauth_states")
      .update({ used_at: new Date().toISOString() })
      .eq("state", state);

    // Trocar código por tokens de acesso
    const tokenResponse = await stripe.oauth.token({
      grant_type: "authorization_code",
      code,
    });

    log.info('Token exchange bem-sucedido:', {
      accountId: tokenResponse.stripe_user_id,
      livemode: tokenResponse.livemode
    });

    const stripeAccountId = tokenResponse.stripe_user_id;
    const accessToken = tokenResponse.access_token;
    const refreshToken = tokenResponse.refresh_token;
    const livemode = tokenResponse.livemode;

    // Buscar informações da conta conectada
    const account = await stripe.accounts.retrieve(stripeAccountId!);
    log.info('Info da conta:', { email: account.email });

    // Salvar tokens no Vault
    const vaultResult = await saveCredentialsToVault(supabase, vendorId, 'STRIPE', {
      access_token: accessToken!,
      refresh_token: refreshToken || undefined
    });
    
    if (!vaultResult.success) {
      log.error('Erro ao salvar no Vault:', vaultResult.error);
      return { success: false, error: "Failed to save credentials securely" };
    }
    log.info('Credenciais salvas no Vault');

    // Salvar integração em vendor_integrations (APENAS metadados públicos)
    const integrationConfig = {
      stripe_account_id: stripeAccountId,
      livemode,
      is_test: !livemode,
      email: account.email,
      business_type: account.business_type,
      connected_at: new Date().toISOString(),
      credentials_in_vault: true
    };

    const { error: upsertError } = await supabase
      .from("vendor_integrations")
      .upsert({
        vendor_id: vendorId,
        integration_type: "STRIPE",
        active: true,
        config: integrationConfig,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "vendor_id,integration_type",
      });

    if (upsertError) {
      log.error('Erro ao salvar integração:', upsertError);
      return { success: false, error: "Failed to save Stripe integration" };
    }

    log.info('✅ Integração salva com sucesso');

    // Construir URL de redirect usando site-urls.ts (SSOT) - replaces FRONTEND_URL secret
    const redirectUrl = buildSiteUrl(
      `/dashboard/financeiro?stripe_success=true&account=${stripeAccountId}`,
      'default'
    );

    return {
      success: true,
      vendorId,
      stripeAccountId: stripeAccountId!,
      redirectUrl
    };

  } catch (error) {
    log.error('Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao processar callback'
    };
  }
}
