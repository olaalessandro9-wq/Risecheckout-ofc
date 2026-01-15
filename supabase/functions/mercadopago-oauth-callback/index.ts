/**
 * Edge Function: mercadopago-oauth-callback
 * 
 * @version 4.0.0 - RISE Protocol V2 Compliant - Refatorado
 * 
 * Responsabilidade: Processar callback OAuth do Mercado Pago e salvar credenciais
 * 
 * Fluxo:
 * 1. Recebe code e state (nonce) do Mercado Pago
 * 2. Valida state na tabela oauth_states (previne CSRF/hijack)
 * 3. Troca code por access_token
 * 4. Busca user_id (collector_id) na API do MP
 * 5. Salva collector_id, email e data em profiles
 * 6. Salva access_token em vendor_integrations via Vault
 * 7. Retorna HTML que fecha popup e notifica sucesso
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Handlers
import { exchangeCodeForToken } from "./handlers/token-exchange.ts";
import { validateOAuthState } from "./handlers/state-validator.ts";
import { fetchMercadoPagoUserInfo } from "./handlers/user-info-fetcher.ts";
import { saveOAuthIntegration } from "./handlers/integration-saver.ts";

// Templates
import { successHTML, errorHTML } from "./templates/html-responses.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[OAuth Callback] Iniciando processamento...');

    // 1. Inicializar Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Extrair parâmetros da URL
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    console.log('[OAuth Callback] Parâmetros:', { code: !!code, state: !!state, error });

    // 3. Verificar se houve erro no OAuth
    if (error) {
      console.error('[OAuth Callback] Erro do Mercado Pago:', error);
      return new Response(errorHTML('Autorização negada pelo Mercado Pago.'), {
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
        status: 400
      });
    }

    // 4. Validar parâmetros obrigatórios
    if (!code || !state) {
      console.error('[OAuth Callback] Parâmetros faltando:', { code: !!code, state: !!state });
      return new Response(errorHTML('Parâmetros inválidos na URL.'), {
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
        status: 400
      });
    }

    // 5. Validar state (CSRF protection)
    const stateValidation = await validateOAuthState(supabase, state);
    if (!stateValidation.valid || !stateValidation.vendorId) {
      return new Response(errorHTML(stateValidation.error || 'Sessão inválida.'), {
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
        status: 400
      });
    }
    const vendorId = stateValidation.vendorId;

    // 6. Trocar code por access_token
    const tokenResult = await exchangeCodeForToken(code);
    if (!tokenResult.success || !tokenResult.data) {
      return new Response(errorHTML(tokenResult.error || 'Erro ao obter token.'), {
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
        status: 500
      });
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
      return new Response(errorHTML(saveResult.error || 'Erro ao salvar integração.'), {
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
        status: 500
      });
    }

    // 9. Retornar HTML de sucesso
    console.log('[OAuth Callback] 🎉 OAuth concluído com sucesso!');
    
    return new Response(successHTML, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
      status: 200
    });

  } catch (error: unknown) {
    console.error('[OAuth Callback] 🔥 Erro fatal:', error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(errorHTML(`Erro interno: ${message}`), {
      headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
      status: 500
    });
  }
});
