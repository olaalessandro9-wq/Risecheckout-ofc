/**
 * Edge Function: save-vendor-credentials
 * 
 * Responsabilidade: Salvar credenciais de vendedor de forma segura no Supabase Vault
 * 
 * Fluxo:
 * 1. Recebe credenciais do frontend (após OAuth ou configuração manual)
 * 2. Salva dados públicos na tabela vendor_integrations
 * 3. Salva dados sensíveis (tokens, secrets) no Vault usando vault_upsert_secret
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
 * - Requer autenticação JWT
 * - Valida que o vendor_id corresponde ao usuário autenticado
 * - Usa vault_upsert_secret para idempotência
 * - Criptografa automaticamente via Vault
 * - VULN-002: Rate limiting implementado
 * 
 * @version 2.1.0
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
    [key: string]: unknown;
  };
  active?: boolean;
}

interface SecretToSave {
  name: string;
  value: string;
  key: string;
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
 */
function separateCredentials(
  vendorId: string,
  integrationType: string,
  credentials: Record<string, unknown>
): { publicConfig: Record<string, unknown>; secrets: SecretToSave[] } {
  const publicConfig: Record<string, unknown> = {};
  const secrets: SecretToSave[] = [];
  const type = integrationType.toLowerCase();

  for (const [key, value] of Object.entries(credentials)) {
    if (SENSITIVE_KEYS.includes(key) && typeof value === 'string' && value.trim()) {
      secrets.push({
        key,
        name: `vendor_${vendorId}_${type}_${key}`,
        value: value.trim()
      });
    } else {
      publicConfig[key] = value;
    }
  }

  return { publicConfig, secrets };
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
      console.warn(`[save-vendor-credentials] Rate limit exceeded for IP: ${getClientIP(req)}`);
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
      console.warn(`[save-vendor-credentials] Tentativa de acesso não autorizado: user ${producer.id} tentou salvar para vendor ${vendor_id}`);
      return new Response(
        JSON.stringify({ error: 'Não autorizado a salvar credenciais de outro vendedor' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedType = integration_type.toUpperCase();
    console.log(`[save-vendor-credentials] Salvando credenciais para vendor ${vendor_id}, tipo ${normalizedType}`);

    // 6. Separar credenciais sensíveis de dados públicos
    const { publicConfig, secrets } = separateCredentials(vendor_id, normalizedType, credentials);

    console.log(`[save-vendor-credentials] Dados públicos: ${Object.keys(publicConfig).join(', ')}`);
    console.log(`[save-vendor-credentials] Secrets a salvar: ${secrets.map(s => s.key).join(', ')}`);

    // 7. Verificar se já existe registro para upsert
    const { data: existingIntegration } = await supabase
      .from('vendor_integrations')
      .select('id')
      .eq('vendor_id', vendor_id)
      .eq('integration_type', normalizedType)
      .maybeSingle();

    // 8. Salvar/atualizar dados públicos na tabela vendor_integrations
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
        console.error('[save-vendor-credentials] Erro ao atualizar dados públicos:', updateError);
        return new Response(
          JSON.stringify({ error: 'Erro ao atualizar configuração', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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
        console.error('[save-vendor-credentials] Erro ao inserir dados públicos:', insertError);
        return new Response(
          JSON.stringify({ error: 'Erro ao salvar configuração', details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 9. Salvar credenciais sensíveis no Vault usando vault_upsert_secret
    const savedSecrets: string[] = [];

    for (const secret of secrets) {
      const { error: upsertError } = await supabase.rpc('vault_upsert_secret', {
        p_name: secret.name,
        p_secret: secret.value
      });

      if (upsertError) {
        console.error(`[save-vendor-credentials] Erro ao salvar secret ${secret.name}:`, upsertError);
        return new Response(
          JSON.stringify({ error: 'Erro ao salvar credenciais no Vault', details: upsertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      savedSecrets.push(secret.key);
      console.log(`[save-vendor-credentials] ✅ Secret salvo: ${secret.name}`);
    }

    // 10. Retornar sucesso
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Credenciais salvas com sucesso',
        integration_type: normalizedType,
        public_fields_saved: Object.keys(publicConfig).length,
        secrets_saved: savedSecrets.length,
        secrets_keys: savedSecrets
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[save-vendor-credentials] Erro não tratado:', errorMessage);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
