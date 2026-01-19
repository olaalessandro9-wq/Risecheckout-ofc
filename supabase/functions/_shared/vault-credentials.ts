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
 * AUDIT LOGGING:
 * Todas as operações são registradas em `vault_access_log` automaticamente
 * pelas RPCs do banco de dados. O módulo passa IP e User-Agent quando disponíveis.
 * 
 * ============================================================================
 * @version 2.0.0 - RISE Protocol V3 Compliant (Audit Logging)
 * ============================================================================
 */

import { createLogger } from "./logger.ts";

const log = createLogger("VaultCredentials");

// ========================================================================
// TYPES
// ========================================================================

/**
 * Interface minimalista para o cliente Supabase
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
  auditLogId?: string;
}

/**
 * Contexto de auditoria para logging
 */
export interface AuditContext {
  ipAddress?: string;
  userAgent?: string;
}

// Interface para resposta do RPC
interface VaultRpcResponse {
  success: boolean;
  error?: string;
  credentials?: VaultCredentials;
  audit_log_id?: string;
}

// ========================================================================
// HELPER: Extract Audit Context from Request
// ========================================================================

/**
 * Extrai IP e User-Agent de uma Request para auditoria
 * 
 * @param request - Request HTTP (opcional)
 * @returns Contexto de auditoria
 */
export function extractAuditContext(request?: Request): AuditContext {
  if (!request) {
    return {};
  }

  // Tenta extrair IP de vários headers (Cloudflare, X-Forwarded-For, etc.)
  const ipAddress = 
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    undefined;

  const userAgent = request.headers.get('user-agent') || undefined;

  return { ipAddress, userAgent };
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
 * @param auditContext - Contexto para logging de auditoria
 * @returns Resultado da operação
 */
export async function saveCredentialsToVault(
  supabase: SupabaseRpcClient,
  vendorId: string,
  gateway: string,
  credentials: VaultCredentials,
  auditContext?: AuditContext
): Promise<VaultResult> {
  const client = supabase as { rpc: (fn: string, params?: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }> };
  
  const gatewayLower = gateway.toLowerCase();
  
  log.info("💾 Salvando credenciais no Vault", {
    vendorId,
    gateway: gatewayLower,
    hasAccessToken: !!credentials.access_token,
    hasRefreshToken: !!credentials.refresh_token,
    hasAuditContext: !!auditContext
  });

  try {
    const { data, error } = await client.rpc('save_gateway_credentials', {
      p_vendor_id: vendorId,
      p_gateway: gatewayLower,
      p_credentials: credentials,
      p_ip_address: auditContext?.ipAddress ?? null,
      p_user_agent: auditContext?.userAgent ?? null
    });

    if (error) {
      log.error("❌ Erro ao salvar no Vault", error);
      return {
        success: false,
        error: `Erro ao salvar credenciais: ${error.message}`
      };
    }

    const rpcData = data as VaultRpcResponse;
    
    log.info("✅ Credenciais salvas com sucesso", {
      auditLogId: rpcData.audit_log_id
    });
    
    return {
      success: true,
      source: 'vault',
      auditLogId: rpcData.audit_log_id
    };

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    log.error("❌ Exceção ao salvar no Vault", err);
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
 * @param supabase - Cliente Supabase com service role
 * @param vendorId - ID do vendedor
 * @param gateway - Tipo de gateway (MERCADOPAGO, STRIPE, etc.)
 * @param auditContext - Contexto para logging de auditoria
 * @returns Credenciais ou erro
 */
export async function getVendorCredentials(
  supabase: SupabaseRpcClient,
  vendorId: string,
  gateway: string,
  auditContext?: AuditContext
): Promise<VaultResult> {
  const client = supabase as { rpc: (fn: string, params?: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }> };
  
  const gatewayLower = gateway.toLowerCase();
  
  log.info("🔍 Buscando credenciais do Vault", {
    vendorId,
    gateway: gatewayLower,
    hasAuditContext: !!auditContext
  });

  try {
    const { data, error } = await client.rpc('get_gateway_credentials', {
      p_vendor_id: vendorId,
      p_gateway: gatewayLower,
      p_ip_address: auditContext?.ipAddress ?? null,
      p_user_agent: auditContext?.userAgent ?? null
    });

    if (error) {
      log.error("❌ Erro ao buscar do Vault", error);
      return {
        success: false,
        error: `Erro ao buscar credenciais: ${error.message}`
      };
    }

    if (!data || typeof data !== 'object') {
      log.error("❌ Resposta inválida do Vault", data);
      return {
        success: false,
        error: 'Resposta inválida do Vault'
      };
    }

    const rpcData = data as VaultRpcResponse;

    if (!rpcData.success) {
      log.warn("⚠️ Credenciais não encontradas no Vault", {
        vendorId,
        gateway: gatewayLower,
        error: rpcData.error
      });
      return {
        success: false,
        error: rpcData.error || 'Credenciais não encontradas'
      };
    }

    if (!rpcData.credentials || !rpcData.credentials.access_token) {
      log.error("❌ Credenciais incompletas no Vault", rpcData.credentials);
      return {
        success: false,
        error: 'Credenciais incompletas (falta access_token)'
      };
    }

    log.info("✅ Credenciais recuperadas com sucesso", {
      vendorId,
      gateway: gatewayLower,
      hasAccessToken: !!rpcData.credentials.access_token,
      hasRefreshToken: !!rpcData.credentials.refresh_token,
      auditLogId: rpcData.audit_log_id
    });

    return {
      success: true,
      credentials: rpcData.credentials,
      source: 'vault',
      auditLogId: rpcData.audit_log_id
    };

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    log.error("❌ Exceção ao buscar do Vault", err);
    return {
      success: false,
      error: `Exceção ao buscar credenciais: ${errorMessage}`
    };
  }
}

// ========================================================================
// DELETE CREDENTIALS FROM VAULT
// ========================================================================

/**
 * Remove credenciais OAuth do Supabase Vault
 * 
 * @param supabase - Cliente Supabase com service role
 * @param vendorId - ID do vendedor
 * @param gateway - Tipo de gateway (MERCADOPAGO, STRIPE, etc.)
 * @param auditContext - Contexto para logging de auditoria
 * @returns Resultado da operação
 */
export async function deleteCredentialsFromVault(
  supabase: SupabaseRpcClient,
  vendorId: string,
  gateway: string,
  auditContext?: AuditContext
): Promise<VaultResult> {
  const client = supabase as { rpc: (fn: string, params?: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }> };
  
  const gatewayLower = gateway.toLowerCase();
  
  log.info("🗑️ Removendo credenciais do Vault", {
    vendorId,
    gateway: gatewayLower,
    hasAuditContext: !!auditContext
  });

  try {
    const { data, error } = await client.rpc('delete_gateway_credentials', {
      p_vendor_id: vendorId,
      p_gateway: gatewayLower,
      p_ip_address: auditContext?.ipAddress ?? null,
      p_user_agent: auditContext?.userAgent ?? null
    });

    if (error) {
      log.error("❌ Erro ao deletar do Vault", error);
      return {
        success: false,
        error: `Erro ao deletar credenciais: ${error.message}`
      };
    }

    const rpcData = data as VaultRpcResponse;

    log.info("✅ Credenciais removidas com sucesso", {
      auditLogId: rpcData.audit_log_id
    });
    
    return {
      success: true,
      source: 'vault',
      auditLogId: rpcData.audit_log_id
    };

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    log.error("❌ Exceção ao deletar do Vault", err);
    return {
      success: false,
      error: `Exceção ao deletar credenciais: ${errorMessage}`
    };
  }
}
