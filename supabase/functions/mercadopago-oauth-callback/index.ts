/**
 * Edge Function: mercadopago-oauth-callback
 * 
 * @version 3.3.0 - RISE Protocol V2 Compliant - Zero `any`
 * 
 * Responsabilidade: Processar callback OAuth do Mercado Pago e salvar credenciais
 * 
 * Fluxo:
 * 1. Recebe code e state (nonce) do Mercado Pago
 * 2. ✅ P0-2 FIX: Valida state na tabela oauth_states (previne CSRF/hijack)
 * 3. Troca code por access_token
 * 4. Busca user_id (collector_id) na API do MP
 * 5. Salva collector_id, email e data em profiles
 * 6. Salva access_token em vendor_integrations (campo config JSONB)
 * 7. Marca state como usado
 * 8. Retorna HTML que fecha popup e notifica sucesso
 * 
 * Segurança:
 * - ✅ P0-2 FIX: Valida state via tabela oauth_states (nonce randômico)
 * - Valida que collector_id é numérico
 * - State expira em 10 minutos
 * - State só pode ser usado uma vez
 * - Logs detalhados para auditoria
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ✅ P0-3: Usar variáveis de ambiente consistentes
const MERCADOPAGO_CLIENT_ID = Deno.env.get('MERCADOPAGO_CLIENT_ID') || '2354396684039370';
const MERCADOPAGO_CLIENT_SECRET = Deno.env.get('MERCADOPAGO_CLIENT_SECRET') || '';
const MERCADOPAGO_REDIRECT_URI = Deno.env.get('MERCADOPAGO_REDIRECT_URI') || '';

if (!MERCADOPAGO_REDIRECT_URI) {
  console.error('[OAuth Callback] MERCADOPAGO_REDIRECT_URI não configurado!');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OAuthStateRecord {
  state: string;
  vendor_id: string;
  used_at: string | null;
  expires_at: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  public_key: string;
  user_id: number;
}

interface UserInfoResponse {
  email: string;
}

interface IntegrationRecord {
  id: string;
}

/**
 * HTML de sucesso que fecha o popup e notifica a janela pai
 */
const successHTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conexão Bem-Sucedida</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      backdrop-filter: blur(10px);
    }
    .checkmark {
      font-size: 64px;
      margin-bottom: 1rem;
    }
    h1 { margin: 0 0 0.5rem 0; font-size: 24px; }
    p { margin: 0; opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="checkmark">✅</div>
    <h1>Conta Conectada!</h1>
    <p>Esta janela será fechada automaticamente...</p>
  </div>
  <script>
    // Notificar janela pai sobre sucesso
    if (window.opener) {
      window.opener.postMessage({ type: 'mercadopago_oauth_success' }, '*');
    }
    
    // Fechar janela após 2 segundos
    setTimeout(() => {
      window.close();
    }, 2000);
  </script>
</body>
</html>`;

/**
 * HTML de erro
 */
const errorHTML = (message: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Erro na Conexão</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      backdrop-filter: blur(10px);
      max-width: 400px;
    }
    .icon { font-size: 64px; margin-bottom: 1rem; }
    h1 { margin: 0 0 0.5rem 0; font-size: 24px; }
    p { margin: 0; opacity: 0.9; font-size: 14px; }
    button {
      margin-top: 1rem;
      padding: 0.5rem 1.5rem;
      background: white;
      color: #f5576c;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">❌</div>
    <h1>Erro na Conexão</h1>
    <p>${message}</p>
    <button onclick="window.close()">Fechar</button>
  </div>
</body>
</html>`;

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
    const state = url.searchParams.get('state'); // nonce (não mais vendor_id)
    const error = url.searchParams.get('error');

    console.log('[OAuth Callback] Parâmetros:', { code: !!code, state: !!state, error });

    // 3. Verificar se houve erro no OAuth
    if (error) {
      console.error('[OAuth Callback] Erro do Mercado Pago:', error);
      return new Response(errorHTML('Autorização negada pelo Mercado Pago.'), {
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          ...corsHeaders
        },
        status: 400
      });
    }

    // 4. Validar parâmetros obrigatórios
    if (!code || !state) {
      console.error('[OAuth Callback] Parâmetros faltando:', { code: !!code, state: !!state });
      return new Response(errorHTML('Parâmetros inválidos na URL.'), {
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          ...corsHeaders
        },
        status: 400
      });
    }

    // ✅ P0-2 FIX: VALIDAR STATE NA TABELA oauth_states
    console.log('[OAuth Callback] Validando state na tabela oauth_states...');
    
    const { data: oauthState, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .is('used_at', null) // Não pode ter sido usado
      .gt('expires_at', new Date().toISOString()) // Não pode ter expirado
      .single();

    if (stateError || !oauthState) {
      console.error('[OAuth Callback] State inválido, expirado ou já usado:', state);
      return new Response(errorHTML('Sessão expirada ou inválida. Por favor, tente novamente.'), {
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          ...corsHeaders
        },
        status: 400
      });
    }

    const stateRecord = oauthState as OAuthStateRecord;
    const vendorId = stateRecord.vendor_id;
    console.log('[OAuth Callback] State validado! Vendor ID:', vendorId);

    // ✅ P0-2 FIX: Marcar state como usado IMEDIATAMENTE (previne replay attack)
    const { error: updateStateError } = await supabase
      .from('oauth_states')
      .update({ used_at: new Date().toISOString() })
      .eq('state', state);

    if (updateStateError) {
      console.warn('[OAuth Callback] Erro ao marcar state como usado:', updateStateError);
      // Continuar mesmo assim, pois a validação já passou
    }

    // 5. Trocar code por access_token
    console.log('[OAuth Callback] Trocando code por access_token...');
    console.log('[OAuth Callback] Client ID:', MERCADOPAGO_CLIENT_ID);
    console.log('[OAuth Callback] Redirect URI:', MERCADOPAGO_REDIRECT_URI);
    console.log('[OAuth Callback] Client Secret presente:', !!MERCADOPAGO_CLIENT_SECRET);
    
    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: MERCADOPAGO_CLIENT_ID,
        client_secret: MERCADOPAGO_CLIENT_SECRET,
        code: code,
        redirect_uri: MERCADOPAGO_REDIRECT_URI
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('[OAuth Callback] Erro ao trocar code:', tokenResponse.status, errorData);
      return new Response(errorHTML('Erro ao obter token do Mercado Pago.'), {
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          ...corsHeaders
        },
        status: 500
      });
    }

    const tokenData = await tokenResponse.json() as TokenResponse;
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const publicKey = tokenData.public_key;
    const userId = tokenData.user_id; // collector_id (ID numérico)

    console.log('[OAuth Callback] Token obtido. User ID:', userId);

    // 6. Validar que user_id é numérico (segurança)
    if (!userId || typeof userId !== 'number') {
      console.error('[OAuth Callback] user_id inválido:', userId);
      return new Response(errorHTML('Dados inválidos retornados pelo Mercado Pago.'), {
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          ...corsHeaders
        },
        status: 500
      });
    }

    const collectorId = String(userId); // Converter para string para salvar no banco

    // 7. Buscar informações do usuário MP (para pegar o email)
    console.log('[OAuth Callback] Buscando informações do usuário MP...');
    
    const userInfoResponse = await fetch(`https://api.mercadopago.com/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    let mercadopagoEmail: string | null = null;
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json() as UserInfoResponse;
      mercadopagoEmail = userInfo.email;
      console.log('[OAuth Callback] Email MP:', maskEmail(mercadopagoEmail || ''));
    } else {
      console.warn('[OAuth Callback] Não foi possível buscar email do MP');
    }

    // 8. Atualizar tabela profiles com dados OAuth
    console.log('[OAuth Callback] Salvando dados OAuth em profiles...');
    
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        mercadopago_collector_id: collectorId,
        mercadopago_email: mercadopagoEmail,
        mercadopago_connected_at: new Date().toISOString()
      })
      .eq('id', vendorId);

    if (profileError) {
      console.error('[OAuth Callback] Erro ao atualizar profiles:', profileError);
      // Continuar mesmo com erro, pois o principal é salvar a integração
    } else {
      console.log('[OAuth Callback] ✅ Profiles atualizado com sucesso');
    }

    // 9. Salvar credenciais no VAULT (SEC-01 FIX)
    console.log('[OAuth Callback] Salvando credenciais no Supabase Vault...');
    
    // Importar dinamicamente o helper de vault
    const { saveCredentialsToVault } = await import('../_shared/vault-credentials.ts');
    
    // Salvar tokens sensíveis no Vault
    const vaultResult = await saveCredentialsToVault(supabase, vendorId, 'MERCADOPAGO', {
      access_token: accessToken,
      refresh_token: refreshToken
    });
    
    if (!vaultResult.success) {
      console.error('[OAuth Callback] Erro ao salvar no Vault:', vaultResult.error);
      return new Response(errorHTML('Erro ao salvar credenciais de forma segura.'), {
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          ...corsHeaders
        },
        status: 500
      });
    }
    console.log('[OAuth Callback] ✅ Credenciais salvas no Vault');
    
    // 10. Salvar/atualizar vendor_integrations (APENAS metadados públicos)
    console.log('[OAuth Callback] Salvando metadados em vendor_integrations...');
    
    const integrationConfig = {
      // ✅ SEC-01 FIX: NÃO salvar tokens aqui, apenas metadados públicos
      public_key: publicKey || null,
      user_id: collectorId,
      email: mercadopagoEmail,
      is_test: false,
      environment: 'production' as const,
      connected_at: new Date().toISOString(),
      credentials_in_vault: true // Flag indicando que tokens estão no Vault
    };

    const { data: existingIntegration } = await supabase
      .from('vendor_integrations')
      .select('id')
      .eq('vendor_id', vendorId)
      .eq('integration_type', 'MERCADOPAGO')
      .maybeSingle();

    if (existingIntegration) {
      const integration = existingIntegration as IntegrationRecord;
      // Atualizar existente
      const { error: updateError } = await supabase
        .from('vendor_integrations')
        .update({
          config: integrationConfig,
          active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', integration.id);

      if (updateError) {
        console.error('[OAuth Callback] Erro ao atualizar integração:', updateError);
        return new Response(errorHTML('Erro ao salvar integração.'), {
          headers: { 
            'Content-Type': 'text/html; charset=utf-8',
            ...corsHeaders
          },
          status: 500
        });
      }
      console.log('[OAuth Callback] ✅ Integração atualizada');
    } else {
      // Criar nova
      const { error: insertError } = await supabase
        .from('vendor_integrations')
        .insert({
          vendor_id: vendorId,
          integration_type: 'MERCADOPAGO',
          config: integrationConfig,
          active: true
        });

      if (insertError) {
        console.error('[OAuth Callback] Erro ao criar integração:', insertError);
        return new Response(errorHTML('Erro ao salvar integração.'), {
          headers: { 
            'Content-Type': 'text/html; charset=utf-8',
            ...corsHeaders
          },
          status: 500
        });
      }
      console.log('[OAuth Callback] ✅ Integração criada');
    }

    // 10. Redirecionar para página de sucesso
    console.log('[OAuth Callback] 🎉 OAuth concluído com sucesso! Redirecionando...');
    
    return new Response(null, {
      headers: { 
        'Location': 'https://risecheckout.com/oauth-success.html',
        ...corsHeaders
      },
      status: 302
    });

  } catch (error: unknown) {
    console.error('[OAuth Callback] 🔥 Erro fatal:', error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(errorHTML(`Erro interno: ${message}`), {
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        ...corsHeaders
      },
      status: 500
    });
  }
});

// ==========================================
// 🔒 HELPER: Mascarar PII (email) em logs
// ==========================================
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***';
  const [user, domain] = email.split('@');
  const maskedUser = user.length > 2 ? user.substring(0, 2) + '***' : '***';
  return `${maskedUser}@${domain}`;
}
