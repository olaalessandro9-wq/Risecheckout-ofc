/**
 * Permission Filters - Filtros de Navegação Baseados em Permissões
 * 
 * Funções puras para filtrar itens de navegação baseado
 * nas permissões do usuário autenticado.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Funções Puras
 */

import type { NavItemConfig, NavItemGroupVariant } from "../types/navigation.types";
import type { Permissions, AppRole } from "@/hooks/usePermissions";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Subset de permissões necessário para filtrar navegação
 */
export interface NavigationPermissions {
  role: AppRole;
  canHaveAffiliates: boolean;
  canAccessAdminPanel: boolean;
}

// ============================================================================
// PERMISSION CHECKING
// ============================================================================

/**
 * Verifica se um item deve ser visível baseado em suas permissões
 * 
 * @param item - Item de navegação
 * @param permissions - Permissões do usuário
 * @returns true se o item deve ser exibido
 */
function shouldShowItem(
  item: NavItemConfig,
  permissions: NavigationPermissions
): boolean {
  // Sem restrições = sempre visível
  if (!item.permissions) {
    return true;
  }

  const { requiresAdmin, requiresOwner, requiresPermission } = item.permissions;

  // Requer admin ou owner
  if (requiresAdmin && !permissions.canAccessAdminPanel) {
    return false;
  }

  // requiresOwner: true = apenas owner, false = apenas NÃO-owner
  if (requiresOwner === true && permissions.role !== "owner") {
    return false;
  }
  if (requiresOwner === false && permissions.role === "owner") {
    return false;
  }

  // Requer permissão específica
  if (requiresPermission) {
    if (requiresPermission === "canHaveAffiliates" && !permissions.canHaveAffiliates) {
      return false;
    }
    if (requiresPermission === "canAccessAdminPanel" && !permissions.canAccessAdminPanel) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// MAIN FILTER
// ============================================================================

/**
 * Filtra itens de navegação baseado nas permissões do usuário
 * Recursivamente filtra children de grupos
 * 
 * @param items - Configuração de navegação completa
 * @param permissions - Permissões do usuário (do usePermissions)
 * @returns Itens filtrados que o usuário pode ver
 */
export function filterByPermissions(
  items: readonly NavItemConfig[],
  permissions: NavigationPermissions
): NavItemConfig[] {
  return items
    .filter((item) => shouldShowItem(item, permissions))
    .map((item) => {
      // Se é um grupo, filtra recursivamente os children
      if (item.variant.type === "group") {
        const filteredChildren = filterByPermissions(
          item.variant.children,
          permissions
        );

        // Se não sobrou nenhum filho, oculta o grupo
        if (filteredChildren.length === 0) {
          // Retornamos null e filtramos depois
          return null;
        }

        // Cria novo item com children filtrados
        const newVariant: NavItemGroupVariant = {
          type: "group",
          children: filteredChildren,
        };

        return {
          ...item,
          variant: newVariant,
        };
      }

      return item;
    })
    .filter((item): item is NavItemConfig => item !== null);
}

/**
 * Extrai permissões de navegação do objeto Permissions completo
 * 
 * @param permissions - Objeto Permissions do usePermissions
 * @returns Subset necessário para navegação
 */
export function extractNavigationPermissions(
  permissions: Permissions
): NavigationPermissions {
  return {
    role: permissions.role,
    canHaveAffiliates: permissions.canHaveAffiliates,
    canAccessAdminPanel: permissions.canAccessAdminPanel,
  };
}
