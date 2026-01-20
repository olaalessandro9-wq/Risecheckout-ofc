/**
 * Navigation Machine Actions
 * 
 * @module navigation/machines
 * @version RISE V3 Compliant - XState 10.0/10
 * 
 * Actions (mutações de contexto) para a Navigation State Machine.
 */

import { assign } from "xstate";
import { SIDEBAR_STATE_CYCLE, type SidebarState } from "../types/navigation.types";
import type { NavigationMachineContext, NavigationMachineEvent } from "./navigationMachine.types";

// ============================================================================
// SIDEBAR ACTIONS
// ============================================================================

/**
 * Restaura estado do localStorage
 */
export const restoreFromStorage = assign<
  NavigationMachineContext,
  Extract<NavigationMachineEvent, { type: "RESTORE_FROM_STORAGE" }>,
  unknown,
  NavigationMachineEvent,
  never
>({
  sidebarState: ({ event }) => event.sidebarState,
});

/**
 * Cicla entre estados do sidebar (hidden → collapsed → expanded → hidden)
 */
export const cycleSidebar = assign<
  NavigationMachineContext,
  Extract<NavigationMachineEvent, { type: "CYCLE_SIDEBAR" }>,
  unknown,
  NavigationMachineEvent,
  never
>({
  sidebarState: ({ context }) => SIDEBAR_STATE_CYCLE[context.sidebarState],
});

/**
 * Define estado específico do sidebar
 */
export const setSidebar = assign<
  NavigationMachineContext,
  Extract<NavigationMachineEvent, { type: "SET_SIDEBAR" }>,
  unknown,
  NavigationMachineEvent,
  never
>({
  sidebarState: ({ event }) => event.state,
});

// ============================================================================
// HOVER ACTIONS
// ============================================================================

/**
 * Ativa hover (mouse entrou no sidebar)
 */
export const setHoveringTrue = assign<
  NavigationMachineContext,
  NavigationMachineEvent,
  unknown,
  NavigationMachineEvent,
  never
>({
  isHovering: true,
});

/**
 * Desativa hover (mouse saiu do sidebar)
 */
export const setHoveringFalse = assign<
  NavigationMachineContext,
  NavigationMachineEvent,
  unknown,
  NavigationMachineEvent,
  never
>({
  isHovering: false,
});

// ============================================================================
// MOBILE ACTIONS
// ============================================================================

/**
 * Define estado do menu mobile
 */
export const setMobileOpen = assign<
  NavigationMachineContext,
  Extract<NavigationMachineEvent, { type: "SET_MOBILE_OPEN" }>,
  unknown,
  NavigationMachineEvent,
  never
>({
  mobileOpen: ({ event }) => event.isOpen,
});

// ============================================================================
// GROUP ACTIONS
// ============================================================================

/**
 * Toggle de um grupo (expande se colapsado, colapsa se expandido)
 */
export const toggleGroup = assign<
  NavigationMachineContext,
  Extract<NavigationMachineEvent, { type: "TOGGLE_GROUP" }>,
  unknown,
  NavigationMachineEvent,
  never
>({
  expandedGroups: ({ context, event }) => {
    const newGroups = new Set(context.expandedGroups);
    if (newGroups.has(event.groupId)) {
      newGroups.delete(event.groupId);
    } else {
      newGroups.add(event.groupId);
    }
    return newGroups;
  },
});

/**
 * Expande um grupo específico
 */
export const expandGroup = assign<
  NavigationMachineContext,
  Extract<NavigationMachineEvent, { type: "EXPAND_GROUP" }>,
  unknown,
  NavigationMachineEvent,
  never
>({
  expandedGroups: ({ context, event }) => {
    const newGroups = new Set(context.expandedGroups);
    newGroups.add(event.groupId);
    return newGroups;
  },
});

/**
 * Colapsa um grupo específico
 */
export const collapseGroup = assign<
  NavigationMachineContext,
  Extract<NavigationMachineEvent, { type: "COLLAPSE_GROUP" }>,
  unknown,
  NavigationMachineEvent,
  never
>({
  expandedGroups: ({ context, event }) => {
    const newGroups = new Set(context.expandedGroups);
    newGroups.delete(event.groupId);
    return newGroups;
  },
});

/**
 * Colapsa todos os grupos
 */
export const collapseAllGroups = assign<
  NavigationMachineContext,
  NavigationMachineEvent,
  unknown,
  NavigationMachineEvent,
  never
>({
  expandedGroups: () => new Set<string>(),
});

/**
 * Inicializa grupos ativos baseado na rota atual
 */
export const initActiveGroups = assign<
  NavigationMachineContext,
  Extract<NavigationMachineEvent, { type: "INIT_ACTIVE_GROUPS" }>,
  unknown,
  NavigationMachineEvent,
  never
>({
  expandedGroups: ({ context, event }) => {
    const newGroups = new Set(context.expandedGroups);
    event.groupIds.forEach((id) => newGroups.add(id));
    return newGroups;
  },
});
