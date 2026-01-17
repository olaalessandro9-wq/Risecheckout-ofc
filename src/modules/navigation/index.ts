/**
 * Navigation Module - Public API
 * 
 * Este é o ponto de entrada único para o módulo de navegação.
 * Exporta apenas o que é necessário para uso externo.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

// Types
export type {
  NavItemConfig,
  NavItemVariant,
  NavItemRouteVariant,
  NavItemExternalVariant,
  NavItemGroupVariant,
  NavItemPermissions,
  NavigationState,
  SidebarState,
} from "./types/navigation.types";

export {
  SIDEBAR_WIDTHS,
  SIDEBAR_STORAGE_KEY,
  SIDEBAR_STATE_CYCLE,
} from "./types/navigation.types";

// Config
export { NAVIGATION_CONFIG } from "./config/navigationConfig";

// State
export {
  navigationReducer,
  INITIAL_NAVIGATION_STATE,
} from "./state/navigationReducer";

export type { NavigationAction } from "./state/navigationReducer";

// Hooks
export { useNavigation } from "./hooks/useNavigation";
export type { UseNavigationReturn } from "./hooks/useNavigation";

// Components
export { Sidebar, SidebarContent, SidebarBrand, SidebarItem, SidebarGroup, SidebarFooter } from "./components/Sidebar";

// Utils
export {
  isActivePath,
  hasActiveChild,
  findActiveGroups,
  getSidebarWidth,
  shouldShowLabels,
  getInitials,
  getStoredSidebarState,
  saveSidebarState,
} from "./utils/navigationHelpers";

export {
  filterByPermissions,
  extractNavigationPermissions,
} from "./utils/permissionFilters";

export type { NavigationPermissions } from "./utils/permissionFilters";
