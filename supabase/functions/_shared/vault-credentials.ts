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
 * NOTA DE TIPAGEM:
 * Usamos um tipo genérico para o cliente Supabase para evitar conflitos
 * de versão entre diferentes Edge Functions. O tipo exige apenas o método
 * `rpc` que é o único utilizado neste módulo.
 * 
 * ============================================================================
 */

// ========================================================================
// TYPES
// ========================================================================

/**
 * Interface minimalista para o cliente Supabase
 * 
 * Usamos `unknown` para máxima compatibilidade entre diferentes
 * configurações de cliente Supabase usadas nas Edge Functions.
 * O tipo é validado em runtime pelo método `rpc`.
 */
type SupabaseRpcClient = {
  rpc: (fn: string, params?: Record<string, unknown>) => PromiseLike<{ 
    data: unknown; 
    error: { message: string } | null 
  }>;
} | unknown;

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

// Interface para resposta do RPC get_gateway_credentials
interface VaultRpcResponse {
  success: boolean;
  error?: string;
  credentials?: VaultCredentials;
}

// ========================================================================
// SAVE CREDENTIALS TO VAULT
// ========================================================================

/**
 * Salva credenciais OAuth no Supabase Vault
 * 
 * @param supabase - Cliente Supabase com service role (requer método rpc)
 * @param vendorId - ID do vendedor
 * @param gateway - Tipo de gateway (MERCADOPAGO, STRIPE, etc.)
 * @param credentials - Credenciais a serem salvas
 * @returns Resultado da operação
 */
export async function saveCredentialsToVault(
  supabase: SupabaseRpcClient,
  vendorId: string,
  gateway: string,
  credentials: VaultCredentials
): Promise<VaultResult> {
  // Type assertion para acesso ao método rpc
  const client = supabase as { rpc: (fn: string, params?: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }> };
  
  const gatewayLower = gateway.toLowerCase();
  
  console.log(`[vault-credentials] 💾 Salvando credenciais no Vault`, {
    vendorId,
    gateway: gatewayLower,
    hasAccessToken: !!credentials.access_token,
    hasRefreshToken: !!credentials.refresh_token
  });

  try {
    // Chamar RPC function para salvar no Vault
    const { data, error } = await client.rpc('save_gateway_credentials', {
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

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[vault-credentials] ❌ Exceção ao salvar no Vault:`, err);
    return {
      success: false,
      error: `Exceção ao salvar credenciais: ${errorMessage}`
    };
  }
}

// ========================================================================
// GET CREDENTIALS FROM VAULT
// ========================================================================

/**
 * Busca credenciais OAuth do Supabase Vault
 * 
 * @param supabase - Cliente Supabase com service role (requer método rpc)
 * @param vendorId - ID do vendedor
 * @param gateway - Tipo de gateway (MERCADOPAGO, STRIPE, etc.)
 * @returns Credenciais ou erro
 */
export async function getVendorCredentials(
  supabase: SupabaseRpcClient,
  vendorId: string,
  gateway: string
): Promise<VaultResult> {
  // Type assertion para acesso ao método rpc
  const client = supabase as { rpc: (fn: string, params?: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }> };
  
  const gatewayLower = gateway.toLowerCase();
  
  console.log(`[vault-credentials] 🔍 Buscando credenciais do Vault`, {
    vendorId,
    gateway: gatewayLower
  });

  try {
    // Chamar RPC function para buscar do Vault
    const { data, error } = await client.rpc('get_gateway_credentials', {
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

    // Cast para tipo conhecido
    const rpcData = data as VaultRpcResponse;

    if (!rpcData.success) {
      console.warn(`[vault-credentials] ⚠️ Credenciais não encontradas no Vault`, {
        vendorId,
        gateway: gatewayLower,
        error: rpcData.error
      });
      return {
        success: false,
        error: rpcData.error || 'Credenciais não encontradas'
      };
    }

    // Validar que credentials contém access_token
    if (!rpcData.credentials || !rpcData.credentials.access_token) {
      console.error(`[vault-credentials] ❌ Credenciais incompletas no Vault`, rpcData.credentials);
      return {
        success: false,
        error: 'Credenciais incompletas (falta access_token)'
      };
    }

    console.log(`[vault-credentials] ✅ Credenciais recuperadas com sucesso`, {
      vendorId,
      gateway: gatewayLower,
      hasAccessToken: !!rpcData.credentials.access_token,
      hasRefreshToken: !!rpcData.credentials.refresh_token
    });

    return {
      success: true,
      credentials: rpcData.credentials,
      source: 'vault'
    };

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[vault-credentials] ❌ Exceção ao buscar do Vault:`, err);
    return {
      success: false,
      error: `Exceção ao buscar credenciais: ${errorMessage}`
    };
  }
}

// ========================================================================
// DELETE CREDENTIALS FROM VAULT (Opcional, para desconexão)
// ========================================================================

/**
 * Remove credenciais OAuth do Supabase Vault
 * 
 * @param supabase - Cliente Supabase com service role (requer método rpc)
 * @param vendorId - ID do vendedor
 * @param gateway - Tipo de gateway (MERCADOPAGO, STRIPE, etc.)
 * @returns Resultado da operação
 */
export async function deleteCredentialsFromVault(
  supabase: SupabaseRpcClient,
  vendorId: string,
  gateway: string
): Promise<VaultResult> {
  // Type assertion para acesso ao método rpc
  const client = supabase as { rpc: (fn: string, params?: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }> };
  
  const gatewayLower = gateway.toLowerCase();
  
  console.log(`[vault-credentials] 🗑️ Removendo credenciais do Vault`, {
    vendorId,
    gateway: gatewayLower
  });

  try {
    // Chamar RPC function para deletar do Vault
    const { data, error } = await client.rpc('delete_gateway_credentials', {
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

    console.log(`[vault-credentials] ✅ Credenciais removidas com sucesso`, data);
    
    return {
      success: true,
      source: 'vault'
    };

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[vault-credentials] ❌ Exceção ao deletar do Vault:`, err);
    return {
      success: false,
      error: `Exceção ao deletar credenciais: ${errorMessage}`
    };
  }
}
