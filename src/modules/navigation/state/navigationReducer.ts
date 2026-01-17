/**
 * Navigation Reducer - Single Source of Truth para Estado de Navegação
 * 
 * Este reducer centraliza TODA mutação de estado da navegação,
 * eliminando useState distribuídos e garantindo previsibilidade.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Reducer como SSoT
 */

import type { NavigationState, SidebarState } from "../types/navigation.types";
import { SIDEBAR_STATE_CYCLE } from "../types/navigation.types";

// ============================================================================
// ACTIONS (DISCRIMINATED UNION)
// ============================================================================

export type NavigationAction =
  | { readonly type: "SET_SIDEBAR_STATE"; readonly state: SidebarState }
  | { readonly type: "CYCLE_SIDEBAR_STATE" }
  | { readonly type: "SET_HOVERING"; readonly isHovering: boolean }
  | { readonly type: "SET_MOBILE_OPEN"; readonly isOpen: boolean }
  | { readonly type: "TOGGLE_GROUP"; readonly groupId: string }
  | { readonly type: "EXPAND_GROUP"; readonly groupId: string }
  | { readonly type: "COLLAPSE_GROUP"; readonly groupId: string }
  | { readonly type: "COLLAPSE_ALL_GROUPS" }
  | { readonly type: "INITIALIZE_ACTIVE_GROUPS"; readonly activeGroupIds: readonly string[] }
  | { readonly type: "RESTORE_FROM_STORAGE"; readonly sidebarState: SidebarState };

// ============================================================================
// INITIAL STATE
// ============================================================================

export const INITIAL_NAVIGATION_STATE: NavigationState = {
  sidebarState: "collapsed",
  isHovering: false,
  mobileOpen: false,
  expandedGroups: new Set(),
};

// ============================================================================
// ACTION HANDLERS
// ============================================================================

function handleSetSidebarState(
  state: NavigationState,
  newSidebarState: SidebarState
): NavigationState {
  if (state.sidebarState === newSidebarState) return state;
  return { ...state, sidebarState: newSidebarState };
}

function handleCycleSidebarState(state: NavigationState): NavigationState {
  const nextState = SIDEBAR_STATE_CYCLE[state.sidebarState];
  return { ...state, sidebarState: nextState };
}

function handleSetHovering(
  state: NavigationState,
  isHovering: boolean
): NavigationState {
  if (state.isHovering === isHovering) return state;
  return { ...state, isHovering };
}

function handleSetMobileOpen(
  state: NavigationState,
  isOpen: boolean
): NavigationState {
  if (state.mobileOpen === isOpen) return state;
  return { ...state, mobileOpen: isOpen };
}

function handleToggleGroup(
  state: NavigationState,
  groupId: string
): NavigationState {
  const newExpandedGroups = new Set(state.expandedGroups);
  
  if (newExpandedGroups.has(groupId)) {
    newExpandedGroups.delete(groupId);
  } else {
    newExpandedGroups.add(groupId);
  }
  
  return { ...state, expandedGroups: newExpandedGroups };
}

function handleExpandGroup(
  state: NavigationState,
  groupId: string
): NavigationState {
  if (state.expandedGroups.has(groupId)) return state;
  
  const newExpandedGroups = new Set(state.expandedGroups);
  newExpandedGroups.add(groupId);
  
  return { ...state, expandedGroups: newExpandedGroups };
}

function handleCollapseGroup(
  state: NavigationState,
  groupId: string
): NavigationState {
  if (!state.expandedGroups.has(groupId)) return state;
  
  const newExpandedGroups = new Set(state.expandedGroups);
  newExpandedGroups.delete(groupId);
  
  return { ...state, expandedGroups: newExpandedGroups };
}

function handleCollapseAllGroups(state: NavigationState): NavigationState {
  if (state.expandedGroups.size === 0) return state;
  return { ...state, expandedGroups: new Set() };
}

function handleInitializeActiveGroups(
  state: NavigationState,
  activeGroupIds: readonly string[]
): NavigationState {
  if (activeGroupIds.length === 0) return state;
  
  const newExpandedGroups = new Set(state.expandedGroups);
  activeGroupIds.forEach((id) => newExpandedGroups.add(id));
  
  return { ...state, expandedGroups: newExpandedGroups };
}

function handleRestoreFromStorage(
  state: NavigationState,
  sidebarState: SidebarState
): NavigationState {
  return { ...state, sidebarState };
}

// ============================================================================
// REDUCER
// ============================================================================

export function navigationReducer(
  state: NavigationState,
  action: NavigationAction
): NavigationState {
  switch (action.type) {
    case "SET_SIDEBAR_STATE":
      return handleSetSidebarState(state, action.state);

    case "CYCLE_SIDEBAR_STATE":
      return handleCycleSidebarState(state);

    case "SET_HOVERING":
      return handleSetHovering(state, action.isHovering);

    case "SET_MOBILE_OPEN":
      return handleSetMobileOpen(state, action.isOpen);

    case "TOGGLE_GROUP":
      return handleToggleGroup(state, action.groupId);

    case "EXPAND_GROUP":
      return handleExpandGroup(state, action.groupId);

    case "COLLAPSE_GROUP":
      return handleCollapseGroup(state, action.groupId);

    case "COLLAPSE_ALL_GROUPS":
      return handleCollapseAllGroups(state);

    case "INITIALIZE_ACTIVE_GROUPS":
      return handleInitializeActiveGroups(state, action.activeGroupIds);

    case "RESTORE_FROM_STORAGE":
      return handleRestoreFromStorage(state, action.sidebarState);

    default: {
      // Exhaustiveness check - TypeScript error if case missing
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
