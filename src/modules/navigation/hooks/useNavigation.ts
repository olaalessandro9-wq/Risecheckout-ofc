/**
 * useNavigation - Hook Principal de Navegação
 * 
 * Centraliza TODO o estado e lógica de navegação:
 * - State Machine XState como Single Source of Truth
 * - Persistência localStorage automática
 * - Filtro de permissões
 * - Inicialização de grupos ativos
 * - Actions memoizadas
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - XState 10.0/10
 */

import { useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useMachine } from "@xstate/react";
import { usePermissions } from "@/hooks/usePermissions";
import { useSidebarTransform } from "@/hooks/useSidebarTransform";
import { navigationMachine } from "../machines/navigationMachine";
import type { NavigationMachineEvent } from "../machines/navigationMachine.types";
import {
  type NavigationState,
  type NavItemConfig,
  SIDEBAR_STORAGE_KEY,
} from "../types/navigation.types";
import { NAVIGATION_CONFIG } from "../config/navigationConfig";
import {
  findActiveGroups,
  getSidebarWidth,
  shouldShowLabels,
  getStoredSidebarState,
  saveSidebarState,
} from "../utils/navigationHelpers";
import {
  filterByPermissions,
  extractNavigationPermissions,
} from "../utils/permissionFilters";

// ============================================================================
// RETURN TYPE
// ============================================================================

export interface UseNavigationReturn {
  // Estado
  state: NavigationState;

  // Valores derivados
  showLabels: boolean;
  currentWidth: number;
  visibleItems: readonly NavItemConfig[];

  // Compositor Transform (Full Compositor Architecture)
  /** translateX value for sidebar transform animation */
  translateX: number;
  /** Visible width for main content marginLeft */
  visibleWidth: number;
  /** Fixed sidebar width (always SIDEBAR_WIDTHS.expanded) */
  fixedWidth: number;

  // Actions para Sidebar
  cycleSidebarState: () => void;
  setMobileOpen: (open: boolean) => void;
  handleMobileNavigate: () => void;

  // Actions para Grupos
  toggleGroup: (groupId: string) => void;
  isGroupExpanded: (groupId: string) => boolean;

  // Actions para Hover
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;

  // Dispatch direto (para casos avançados)
  dispatch: (event: NavigationMachineEvent) => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useNavigation(): UseNavigationReturn {
  const location = useLocation();
  const permissions = usePermissions();
  const initializedRef = useRef(false);

  // ========================================
  // STATE MACHINE
  // ========================================

  const [machineState, send] = useMachine(navigationMachine);

  // Mapear context da máquina para NavigationState
  const state: NavigationState = useMemo(() => ({
    sidebarState: machineState.context.sidebarState,
    isHovering: machineState.context.isHovering,
    mobileOpen: machineState.context.mobileOpen,
    expandedGroups: machineState.context.expandedGroups,
  }), [machineState.context]);

  // ========================================
  // INICIALIZAÇÃO (localStorage)
  // ========================================

  // Restaura estado do localStorage na montagem
  useEffect(() => {
    const storedState = getStoredSidebarState(SIDEBAR_STORAGE_KEY);
    if (storedState !== state.sidebarState) {
      send({ type: "RESTORE_FROM_STORAGE", sidebarState: storedState });
    }
    // Executar apenas uma vez na montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persiste mudanças no localStorage
  useEffect(() => {
    saveSidebarState(SIDEBAR_STORAGE_KEY, state.sidebarState);
  }, [state.sidebarState]);

  // ========================================
  // FILTRO DE PERMISSÕES
  // ========================================

  const visibleItems = useMemo(() => {
    const navPermissions = extractNavigationPermissions(permissions);
    return filterByPermissions(NAVIGATION_CONFIG, navPermissions);
  }, [permissions]);

  // ========================================
  // INICIALIZAÇÃO DE GRUPOS ATIVOS
  // ========================================

  // Expande grupos que contêm a rota ativa (apenas uma vez)
  useEffect(() => {
    if (initializedRef.current) return;

    const activeGroups = findActiveGroups(visibleItems, location.pathname);
    if (activeGroups.length > 0) {
      send({ type: "INIT_ACTIVE_GROUPS", groupIds: activeGroups });
    }
    initializedRef.current = true;
  }, [visibleItems, location.pathname, send]);

  // ========================================
  // VALORES DERIVADOS
  // ========================================

  const showLabels = useMemo(
    () => shouldShowLabels(state.sidebarState, state.isHovering),
    [state.sidebarState, state.isHovering]
  );

  const currentWidth = useMemo(
    () => getSidebarWidth(state.sidebarState, state.isHovering),
    [state.sidebarState, state.isHovering]
  );

  // Compositor Transform values
  const sidebarTransform = useSidebarTransform(state.sidebarState, state.isHovering);

  // ========================================
  // ACTIONS MEMOIZADAS
  // ========================================

  const cycleSidebarState = useCallback(() => {
    send({ type: "CYCLE_SIDEBAR" });
  }, [send]);

  const setMobileOpen = useCallback((open: boolean) => {
    send({ type: "SET_MOBILE_OPEN", isOpen: open });
  }, [send]);

  const handleMobileNavigate = useCallback(() => {
    send({ type: "SET_MOBILE_OPEN", isOpen: false });
  }, [send]);

  const toggleGroup = useCallback((groupId: string) => {
    send({ type: "TOGGLE_GROUP", groupId });
  }, [send]);

  const isGroupExpanded = useCallback(
    (groupId: string) => state.expandedGroups.has(groupId),
    [state.expandedGroups]
  );

  // ========================================
  // HOVER HANDLERS
  // ========================================

  const handleMouseEnter = useCallback(() => {
    send({ type: "MOUSE_ENTER" });
  }, [send]);

  const handleMouseLeave = useCallback(() => {
    send({ type: "MOUSE_LEAVE" });
  }, [send]);

  // ========================================
  // DISPATCH WRAPPER
  // ========================================

  const dispatch = useCallback((event: NavigationMachineEvent) => {
    send(event);
  }, [send]);

  // ========================================
  // RETURN
  // ========================================

  return {
    state,
    showLabels,
    currentWidth,
    visibleItems,
    translateX: sidebarTransform.translateX,
    visibleWidth: sidebarTransform.visibleWidth,
    fixedWidth: sidebarTransform.fixedWidth,
    cycleSidebarState,
    setMobileOpen,
    handleMobileNavigate,
    toggleGroup,
    isGroupExpanded,
    handleMouseEnter,
    handleMouseLeave,
    dispatch,
  };
}
