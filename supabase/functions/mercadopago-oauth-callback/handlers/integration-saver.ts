/**
 * Integration Saver Handler
 * 
 * Responsabilidade: Salvar credenciais no Vault e metadados no banco
 * 
 * @module mercadopago-oauth-callback/handlers/integration-saver
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { saveCredentialsToVault } from "../../_shared/vault-credentials.ts";

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
 * Salva dados OAuth: profiles, vault e vendor_integrations
 */
export async function saveOAuthIntegration(
  supabase: SupabaseClient,
  data: IntegrationData
): Promise<SaveResult> {
  const { vendorId, accessToken, refreshToken, publicKey, collectorId, email } = data;

  try {
    // 1. Atualizar tabela profiles com dados OAuth
    console.log('[Integration Saver] Salvando dados OAuth em profiles...');
    
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        mercadopago_collector_id: collectorId,
        mercadopago_email: email,
        mercadopago_connected_at: new Date().toISOString()
      })
      .eq('id', vendorId);

    if (profileError) {
      console.error('[Integration Saver] Erro ao atualizar profiles:', profileError);
      // Continuar mesmo com erro, pois o principal é salvar a integração
    } else {
      console.log('[Integration Saver] ✅ Profiles atualizado com sucesso');
    }

    // 2. Salvar credenciais no VAULT
    console.log('[Integration Saver] Salvando credenciais no Supabase Vault...');
    
    const vaultResult = await saveCredentialsToVault(supabase, vendorId, 'MERCADOPAGO', {
      access_token: accessToken,
      refresh_token: refreshToken
    });
    
    if (!vaultResult.success) {
      console.error('[Integration Saver] Erro ao salvar no Vault:', vaultResult.error);
      return {
        success: false,
        error: 'Erro ao salvar credenciais de forma segura.'
      };
    }
    console.log('[Integration Saver] ✅ Credenciais salvas no Vault');

    // 3. Salvar/atualizar vendor_integrations (APENAS metadados públicos)
    console.log('[Integration Saver] Salvando metadados em vendor_integrations...');
    
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
      // Atualizar existente
      const { error: updateError } = await supabase
        .from('vendor_integrations')
        .update({
          config: integrationConfig,
          active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingIntegration.id);

      if (updateError) {
        console.error('[Integration Saver] Erro ao atualizar integração:', updateError);
        return {
          success: false,
          error: 'Erro ao salvar integração.'
        };
      }
      console.log('[Integration Saver] ✅ Integração atualizada');
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
        console.error('[Integration Saver] Erro ao criar integração:', insertError);
        return {
          success: false,
          error: 'Erro ao salvar integração.'
        };
      }
      console.log('[Integration Saver] ✅ Integração criada');
    }

    return { success: true };

  } catch (error) {
    console.error('[Integration Saver] Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao salvar integração'
    };
  }
}
