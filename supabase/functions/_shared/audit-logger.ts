/**
 * Audit Logger - Helper para registrar eventos de segurança
 * 
 * @version 2.2.0 - Migrated to centralized logger
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "./logger.ts";

const log = createLogger("AuditLogger");

// ============================================
// TYPES
// ============================================

// Ações de segurança padronizadas
export const SecurityAction = {
  // Autenticação
  LOGIN_SUCCESS: "login_success",
  LOGIN_FAILED: "login_failed",
  LOGOUT: "logout",
  
  // Afiliação
  MANAGE_AFFILIATION: "manage_affiliation",
  APPROVE_AFFILIATE: "approve_affiliate",
  REJECT_AFFILIATE: "reject_affiliate",
  BLOCK_AFFILIATE: "block_affiliate",
  
  // Produtos
  CREATE_PRODUCT: "create_product",
  UPDATE_PRODUCT: "update_product",
  DELETE_PRODUCT: "delete_product",
  UPDATE_AFFILIATE_SETTINGS: "update_affiliate_settings",
  
  // Admin
  ACCESS_ADMIN_PANEL: "access_admin_panel",
  VIEW_SECURITY_LOGS: "view_security_logs",
  CHANGE_USER_ROLE: "change_user_role",
  
  // Pagamentos
  PROCESS_PAYMENT: "process_payment",
  REFUND_PAYMENT: "refund_payment",
  
  // Acesso negado
  ACCESS_DENIED: "access_denied",
  PERMISSION_DENIED: "permission_denied",
} as const;

export type SecurityActionType = typeof SecurityAction[keyof typeof SecurityAction];

interface LogSecurityEventParams {
  userId: string;
  action: SecurityActionType;
  resource?: string;
  resourceId?: string;
  success?: boolean;
  request?: Request;
  metadata?: Record<string, unknown>;
}

/**
 * Registra um evento de segurança no banco de dados
 */
export async function logSecurityEvent(
  supabase: SupabaseClient,
  params: LogSecurityEventParams
): Promise<void> {
  const {
    userId,
    action,
    resource,
    resourceId,
    success = true,
    request,
    metadata = {},
  } = params;

  try {
    // Extrair informações do request se disponível
    const ipAddress = request?.headers.get("x-forwarded-for") || 
                     request?.headers.get("x-real-ip") || 
                     null;
    const userAgent = request?.headers.get("user-agent") || null;

    // Chamar função RPC para registrar evento
    const { error } = await supabase.rpc("log_security_event", {
      p_user_id: userId,
      p_action: action,
      p_resource: resource || null,
      p_resource_id: resourceId || null,
      p_success: success,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
      p_metadata: metadata,
    });

    if (error) {
      log.error(`Erro ao registrar evento: ${action}`, error);
    } else {
      log.debug(`Evento registrado: ${action} (success: ${success})`);
    }
  } catch (err: unknown) {
    // Não falhar a operação principal se o log falhar
    const errMessage = err instanceof Error ? err.message : String(err);
    log.error(`Exceção ao registrar evento: ${action}`, errMessage);
  }
}

/**
 * Helper para log de acesso negado
 */
export async function logAccessDenied(
  supabase: SupabaseClient,
  userId: string,
  resource: string,
  request?: Request,
  reason?: string
): Promise<void> {
  await logSecurityEvent(supabase, {
    userId,
    action: SecurityAction.ACCESS_DENIED,
    resource,
    success: false,
    request,
    metadata: { reason },
  });
}

/**
 * Helper para log de permissão negada (role insuficiente)
 */
export async function logPermissionDenied(
  supabase: SupabaseClient,
  userId: string,
  userRole: string,
  requiredRole: string,
  resource: string,
  request?: Request
): Promise<void> {
  await logSecurityEvent(supabase, {
    userId,
    action: SecurityAction.PERMISSION_DENIED,
    resource,
    success: false,
    request,
    metadata: { 
      userRole, 
      requiredRole,
      message: `User role '${userRole}' insufficient for '${requiredRole}' access`
    },
  });
}
