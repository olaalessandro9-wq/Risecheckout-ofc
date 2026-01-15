/**
 * Edge Function: vault-save
 * 
 * Responsabilidade: Salvar credenciais de vendedor de forma segura no Supabase Vault
 * 
 * IMPORTANTE - CONVENÇÃO UNIFICADA:
 * Usa a convenção `gateway_{type}_{vendor_id}` via RPC `save_gateway_credentials`
 * para manter consistência com vault-credentials.ts usado por OAuth callbacks.
 * 
 * Fluxo:
 * 1. Recebe credenciais do frontend (após configuração manual)
 * 2. Salva dados públicos na tabela vendor_integrations
 * 3. Salva dados sensíveis (tokens, secrets) no Vault usando save_gateway_credentials RPC
 * 
 * Integrações suportadas:
 * - MERCADOPAGO: access_token, refresh_token
 * - STRIPE: access_token, refresh_token
 * - ASAAS: api_key
 * - PUSHINPAY: api_token
 * - UTMIFY: api_token
 * - FACEBOOK_PIXEL: access_token
 * - GOOGLE_ADS, TIKTOK, KWAI: conversion tokens
 * 
 * Segurança:
 * - Requer autenticação via producer_sessions
 * - Valida que o vendor_id corresponde ao usuário autenticado
 * - Usa save_gateway_credentials RPC para convenção unificada
 * - Criptografa automaticamente via Vault
 * - VULN-002: Rate limiting implementado
 * 
 * @version 3.0.0 - Unified Vault Convention
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  rateLimitMiddleware, 
  RATE_LIMIT_CONFIGS,
  getClientIP 
} from '../_shared/rate-limiter.ts';
import { handleCors } from '../_shared/cors.ts';
import { requireAuthenticatedProducer, unauthorizedResponse } from '../_shared/unified-auth.ts';

type IntegrationType = 
  | 'MERCADOPAGO' 
  | 'STRIPE' 
  | 'ASAAS' 
  | 'PUSHINPAY' 
  | 'UTMIFY' 
  | 'FACEBOOK_PIXEL' 
  | 'GOOGLE_ADS' 
  | 'TIKTOK' 
  | 'KWAI';

interface SaveCredentialsRequest {
  vendor_id: string;
  integration_type: IntegrationType;
  credentials: {
    // Dados sensíveis (vão para o Vault)
    access_token?: string;
    refresh_token?: string;
    api_token?: string;
    api_key?: string;
    webhook_secret?: string;
    
    // Dados públicos (vão para a tabela)
    public_key?: string;
    pixel_id?: string;
    conversion_id?: string;
    user_id?: string;
    email?: string;
    environment?: string;
    is_test?: boolean;
    connected_at?: string;
    wallet_id?: string;
    account_name?: string;
    validated_at?: string;
    [key: string]: unknown;
  };
  active?: boolean;
}

/**
 * Lista de chaves que são consideradas sensíveis e devem ir para o Vault
 */
const SENSITIVE_KEYS = [
  'access_token',
  'refresh_token',
  'api_token',
  'api_key',
  'webhook_secret',
  'secret_key',
  'private_key'
];

/**
 * Separa dados sensíveis de dados públicos
 * @returns publicConfig para tabela, vaultCredentials para Vault
 */
function separateCredentials(
  credentials: Record<string, unknown>
): { publicConfig: Record<string, unknown>; vaultCredentials: Record<string, string> } {
  const publicConfig: Record<string, unknown> = {};
  const vaultCredentials: Record<string, string> = {};

  for (const [key, value] of Object.entries(credentials)) {
    if (SENSITIVE_KEYS.includes(key) && typeof value === 'string' && value.trim()) {
      vaultCredentials[key] = value.trim();
    } else {
      publicConfig[key] = value;
    }
  }

  return { publicConfig, vaultCredentials };
}

Deno.serve(async (req) => {
  // SECURITY: Validar CORS no início
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) {
    return corsResult; // Retorna 403 ou preflight OK
  }
  const corsHeaders = corsResult.headers;

  try {
    // 1. Inicializar Supabase Client com service_role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // VULN-002: Rate limiting para vault-save
    const rateLimitResult = await rateLimitMiddleware(
      supabase, 
      req, 
      RATE_LIMIT_CONFIGS.VAULT_SAVE
    );
    if (rateLimitResult) {
      console.warn(`[vault-save] Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }

    // 2. Verificar autenticação via unified-auth (producer_sessions)
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    // 3. Parse request body
    const body: SaveCredentialsRequest = await req.json();
    const { vendor_id, integration_type, credentials, active = true } = body;

    // 4. Validações básicas
    if (!vendor_id || !integration_type || !credentials) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: vendor_id, integration_type, credentials' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Validar que o vendor_id corresponde ao usuário autenticado
    if (vendor_id !== producer.id) {
      console.warn(`[vault-save] Tentativa de acesso não autorizado: user ${producer.id} tentou salvar para vendor ${vendor_id}`);
      return new Response(
        JSON.stringify({ error: 'Não autorizado a salvar credenciais de outro vendedor' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedType = integration_type.toUpperCase();
    const gatewayLower = normalizedType.toLowerCase();
    console.log(`[vault-save] Salvando credenciais para vendor ${vendor_id}, tipo ${normalizedType}`);

    // 6. Separar credenciais sensíveis de dados públicos
    const { publicConfig, vaultCredentials } = separateCredentials(credentials);

    console.log(`[vault-save] Dados públicos: ${Object.keys(publicConfig).join(', ')}`);
    console.log(`[vault-save] Secrets a salvar: ${Object.keys(vaultCredentials).join(', ')}`);

    // 7. Marcar que credenciais estão no Vault (se houver secrets)
    if (Object.keys(vaultCredentials).length > 0) {
      publicConfig.credentials_in_vault = true;
    }

    // 8. Verificar se já existe registro para upsert
    const { data: existingIntegration } = await supabase
      .from('vendor_integrations')
      .select('id')
      .eq('vendor_id', vendor_id)
      .eq('integration_type', normalizedType)
      .maybeSingle();

    // 9. Salvar/atualizar dados públicos na tabela vendor_integrations
    if (existingIntegration) {
      const { error: updateError } = await supabase
        .from('vendor_integrations')
        .update({
          config: publicConfig,
          active,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingIntegration.id);

      if (updateError) {
        console.error('[vault-save] Erro ao atualizar dados públicos:', updateError);
        return new Response(
          JSON.stringify({ error: 'Erro ao atualizar configuração', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('[vault-save] ✅ vendor_integrations atualizado');
    } else {
      const { error: insertError } = await supabase
        .from('vendor_integrations')
        .insert({
          vendor_id,
          integration_type: normalizedType,
          config: publicConfig,
          active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('[vault-save] Erro ao inserir dados públicos:', insertError);
        return new Response(
          JSON.stringify({ error: 'Erro ao salvar configuração', details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('[vault-save] ✅ vendor_integrations criado');
    }

    // 10. Salvar credenciais sensíveis no Vault usando convenção UNIFICADA
    // Convenção: gateway_{type}_{vendor_id} via RPC save_gateway_credentials
    if (Object.keys(vaultCredentials).length > 0) {
      console.log(`[vault-save] Salvando no Vault com convenção unificada: gateway_${gatewayLower}_${vendor_id}`);
      
      const { data: rpcData, error: vaultError } = await supabase.rpc('save_gateway_credentials', {
        p_vendor_id: vendor_id,
        p_gateway: gatewayLower,
        p_credentials: vaultCredentials
      });

      if (vaultError) {
        console.error('[vault-save] Erro ao salvar no Vault:', vaultError);
        return new Response(
          JSON.stringify({ error: 'Erro ao salvar credenciais no Vault', details: vaultError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[vault-save] ✅ Credenciais salvas no Vault:', rpcData);
    }

    // 11. Retornar sucesso
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Credenciais salvas com sucesso',
        integration_type: normalizedType,
        public_fields_saved: Object.keys(publicConfig).length,
        secrets_saved: Object.keys(vaultCredentials).length,
        vault_convention: `gateway_${gatewayLower}_${vendor_id}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[vault-save] Erro não tratado:', errorMessage);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
