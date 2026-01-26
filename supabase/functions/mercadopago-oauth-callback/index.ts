/**
 * Edge Function: mercadopago-oauth-callback
 * 
 * @version 5.0.0 - RISE ARCHITECT PROTOCOL V3 - 10.0/10 - Redirect Flow
 * 
 * Responsabilidade: Processar callback OAuth do Mercado Pago e redirecionar
 * 
 * Fluxo:
 * 1. Recebe code e state (nonce) do Mercado Pago
 * 2. Valida state na tabela oauth_states (previne CSRF/hijack)
 * 3. Troca code por access_token
 * 4. Busca user_id (collector_id) na API do MP
 * 5. Salva collector_id, email e data em profiles
 * 6. Salva access_token em vendor_integrations via Vault
 * 7. Redireciona para página de sucesso/erro no domínio principal
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2, PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";

// Handlers
import { exchangeCodeForToken } from "./handlers/token-exchange.ts";
import { validateOAuthState } from "./handlers/state-validator.ts";
import { fetchMercadoPagoUserInfo } from "./handlers/user-info-fetcher.ts";
import { saveOAuthIntegration } from "./handlers/integration-saver.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;
const log = createLogger("mercadopago-oauth-callback");

// URLs permitidas para redirect (anti open-redirect)
const ALLOWED_REDIRECT_DOMAINS = [
  'risecheckout.com',
  'www.risecheckout.com',
  'lovable.app',
];

function getAppBaseUrl(): string {
  // Preferência: variável de ambiente, fallback para produção
  const envUrl = Deno.env.get('APP_BASE_URL');
  if (envUrl) return envUrl;
  return 'https://risecheckout.com';
}

function isAllowedRedirectDomain(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ALLOWED_REDIRECT_DOMAINS.some(domain => 
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

function redirectResponse(url: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': url,
      ...corsHeaders,
    },
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const baseUrl = getAppBaseUrl();
  
  // Validar que baseUrl é seguro
  if (!isAllowedRedirectDomain(baseUrl)) {
    log.error('Base URL inválida', { baseUrl });
    return new Response('Configuration error', { status: 500, headers: corsHeaders });
  }

  try {
    log.info('Iniciando processamento');

    // 1. Inicializar Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Extrair parâmetros da URL
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    log.info('Parâmetros', { hasCode: !!code, hasState: !!state, error });

    // 3. Verificar se houve erro no OAuth
    if (error) {
      log.error('Erro do Mercado Pago', { error });
      return redirectResponse(`${baseUrl}/oauth-error.html?reason=authorization_denied`);
    }

    // 4. Validar parâmetros obrigatórios
    if (!code || !state) {
      log.error('Parâmetros faltando', { hasCode: !!code, hasState: !!state });
      return redirectResponse(`${baseUrl}/oauth-error.html?reason=invalid_params`);
    }

    // 5. Validar state (CSRF protection)
    const stateValidation = await validateOAuthState(supabase, state);
    if (!stateValidation.valid || !stateValidation.vendorId) {
      log.error('State inválido');
      return redirectResponse(`${baseUrl}/oauth-error.html?reason=session_expired`);
    }
    const vendorId = stateValidation.vendorId;

    // 6. Trocar code por access_token
    const tokenResult = await exchangeCodeForToken(code);
    if (!tokenResult.success || !tokenResult.data) {
      log.error('Erro ao trocar token', { error: tokenResult.error });
      return redirectResponse(`${baseUrl}/oauth-error.html?reason=token_exchange_failed`);
    }

    const { access_token, refresh_token, public_key, user_id } = tokenResult.data;
    const collectorId = String(user_id);

    // 7. Buscar informações do usuário MP
    const userInfo = await fetchMercadoPagoUserInfo(user_id, access_token);

    // 8. Salvar integração (profiles, vault, vendor_integrations)
    const saveResult = await saveOAuthIntegration(supabase, {
      vendorId,
      accessToken: access_token,
      refreshToken: refresh_token,
      publicKey: public_key,
      collectorId,
      email: userInfo.email
    });

    if (!saveResult.success) {
      log.error('Erro ao salvar', { error: saveResult.error });
      return redirectResponse(`${baseUrl}/oauth-error.html?reason=save_failed`);
    }

    // 9. Sucesso! Redirecionar para página de sucesso
    log.info('OAuth concluído com sucesso! Redirecionando...');
    return redirectResponse(`${baseUrl}/oauth-success.html`);

  } catch (error: unknown) {
    log.error('Erro fatal', error);
    return redirectResponse(`${baseUrl}/oauth-error.html?reason=internal_error`);
  }
});
