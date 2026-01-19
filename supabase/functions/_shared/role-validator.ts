/**
 * Role Validator - Helper para validação de roles em Edge Functions
 * 
 * CRÍTICO: Esta é a camada de segurança REAL do sistema.
 * O frontend pode ser bypassado, mas o backend não.
 * 
 * Uso:
 * import { validateRole, requireRole, UserRole } from "../_shared/role-validator.ts";
 * 
 * // Verificar se tem role
 * const hasAccess = await validateRole(supabase, userId, "admin");
 * 
 * // Ou lançar erro se não tiver
 * await requireRole(supabase, userId, "admin", "manage affiliates");
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logPermissionDenied } from "./audit-logger.ts";
import { createLogger } from "./logger.ts";

const log = createLogger("RoleValidator");

// Tipos de role
export type UserRole = "owner" | "admin" | "user" | "seller";

// Hierarquia de roles (menor = mais permissivo)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 1,
  admin: 2,
  user: 3,
  seller: 4,
};

/**
 * Obtém o role do usuário do banco de dados
 */
export async function getUserRole(
  supabase: SupabaseClient,
  userId: string
): Promise<UserRole> {
  const { data, error } = await supabase.rpc("get_user_role", {
    p_user_id: userId,
  });

  if (error) {
    log.error("Erro ao buscar role:", error);
    return "user"; // Fallback seguro
  }

  const role = (data as string) || "user";
  
  // Validar que o role é conhecido
  if (!Object.keys(ROLE_HIERARCHY).includes(role)) {
    log.warn("Role desconhecido:", role);
    return "user";
  }

  return role as UserRole;
}

/**
 * Verifica se o usuário tem pelo menos o role especificado
 */
export async function validateRole(
  supabase: SupabaseClient,
  userId: string,
  requiredRole: UserRole
): Promise<boolean> {
  const userRole = await getUserRole(supabase, userId);
  return ROLE_HIERARCHY[userRole] <= ROLE_HIERARCHY[requiredRole];
}

/**
 * Verifica se o usuário pode ter afiliados (owner ou admin)
 */
export async function canHaveAffiliates(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("can_have_affiliates", {
    p_user_id: userId,
  });

  if (error) {
    log.error("Erro ao verificar can_have_affiliates:", error);
    return false;
  }

  return data === true;
}

/**
 * Verifica se o usuário é admin (owner ou admin)
 */
export async function isAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin", {
    p_user_id: userId,
  });

  if (error) {
    log.error("Erro ao verificar is_admin:", error);
    return false;
  }

  return data === true;
}

/**
 * Exige que o usuário tenha pelo menos o role especificado.
 * Lança erro se não tiver, facilitando o early return.
 * 
 * @throws Error se o usuário não tiver o role necessário
 */
export async function requireRole(
  supabase: SupabaseClient,
  userId: string,
  requiredRole: UserRole,
  action: string,
  request?: Request
): Promise<UserRole> {
  const userRole = await getUserRole(supabase, userId);
  const hasAccess = ROLE_HIERARCHY[userRole] <= ROLE_HIERARCHY[requiredRole];

  if (!hasAccess) {
    // Registrar tentativa de acesso negado
    await logPermissionDenied(
      supabase,
      userId,
      userRole,
      requiredRole,
      action,
      request
    );

    throw new Error(
      `Permissão negada: role '${userRole}' não pode executar '${action}'. Requer: '${requiredRole}' ou superior.`
    );
  }

  log.info(`Acesso permitido: ${userRole} >= ${requiredRole} para ${action}`);
  return userRole;
}

/**
 * Exige que o usuário possa ter afiliados
 * @throws Error se o usuário não puder ter afiliados
 */
export async function requireCanHaveAffiliates(
  supabase: SupabaseClient,
  userId: string,
  action: string,
  request?: Request
): Promise<void> {
  const canHave = await canHaveAffiliates(supabase, userId);

  if (!canHave) {
    const userRole = await getUserRole(supabase, userId);
    
    await logPermissionDenied(
      supabase,
      userId,
      userRole,
      "owner/admin (can_have_affiliates)",
      action,
      request
    );

    throw new Error(
      `Permissão negada: seu plano não inclui programa de afiliados. Contate o suporte para upgrade.`
    );
  }

  log.info(`Acesso a afiliados permitido para ${action}`);
}
