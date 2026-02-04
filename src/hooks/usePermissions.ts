/**
 * usePermissions - Hook para verificar permissões do usuário
 * 
 * Hierarquia de Roles:
 * - owner: Plataforma/Checkout. ÚNICO que pode TER programa de afiliados. Recebe 4% de todas as vendas.
 * - admin: Suporte administrativo, acesso a painéis admin
 * - user: Usuário padrão, pode criar produtos, pode SE AFILIAR a produtos do Owner
 * - seller: Vendedor, pode criar produtos, pode SE AFILIAR a produtos do Owner
 * 
 * IMPORTANTE: 
 * - Apenas o Owner pode TER afiliados (programa de afiliados)
 * - Vendedores (user/seller) podem SE AFILIAR a produtos, mas não podem TER afiliados próprios
 * - Este hook NÃO substitui validação no backend! Sempre valide nas Edge Functions.
 */

import { useMemo } from "react";
import { useAuthRole } from "@/hooks/useAuthRole";

// Tipos de role do sistema
export type AppRole = "owner" | "admin" | "user" | "seller";

// Interface de permissões derivadas
export interface Permissions {
  // Role atual
  role: AppRole;
  
  // Permissões específicas
  canHaveAffiliates: boolean;      // Pode ter programa de afiliados próprio
  canManageProducts: boolean;       // Pode criar/editar produtos
  canAccessMarketplace: boolean;    // Pode acessar marketplace
  canBecomeAffiliate: boolean;      // Pode se afiliar a produtos
  canAccessAdminPanel: boolean;     // Pode acessar painéis administrativos
  canViewSecurityLogs: boolean;     // Pode ver logs de segurança
  canManageUsers: boolean;          // Pode gerenciar outros usuários
  canAccessMembersArea: boolean;    // Pode acessar área de membros (admin/owner)
  
  // Estado
  isLoading: boolean;
  error: Error | null;
}

// Hierarquia de prioridade (menor = maior prioridade)
const ROLE_PRIORITY: Record<AppRole, number> = {
  owner: 1,
  admin: 2,
  user: 3,
  seller: 4,
};

/**
 * Hook principal de permissões
 * 
 * RISE V3 10.0/10: Usa useAuthRole (Selective Subscription)
 * NÃO re-renderiza durante background sync de autenticação
 */
export function usePermissions(): Permissions {
  // RISE V3: Usa hook seletivo em vez de useUnifiedAuth completo
  // Isso previne re-renders quando loading states mudam
  const { activeRole } = useAuthRole();
  
  // Get role from unified auth context
  // activeRole comes from the session, mapped to AppRole
  const role: AppRole = (activeRole as AppRole) || "user";

  // Derivar permissões baseadas no role
  // RISE V3: isLoading é SEMPRE false aqui - permissions são derivadas de cache
  // Guards devem usar useUnifiedAuth().isAuthLoading para bloquear UI
  const permissions = useMemo<Permissions>(() => {
    return {
      role,
      isLoading: false, // RISE V3: Permissions NUNCA bloqueiam - derivadas de cache
      error: null,

      // APENAS Owner pode TER programa de afiliados
      // Vendedores podem SE AFILIAR, mas não podem TER afiliados próprios
      canHaveAffiliates: role === "owner",

      // Todos podem criar/editar produtos (exceto restrições específicas)
      canManageProducts: true,

      // Todos podem acessar marketplace
      canAccessMarketplace: true,

      // Todos podem se afiliar a produtos de outros
      canBecomeAffiliate: true,

      // Apenas owner e admin podem acessar painéis administrativos
      canAccessAdminPanel: role === "owner" || role === "admin",

      // Apenas owner pode ver logs de segurança
      canViewSecurityLogs: role === "owner",

      // Apenas owner pode gerenciar usuários
      canManageUsers: role === "owner",

      // Apenas owner e admin podem acessar área de membros
      canAccessMembersArea: role === "owner" || role === "admin",
    };
  }, [role]);

  return permissions;
}

/**
 * Hook para verificar se o usuário tem pelo menos um determinado role
 */
export function useHasMinRole(minRole: AppRole): boolean {
  const { role, isLoading } = usePermissions();
  
  if (isLoading) return false;
  
  return ROLE_PRIORITY[role] <= ROLE_PRIORITY[minRole];
}

/**
 * Hook para verificar uma permissão específica
 */
export function useCanHaveAffiliates(): { canHaveAffiliates: boolean; isLoading: boolean } {
  const { canHaveAffiliates, isLoading } = usePermissions();
  return { canHaveAffiliates, isLoading };
}
