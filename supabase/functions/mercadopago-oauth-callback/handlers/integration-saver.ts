/**
 * Integration Saver Handler
 * 
 * RISE Protocol V3 - 10.0/10 Compliant
 * Uses 'users' table as SSOT for OAuth profile updates
 * 
 * Responsabilidade: Salvar credenciais no Vault e metadados no banco
 * 
 * @module mercadopago-oauth-callback/handlers/integration-saver
 * @version 2.0.0 - Migrated from profiles to users (SSOT)
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { saveCredentialsToVault } from "../../_shared/vault-credentials.ts";
import { createLogger } from "../../_shared/logger.ts";

const log = createLogger("mercadopago-oauth-callback");

export interface IntegrationData {
  vendorId: string;
  accessToken: string;
  refreshToken: string;
  publicKey: string;
  collectorId: string;
  email: string | null;
}

export interface SaveResult {
  success: boolean;
  error?: string;
}

/**
 * Salva dados OAuth: users, vault e vendor_integrations
 * 
 * RISE V3: Uses 'users' table as SSOT instead of profiles
 */
export async function saveOAuthIntegration(
  supabase: SupabaseClient,
  data: IntegrationData
): Promise<SaveResult> {
  const { vendorId, accessToken, refreshToken, publicKey, collectorId, email } = data;

  try {
    // 1. Atualizar tabela users com dados OAuth (SSOT)
    log.info('Salvando dados OAuth em users...');
    
    const { error: userError } = await supabase
      .from('users')
      .update({
        mercadopago_collector_id: collectorId,
        mercadopago_email: email,
        mercadopago_connected_at: new Date().toISOString()
      })
      .eq('id', vendorId);

    if (userError) {
      log.error('Erro ao atualizar users:', userError);
    } else {
      log.info('✅ Users atualizado com sucesso');
    }

    // 2. Salvar credenciais no VAULT
    log.info('Salvando credenciais no Supabase Vault...');
    
    const vaultResult = await saveCredentialsToVault(supabase, vendorId, 'MERCADOPAGO', {
      access_token: accessToken,
      refresh_token: refreshToken
    });
    
    if (!vaultResult.success) {
      log.error('Erro ao salvar no Vault:', vaultResult.error);
      return {
        success: false,
        error: 'Erro ao salvar credenciais de forma segura.'
      };
    }
    log.info('✅ Credenciais salvas no Vault');

    // 3. Salvar/atualizar vendor_integrations (APENAS metadados públicos)
    log.info('Salvando metadados em vendor_integrations...');
    
    const integrationConfig = {
      public_key: publicKey || null,
      user_id: collectorId,
      email: email,
      is_test: false,
      environment: 'production' as const,
      connected_at: new Date().toISOString(),
      credentials_in_vault: true
    };

    const { data: existingIntegration } = await supabase
      .from('vendor_integrations')
      .select('id')
      .eq('vendor_id', vendorId)
      .eq('integration_type', 'MERCADOPAGO')
      .maybeSingle();

    if (existingIntegration) {
      const { error: updateError } = await supabase
        .from('vendor_integrations')
        .update({
          config: integrationConfig,
          active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingIntegration.id);

      if (updateError) {
        log.error('Erro ao atualizar integração:', updateError);
        return {
          success: false,
          error: 'Erro ao salvar integração.'
        };
      }
      log.info('✅ Integração atualizada');
    } else {
      const { error: insertError } = await supabase
        .from('vendor_integrations')
        .insert({
          vendor_id: vendorId,
          integration_type: 'MERCADOPAGO',
          config: integrationConfig,
          active: true
        });

      if (insertError) {
        log.error('Erro ao criar integração:', insertError);
        return {
          success: false,
          error: 'Erro ao salvar integração.'
        };
      }
      log.info('✅ Integração criada');
    }

    return { success: true };

  } catch (error) {
    log.error('Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao salvar integração'
    };
  }
}
