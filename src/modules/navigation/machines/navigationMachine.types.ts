/**
 * Navigation Machine Types
 * 
 * @module navigation/machines
 * @version RISE V3 Compliant - XState 10.0/10
 * 
 * Tipos TypeScript para a State Machine de navegação.
 */

import type { SidebarState } from "../types/navigation.types";

// ============================================================================
// MACHINE CONTEXT
// ============================================================================

/**
 * Contexto da Navigation State Machine
 */
export interface NavigationMachineContext {
  readonly sidebarState: SidebarState;
  readonly isHovering: boolean;
  readonly mobileOpen: boolean;
  readonly expandedGroups: Set<string>;
}

// ============================================================================
// MACHINE EVENTS (DISCRIMINATED UNION)
// ============================================================================

export type NavigationMachineEvent =
  | { readonly type: "RESTORE_FROM_STORAGE"; readonly sidebarState: SidebarState }
  | { readonly type: "CYCLE_SIDEBAR" }
  | { readonly type: "SET_SIDEBAR"; readonly state: SidebarState }
  | { readonly type: "MOUSE_ENTER" }
  | { readonly type: "MOUSE_LEAVE" }
  | { readonly type: "TOGGLE_GROUP"; readonly groupId: string }
  | { readonly type: "EXPAND_GROUP"; readonly groupId: string }
  | { readonly type: "COLLAPSE_GROUP"; readonly groupId: string }
  | { readonly type: "COLLAPSE_ALL_GROUPS" }
  | { readonly type: "SET_MOBILE_OPEN"; readonly isOpen: boolean }
  | { readonly type: "INIT_ACTIVE_GROUPS"; readonly groupIds: readonly string[] };

// ============================================================================
// INITIAL CONTEXT FACTORY
// ============================================================================

/**
 * Cria o contexto inicial da máquina
 */
export function createInitialNavigationContext(): NavigationMachineContext {
  return {
    sidebarState: "collapsed",
    isHovering: false,
    mobileOpen: false,
    expandedGroups: new Set(),
  };
}
