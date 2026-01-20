/**
 * Navigation Machine Guards
 * 
 * @module navigation/machines
 * @version RISE V3 Compliant - XState 10.0/10
 * 
 * Guards (condicionais) para transições da Navigation State Machine.
 */

import type { NavigationMachineContext, NavigationMachineEvent } from "./navigationMachine.types";

// ============================================================================
// GUARD FUNCTIONS
// ============================================================================

/**
 * Verifica se o sidebar está colapsado
 */
export function isCollapsed(context: NavigationMachineContext): boolean {
  return context.sidebarState === "collapsed";
}

/**
 * Verifica se tem grupos expandidos
 */
export function hasExpandedGroups(context: NavigationMachineContext): boolean {
  return context.expandedGroups.size > 0;
}

/**
 * Verifica se o grupo já está expandido
 */
export function isGroupExpanded(
  context: NavigationMachineContext,
  event: Extract<NavigationMachineEvent, { type: "TOGGLE_GROUP" | "EXPAND_GROUP" | "COLLAPSE_GROUP" }>
): boolean {
  return context.expandedGroups.has(event.groupId);
}

/**
 * Verifica se o hover está ativo
 */
export function isHovering(context: NavigationMachineContext): boolean {
  return context.isHovering;
}

/**
 * Verifica se o sidebar NÃO está colapsado
 */
export function isNotCollapsed(context: NavigationMachineContext): boolean {
  return context.sidebarState !== "collapsed";
}
