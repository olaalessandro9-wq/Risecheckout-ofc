/**
 * Navigation Machines - Barrel Export
 * 
 * @module navigation/machines
 * @version RISE V3 Compliant - XState 10.0/10
 */

export { navigationMachine } from "./navigationMachine";
export type { NavigationMachine } from "./navigationMachine";

export {
  type NavigationMachineContext,
  type NavigationMachineEvent,
  createInitialNavigationContext,
} from "./navigationMachine.types";

export {
  isCollapsed,
  hasExpandedGroups,
  isGroupExpanded,
  isHovering,
  isNotCollapsed,
} from "./navigationMachine.guards";

export {
  restoreFromStorage,
  cycleSidebar,
  setSidebar,
  setHoveringTrue,
  setHoveringFalse,
  setMobileOpen,
  toggleGroup,
  expandGroup,
  collapseGroup,
  collapseAllGroups,
  initActiveGroups,
} from "./navigationMachine.actions";
