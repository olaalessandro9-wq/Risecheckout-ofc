/**
 * ============================================================================
 * VAULT CREDENTIALS - Gerenciamento Seguro de Credenciais OAuth
 * ============================================================================
 * 
 * Este módulo centraliza o acesso ao Supabase Vault para armazenamento
 * e recuperação segura de tokens OAuth de vendedores.
 * 
 * Naming Convention: gateway_{integration_type}_{vendor_id}
 * Exemplo: gateway_mercadopago_abc-123-def
 * 
 * ============================================================================
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ========================================================================
// TYPES
// ========================================================================

export interface VaultCredentials {
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  user_id?: string;
  public_key?: string;
}

export interface VaultResult {
  success: boolean;
  error?: string;
  credentials?: VaultCredentials;
  source?: string;
}

// ========================================================================
// SAVE CREDENTIALS TO VAULT
// ========================================================================

/**
 * Salva credenciais OAuth no Supabase Vault
 * 
 * @param supabase - Cliente Supabase com service role
 * @param vendorId - ID do vendedor
 * @param gateway - Tipo de gateway (MERCADOPAGO, STRIPE, etc.)
 * @param credentials - Credenciais a serem salvas
 * @returns Resultado da operação
 */
export async function saveCredentialsToVault(
  supabase: SupabaseClient,
  vendorId: string,
  gateway: string,
  credentials: VaultCredentials
): Promise<VaultResult> {
  
  const gatewayLower = gateway.toLowerCase();
  
  console.log(`[vault-credentials] 💾 Salvando credenciais no Vault`, {
    vendorId,
    gateway: gatewayLower,
    hasAccessToken: !!credentials.access_token,
    hasRefreshToken: !!credentials.refresh_token
  });

  try {
    // Chamar RPC function para salvar no Vault
    const { data, error } = await supabase.rpc('save_gateway_credentials', {
      p_vendor_id: vendorId,
      p_gateway: gatewayLower,
      p_credentials: credentials
    });

    if (error) {
      console.error(`[vault-credentials] ❌ Erro ao salvar no Vault:`, error);
      return {
        success: false,
        error: `Erro ao salvar credenciais: ${error.message}`
      };
    }

    console.log(`[vault-credentials] ✅ Credenciais salvas com sucesso`, data);
    
    return {
      success: true,
      source: 'vault'
    };

  } catch (err: any) {
    console.error(`[vault-credentials] ❌ Exceção ao salvar no Vault:`, err);
    return {
      success: false,
      error: `Exceção ao salvar credenciais: ${err.message}`
    };
  }
}

// ========================================================================
// GET CREDENTIALS FROM VAULT
// ========================================================================

/**
 * Busca credenciais OAuth do Supabase Vault
 * 
 * @param supabase - Cliente Supabase com service role
 * @param vendorId - ID do vendedor
 * @param gateway - Tipo de gateway (MERCADOPAGO, STRIPE, etc.)
 * @returns Credenciais ou erro
 */
export async function getVendorCredentials(
  supabase: SupabaseClient,
  vendorId: string,
  gateway: string
): Promise<VaultResult> {
  
  const gatewayLower = gateway.toLowerCase();
  
  console.log(`[vault-credentials] 🔍 Buscando credenciais do Vault`, {
    vendorId,
    gateway: gatewayLower
  });

  try {
    // Chamar RPC function para buscar do Vault
    const { data, error } = await supabase.rpc('get_gateway_credentials', {
      p_vendor_id: vendorId,
      p_gateway: gatewayLower
    });

    if (error) {
      console.error(`[vault-credentials] ❌ Erro ao buscar do Vault:`, error);
      return {
        success: false,
        error: `Erro ao buscar credenciais: ${error.message}`
      };
    }

    // RPC retorna JSONB com { success, credentials?, error? }
    if (!data || typeof data !== 'object') {
      console.error(`[vault-credentials] ❌ Resposta inválida do Vault:`, data);
      return {
        success: false,
        error: 'Resposta inválida do Vault'
      };
    }

    if (!data.success) {
      console.warn(`[vault-credentials] ⚠️ Credenciais não encontradas no Vault`, {
        vendorId,
        gateway: gatewayLower,
        error: data.error
      });
      return {
        success: false,
        error: data.error || 'Credenciais não encontradas'
      };
    }

    // Validar que credentials contém access_token
    if (!data.credentials || !data.credentials.access_token) {
      console.error(`[vault-credentials] ❌ Credenciais incompletas no Vault`, data.credentials);
      return {
        success: false,
        error: 'Credenciais incompletas (falta access_token)'
      };
    }

    console.log(`[vault-credentials] ✅ Credenciais recuperadas com sucesso`, {
      vendorId,
      gateway: gatewayLower,
      hasAccessToken: !!data.credentials.access_token,
      hasRefreshToken: !!data.credentials.refresh_token
    });

    return {
      success: true,
      credentials: data.credentials,
      source: 'vault'
    };

  } catch (err: any) {
    console.error(`[vault-credentials] ❌ Exceção ao buscar do Vault:`, err);
    return {
      success: false,
      error: `Exceção ao buscar credenciais: ${err.message}`
    };
  }
}

// ========================================================================
// DELETE CREDENTIALS FROM VAULT (Opcional, para desconexão)
// ========================================================================

/**
 * Remove credenciais OAuth do Supabase Vault
 * 
 * @param supabase - Cliente Supabase com service role
 * @param vendorId - ID do vendedor
 * @param gateway - Tipo de gateway (MERCADOPAGO, STRIPE, etc.)
 * @returns Resultado da operação
 */
export async function deleteCredentialsFromVault(
  supabase: SupabaseClient,
  vendorId: string,
  gateway: string
): Promise<VaultResult> {
  
  const gatewayLower = gateway.toLowerCase();
  
  console.log(`[vault-credentials] 🗑️ Removendo credenciais do Vault`, {
    vendorId,
    gateway: gatewayLower
  });

  try {
    // Chamar RPC function para deletar do Vault
    const { data, error } = await supabase.rpc('delete_gateway_credentials', {
      p_vendor_id: vendorId,
      p_gateway: gatewayLower
    });

    if (error) {
      console.error(`[vault-credentials] ❌ Erro ao deletar do Vault:`, error);
      return {
        success: false,
        error: `Erro ao deletar credenciais: ${error.message}`
      };
    }

    console.log(`[vault-credentials] ✅ Credenciais removidas com sucesso`);
    
    return {
      success: true,
      source: 'vault'
    };

  } catch (err: any) {
    console.error(`[vault-credentials] ❌ Exceção ao deletar do Vault:`, err);
    return {
      success: false,
      error: `Exceção ao deletar credenciais: ${err.message}`
    };
  }
}
