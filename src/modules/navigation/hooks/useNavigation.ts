/**
 * useNavigation - Hook Principal de Navegação
 * 
 * Centraliza TODO o estado e lógica de navegação:
 * - Reducer como Single Source of Truth
 * - Persistência localStorage automática
 * - Filtro de permissões
 * - Inicialização de grupos ativos
 * - Actions memoizadas
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Reducer + Hooks
 */

import { useReducer, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import {
  navigationReducer,
  INITIAL_NAVIGATION_STATE,
  type NavigationAction,
} from "../state/navigationReducer";
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
// CONSTANTS
// ============================================================================

/** Tempo para fechar menus antes de remover hover (ms) */
const MENU_CLOSE_DELAY = 250;

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
  dispatch: React.Dispatch<NavigationAction>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useNavigation(): UseNavigationReturn {
  const location = useLocation();
  const permissions = usePermissions();
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);

  // ========================================
  // REDUCER
  // ========================================

  const [state, dispatch] = useReducer(navigationReducer, INITIAL_NAVIGATION_STATE);

  // ========================================
  // INICIALIZAÇÃO (localStorage + grupos ativos)
  // ========================================

  // Restaura estado do localStorage na montagem
  useEffect(() => {
    const storedState = getStoredSidebarState(SIDEBAR_STORAGE_KEY);
    if (storedState !== state.sidebarState) {
      dispatch({ type: "RESTORE_FROM_STORAGE", sidebarState: storedState });
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
      dispatch({ type: "INITIALIZE_ACTIVE_GROUPS", activeGroupIds: activeGroups });
    }
    initializedRef.current = true;
  }, [visibleItems, location.pathname]);

  // ========================================
  // CLEANUP
  // ========================================

  useEffect(() => {
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);

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

  // ========================================
  // ACTIONS MEMOIZADAS
  // ========================================

  const cycleSidebarState = useCallback(() => {
    dispatch({ type: "CYCLE_SIDEBAR_STATE" });
  }, []);

  const setMobileOpen = useCallback((open: boolean) => {
    dispatch({ type: "SET_MOBILE_OPEN", isOpen: open });
  }, []);

  const handleMobileNavigate = useCallback(() => {
    dispatch({ type: "SET_MOBILE_OPEN", isOpen: false });
  }, []);

  const toggleGroup = useCallback((groupId: string) => {
    dispatch({ type: "TOGGLE_GROUP", groupId });
  }, []);

  const isGroupExpanded = useCallback(
    (groupId: string) => state.expandedGroups.has(groupId),
    [state.expandedGroups]
  );

  // ========================================
  // HOVER HANDLERS (com animação em cascata)
  // ========================================

  const handleMouseEnter = useCallback(() => {
    if (state.sidebarState !== "collapsed") return;

    // Cancela timeout de colapso se existir
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }

    dispatch({ type: "SET_HOVERING", isHovering: true });
  }, [state.sidebarState]);

  const handleMouseLeave = useCallback(() => {
    if (state.sidebarState !== "collapsed") return;

    const hasExpandedGroups = state.expandedGroups.size > 0;

    if (hasExpandedGroups) {
      // Primeiro fecha os menus
      dispatch({ type: "COLLAPSE_ALL_GROUPS" });

      // Depois remove hover (aguarda animação do menu fechar)
      collapseTimeoutRef.current = setTimeout(() => {
        dispatch({ type: "SET_HOVERING", isHovering: false });
        collapseTimeoutRef.current = null;
      }, MENU_CLOSE_DELAY);
    } else {
      // Sem menus abertos, remove hover imediatamente
      dispatch({ type: "SET_HOVERING", isHovering: false });
    }
  }, [state.sidebarState, state.expandedGroups.size]);

  // ========================================
  // RETURN
  // ========================================

  return {
    state,
    showLabels,
    currentWidth,
    visibleItems,
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
