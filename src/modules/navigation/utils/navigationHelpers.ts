/**
 * Navigation Helpers - Funções Puras e Testáveis
 * 
 * Todas as funções são PURAS (sem side effects) para
 * facilitar testes unitários e manutenção.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Funções Puras
 */

import type {
  NavItemConfig,
  SidebarState,
} from "../types/navigation.types";
import { SIDEBAR_WIDTHS } from "../types/navigation.types";

// ============================================================================
// PATH MATCHING
// ============================================================================

/**
 * Verifica se um pathname corresponde a um item de navegação
 * 
 * @param pathname - Pathname atual (ex: "/dashboard/produtos")
 * @param itemPath - Path do item de navegação
 * @param exact - Se true, requer match exato
 * @returns true se o path está ativo
 */
export function isActivePath(
  pathname: string,
  itemPath: string,
  exact?: boolean
): boolean {
  // Dashboard sempre requer match exato (não ativar para /dashboard/*)
  if (itemPath === "/dashboard") {
    return pathname === "/dashboard";
  }

  // Match exato solicitado
  if (exact) {
    return pathname === itemPath;
  }

  // Match por prefixo (permite /dashboard/produtos/123)
  return pathname.startsWith(itemPath);
}

/**
 * Verifica se algum filho de um grupo está ativo
 * 
 * @param pathname - Pathname atual
 * @param children - Itens filhos do grupo
 * @returns true se algum filho está ativo
 */
export function hasActiveChild(
  pathname: string,
  children: readonly NavItemConfig[]
): boolean {
  return children.some((child) => {
    if (child.variant.type !== "route") return false;
    return isActivePath(pathname, child.variant.path, child.variant.exact);
  });
}

// ============================================================================
// GROUP DISCOVERY
// ============================================================================

/**
 * Encontra IDs de grupos que contêm rotas ativas
 * Usado para inicializar grupos expandidos na primeira renderização
 * 
 * @param items - Configuração de navegação
 * @param pathname - Pathname atual
 * @returns Array de IDs de grupos com filhos ativos
 */
export function findActiveGroups(
  items: readonly NavItemConfig[],
  pathname: string
): string[] {
  const activeGroups: string[] = [];

  for (const item of items) {
    if (item.variant.type === "group") {
      if (hasActiveChild(pathname, item.variant.children)) {
        activeGroups.push(item.id);
      }
    }
  }

  return activeGroups;
}

// ============================================================================
// SIDEBAR WIDTH
// ============================================================================

/**
 * Calcula a largura efetiva do sidebar considerando hover
 * 
 * @param sidebarState - Estado atual do sidebar
 * @param isHovering - Se o mouse está sobre o sidebar
 * @returns Largura em pixels
 */
export function getSidebarWidth(
  sidebarState: SidebarState,
  isHovering: boolean
): number {
  if (sidebarState === "hidden") {
    return SIDEBAR_WIDTHS.hidden;
  }

  // Quando collapsed e hovering, expande durante o hover
  if (sidebarState === "collapsed" && isHovering) {
    return SIDEBAR_WIDTHS.expanded;
  }

  return SIDEBAR_WIDTHS[sidebarState];
}

/**
 * Calcula a margem do conteúdo principal SEM considerar hover.
 * 
 * Usado pelo AppShell para definir marginLeft. O hover da sidebar
 * NÃO deve causar reflow no conteúdo principal - a sidebar expande
 * visualmente "por cima" do conteúdo quando em hover.
 * 
 * @param sidebarState - Estado base do sidebar (sem hover)
 * @returns Margem em pixels
 */
export function getContentMargin(sidebarState: SidebarState): number {
  return SIDEBAR_WIDTHS[sidebarState];
}

/**
 * Determina se labels devem ser exibidos
 * 
 * @param sidebarState - Estado atual do sidebar
 * @param isHovering - Se o mouse está sobre o sidebar
 * @returns true se labels devem ser mostrados
 */
export function shouldShowLabels(
  sidebarState: SidebarState,
  isHovering: boolean
): boolean {
  return sidebarState === "expanded" || (sidebarState === "collapsed" && isHovering);
}

// ============================================================================
// USER INITIALS
// ============================================================================

/**
 * Extrai iniciais do nome ou email do usuário
 * 
 * @param name - Nome do usuário (opcional)
 * @param email - Email do usuário (fallback)
 * @returns 2 caracteres de iniciais em maiúsculas
 */
export function getInitials(
  name: string | null | undefined,
  email?: string | null
): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return "??";
}

// ============================================================================
// STORAGE
// ============================================================================

/**
 * Valida e retorna estado do sidebar do localStorage
 * 
 * @param storageKey - Chave do localStorage
 * @param defaultState - Estado padrão se inválido
 * @returns Estado válido do sidebar
 */
export function getStoredSidebarState(
  storageKey: string,
  defaultState: SidebarState = "collapsed"
): SidebarState {
  if (typeof window === "undefined") {
    return defaultState;
  }

  const stored = localStorage.getItem(storageKey);

  if (stored === "hidden" || stored === "collapsed" || stored === "expanded") {
    return stored;
  }

  return defaultState;
}

/**
 * Persiste estado do sidebar no localStorage
 * 
 * @param storageKey - Chave do localStorage
 * @param state - Estado a persistir
 */
export function saveSidebarState(
  storageKey: string,
  state: SidebarState
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey, state);
}
