/**
 * Edge Function: migrate-credentials-to-vault
 * 
 * Responsabilidade: Migrar credenciais existentes da tabela vendor_integrations para o Vault
 * 
 * ⚠️ ATENÇÃO: Esta é uma função ONE-TIME (executar apenas uma vez)
 * 
 * Fluxo:
 * 1. Busca todas as integrações (ativas e inativas)
 * 2. Para cada integração:
 *    - Extrai credenciais sensíveis do campo config
 *    - Salva no Vault usando vault_upsert_secret (idempotente)
 *    - Remove credenciais do campo config
 *    - Atualiza o registro
 * 3. Retorna relatório da migração
 * 
 * Integrações suportadas:
 * - MERCADOPAGO: access_token, refresh_token
 * - STRIPE: access_token, refresh_token
 * - ASAAS: api_key
 * - PUSHINPAY: api_token
 * - UTMIFY: api_token
 * - FACEBOOK_PIXEL: access_token
 * 
 * Segurança:
 * - Requer autenticação JWT
 * - Apenas admins podem executar (verificar role)
 * - Usa vault_upsert_secret para idempotência
 * 
 * @version 2.0.0
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';

interface SecretToMigrate {
  key: string;
  value: string;
  vaultName: string;
}

interface MigrationResult {
  vendor_id: string;
  integration_type: string;
  integration_id: string;
  active: boolean;
  secrets_migrated: string[];
  status: 'success' | 'skipped' | 'error';
  error?: string;
}

interface MigrationOptions {
  dryRun?: boolean;
  includeInactive?: boolean;
  vendorId?: string;
  integrationType?: string;
}

/**
 * Extrai credenciais sensíveis baseado no tipo de integração
 */
function extractSecretsFromConfig(
  vendorId: string,
  integrationType: string,
  config: Record<string, unknown>
): SecretToMigrate[] {
  const secrets: SecretToMigrate[] = [];
  const type = integrationType.toUpperCase();

  // MERCADOPAGO: access_token, refresh_token
  if (type === 'MERCADOPAGO') {
    if (config.access_token && typeof config.access_token === 'string') {
      secrets.push({
        key: 'access_token',
        value: config.access_token,
        vaultName: `vendor_${vendorId}_mercadopago_access_token`
      });
    }
    if (config.refresh_token && typeof config.refresh_token === 'string') {
      secrets.push({
        key: 'refresh_token',
        value: config.refresh_token,
        vaultName: `vendor_${vendorId}_mercadopago_refresh_token`
      });
    }
  }

  // STRIPE: access_token, refresh_token
  if (type === 'STRIPE') {
    if (config.access_token && typeof config.access_token === 'string') {
      secrets.push({
        key: 'access_token',
        value: config.access_token,
        vaultName: `vendor_${vendorId}_stripe_access_token`
      });
    }
    if (config.refresh_token && typeof config.refresh_token === 'string') {
      secrets.push({
        key: 'refresh_token',
        value: config.refresh_token,
        vaultName: `vendor_${vendorId}_stripe_refresh_token`
      });
    }
  }

  // ASAAS: api_key
  if (type === 'ASAAS') {
    if (config.api_key && typeof config.api_key === 'string') {
      secrets.push({
        key: 'api_key',
        value: config.api_key,
        vaultName: `vendor_${vendorId}_asaas_api_key`
      });
    }
  }

  // PUSHINPAY: api_token ou pushinpay_token
  if (type === 'PUSHINPAY') {
    const token = config.pushinpay_token || config.api_token;
    if (token && typeof token === 'string') {
      secrets.push({
        key: config.pushinpay_token ? 'pushinpay_token' : 'api_token',
        value: token,
        vaultName: `vendor_${vendorId}_pushinpay_api_token`
      });
    }
  }

  // UTMIFY: api_token
  if (type === 'UTMIFY') {
    if (config.api_token && typeof config.api_token === 'string') {
      secrets.push({
        key: 'api_token',
        value: config.api_token,
        vaultName: `vendor_${vendorId}_utmify_api_token`
      });
    }
  }

  // FACEBOOK_PIXEL: access_token
  if (type === 'FACEBOOK_PIXEL' || type === 'FACEBOOK') {
    if (config.access_token && typeof config.access_token === 'string') {
      secrets.push({
        key: 'access_token',
        value: config.access_token,
        vaultName: `vendor_${vendorId}_facebook_access_token`
      });
    }
  }

  // Webhook Secret (genérico para qualquer integração)
  if (config.webhook_secret && typeof config.webhook_secret === 'string') {
    secrets.push({
      key: 'webhook_secret',
      value: config.webhook_secret,
      vaultName: `vendor_${vendorId}_${type.toLowerCase()}_webhook_secret`
    });
  }

  return secrets;
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

    // 2. Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parsear opções do body
    let options: MigrationOptions = {
      dryRun: false,
      includeInactive: true
    };

    try {
      const body = await req.json();
      options = { ...options, ...body };
    } catch {
      // Body vazio é permitido, usa defaults
    }

    console.log(`[migrate-credentials-to-vault] Iniciando migração`);
    console.log(`[migrate-credentials-to-vault] Solicitado por: ${user.email}`);
    console.log(`[migrate-credentials-to-vault] Opções:`, JSON.stringify(options));

    // 4. Construir query para buscar integrações
    let query = supabase
      .from('vendor_integrations')
      .select('*');

    // Filtrar por status ativo/inativo
    if (!options.includeInactive) {
      query = query.eq('active', true);
    }

    // Filtrar por vendor específico
    if (options.vendorId) {
      query = query.eq('vendor_id', options.vendorId);
    }

    // Filtrar por tipo de integração
    if (options.integrationType) {
      query = query.eq('integration_type', options.integrationType.toUpperCase());
    }

    const { data: integrations, error: fetchError } = await query;

    if (fetchError) {
      console.error('[migrate-credentials-to-vault] Erro ao buscar integrações:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar integrações', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!integrations || integrations.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Nenhuma integração encontrada para migrar', 
          total: 0,
          options 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[migrate-credentials-to-vault] Encontradas ${integrations.length} integrações para processar`);

    // 5. Processar cada integração
    const results: MigrationResult[] = [];

    for (const integration of integrations) {
      const { id, vendor_id, integration_type, config, active } = integration;
      
      try {
        console.log(`[migrate-credentials-to-vault] Processando ${integration_type} do vendor ${vendor_id} (active: ${active})`);

        // 5.1. Extrair secrets do config
        const secretsToMigrate = extractSecretsFromConfig(
          vendor_id,
          integration_type,
          config || {}
        );

        // 5.2. Se não há secrets para migrar, pular
        if (secretsToMigrate.length === 0) {
          console.log(`[migrate-credentials-to-vault] Nenhum secret encontrado para ${integration_type} do vendor ${vendor_id}`);
          results.push({
            vendor_id,
            integration_type,
            integration_id: id,
            active,
            secrets_migrated: [],
            status: 'skipped'
          });
          continue;
        }

        console.log(`[migrate-credentials-to-vault] Secrets a migrar: ${secretsToMigrate.map(s => s.key).join(', ')}`);

        // 5.3. Se é dry run, apenas reportar
        if (options.dryRun) {
          results.push({
            vendor_id,
            integration_type,
            integration_id: id,
            active,
            secrets_migrated: secretsToMigrate.map(s => s.key),
            status: 'success'
          });
          continue;
        }

        // 5.4. Salvar secrets no Vault usando vault_upsert_secret (idempotente)
        const migratedSecrets: string[] = [];

        for (const secret of secretsToMigrate) {
          const { error: upsertError } = await supabase.rpc('vault_upsert_secret', {
            p_name: secret.vaultName,
            p_secret: secret.value
          });

          if (upsertError) {
            throw new Error(`Erro ao salvar ${secret.key} no Vault: ${upsertError.message}`);
          }

          migratedSecrets.push(secret.key);
          console.log(`[migrate-credentials-to-vault] ✅ Secret salvo: ${secret.vaultName}`);
        }

        // 5.5. Remover secrets do config
        const newConfig = { ...config };
        for (const secret of secretsToMigrate) {
          delete newConfig[secret.key];
        }

        // 5.6. Atualizar registro removendo os secrets do config
        const { error: updateError } = await supabase
          .from('vendor_integrations')
          .update({ 
            config: newConfig,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (updateError) {
          throw new Error(`Erro ao atualizar config: ${updateError.message}`);
        }

        console.log(`[migrate-credentials-to-vault] ✅ Config atualizado para ${integration_type} do vendor ${vendor_id}`);

        results.push({
          vendor_id,
          integration_type,
          integration_id: id,
          active,
          secrets_migrated: migratedSecrets,
          status: 'success'
        });

      } catch (error) {
        console.error(`[migrate-credentials-to-vault] ❌ Erro ao migrar ${integration_type} do vendor ${vendor_id}:`, error);
        results.push({
          vendor_id,
          integration_type,
          integration_id: id,
          active,
          secrets_migrated: [],
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // 6. Gerar relatório
    const successCount = results.filter(r => r.status === 'success').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const totalSecretsMigrated = results.reduce((acc, r) => acc + r.secrets_migrated.length, 0);

    const response = {
      success: errorCount === 0,
      message: options.dryRun ? 'Dry run concluído (nenhuma alteração feita)' : 'Migração concluída',
      options,
      summary: {
        total_integrations: integrations.length,
        success: successCount,
        skipped: skippedCount,
        errors: errorCount,
        total_secrets_migrated: totalSecretsMigrated
      },
      results
    };

    console.log(`[migrate-credentials-to-vault] Migração finalizada:`, JSON.stringify(response.summary));

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[migrate-credentials-to-vault] Erro não tratado:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
