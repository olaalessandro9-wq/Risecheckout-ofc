/**
 * Navigation Types - Sistema de Tipos Discriminados Type-Safe
 * 
 * Este arquivo define TODOS os tipos do sistema de navegação usando
 * discriminated unions para garantir type-safety absoluto sem non-null assertions.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Zero DT, Zero 'any'
 */

import type { LucideIcon } from "lucide-react";

// ============================================================================
// NAV ITEM VARIANTS (DISCRIMINATED UNION)
// ============================================================================

/**
 * Variante para item de navegação que aponta para uma rota interna
 */
export interface NavItemRouteVariant {
  readonly type: "route";
  readonly path: string;
  readonly exact?: boolean;
}

/**
 * Variante para item de navegação que aponta para link externo
 */
export interface NavItemExternalVariant {
  readonly type: "external";
  readonly url: string;
}

/**
 * Variante para item de navegação que contém sub-itens (grupo expansível)
 */
export interface NavItemGroupVariant {
  readonly type: "group";
  readonly children: NavItemConfig[];
}

/**
 * Union type de todas as variantes possíveis
 * Usar switch/if com type garante type-safety
 */
export type NavItemVariant =
  | NavItemRouteVariant
  | NavItemExternalVariant
  | NavItemGroupVariant;

// ============================================================================
// NAV ITEM CONFIG
// ============================================================================

/**
 * Configuração de permissões para um item de navegação
 */
export interface NavItemPermissions {
  /** Requer role de admin ou owner para visualizar */
  readonly requiresAdmin?: boolean;
  /** true = apenas owner vê, false = apenas NÃO-owner vê */
  readonly requiresOwner?: boolean;
  /** Requer permissão específica */
  readonly requiresPermission?: "canHaveAffiliates" | "canAccessAdminPanel";
}

/**
 * Configuração completa de um item de navegação
 */
export interface NavItemConfig {
  /** ID único do item (usado para keys e estado de menus) */
  readonly id: string;
  /** Label visível para o usuário */
  readonly label: string;
  /** Ícone Lucide do item */
  readonly icon: LucideIcon;
  /** Variante que determina comportamento (route/external/group) */
  readonly variant: NavItemVariant;
  /** Permissões necessárias para visualizar este item */
  readonly permissions?: NavItemPermissions;
}

// ============================================================================
// SIDEBAR STATE
// ============================================================================

/**
 * Estados possíveis do Sidebar
 * - hidden: Completamente oculto (0px)
 * - collapsed: Apenas ícones visíveis (80px)
 * - expanded: Ícones + labels visíveis (280px)
 */
export type SidebarState = "hidden" | "collapsed" | "expanded";

/**
 * Larguras correspondentes a cada estado do sidebar (em pixels)
 */
export const SIDEBAR_WIDTHS: Readonly<Record<SidebarState, number>> = {
  hidden: 0,
  collapsed: 80,
  expanded: 280,
} as const;

/**
 * Chave para persistência do estado no localStorage
 */
export const SIDEBAR_STORAGE_KEY = "rise-sidebar-state" as const;

// ============================================================================
// NAVIGATION STATE (REDUCER)
// ============================================================================

/**
 * Estado completo da navegação gerenciado pelo reducer
 */
export interface NavigationState {
  /** Estado atual do sidebar */
  readonly sidebarState: SidebarState;
  /** Se o mouse está sobre o sidebar (hover temporário) */
  readonly isHovering: boolean;
  /** Se o menu mobile está aberto */
  readonly mobileOpen: boolean;
  /** IDs dos grupos atualmente expandidos */
  readonly expandedGroups: ReadonlySet<string>;
}

/**
 * Ciclo de estados para toggle do sidebar
 */
export const SIDEBAR_STATE_CYCLE: Readonly<Record<SidebarState, SidebarState>> = {
  hidden: "collapsed",
  collapsed: "expanded",
  expanded: "hidden",
} as const;
