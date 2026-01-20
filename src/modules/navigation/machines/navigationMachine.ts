/**
 * Navigation State Machine
 * 
 * @module navigation/machines
 * @version RISE V3 Compliant - XState 10.0/10
 * 
 * State Machine XState v5 que gerencia TODO o estado de navegação.
 * Elimina estados impossíveis e garante transições previsíveis.
 */

import { setup } from "xstate";
import {
  type NavigationMachineContext,
  type NavigationMachineEvent,
  createInitialNavigationContext,
} from "./navigationMachine.types";
import {
  isCollapsed,
  hasExpandedGroups,
  isNotCollapsed,
} from "./navigationMachine.guards";
import {
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

// ============================================================================
// MACHINE DEFINITION
// ============================================================================

/**
 * Navigation State Machine
 * 
 * Estados:
 * - idle: Estado inicial, aguardando restauração do localStorage
 * - ready: Estado operacional após inicialização
 * 
 * O estado do sidebar (hidden/collapsed/expanded) é gerenciado via context,
 * não via estados separados, pois as transições são diretas e não condicionais.
 */
export const navigationMachine = setup({
  types: {
    context: {} as NavigationMachineContext,
    events: {} as NavigationMachineEvent,
  },
  guards: {
    isCollapsed: ({ context }) => isCollapsed(context),
    isNotCollapsed: ({ context }) => isNotCollapsed(context),
    hasExpandedGroups: ({ context }) => hasExpandedGroups(context),
  },
  actions: {
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
  },
  delays: {
    MENU_CLOSE_DELAY: 250,
  },
}).createMachine({
  id: "navigation",
  context: createInitialNavigationContext,
  initial: "idle",
  states: {
    idle: {
      description: "Estado inicial, aguardando restauração do localStorage",
      on: {
        RESTORE_FROM_STORAGE: {
          target: "ready",
          actions: "restoreFromStorage",
        },
      },
      // Auto-transição para ready após timeout (caso não haja localStorage)
      after: {
        100: "ready",
      },
    },
    ready: {
      description: "Estado operacional após inicialização",
      on: {
        // Sidebar state management
        CYCLE_SIDEBAR: {
          actions: "cycleSidebar",
        },
        SET_SIDEBAR: {
          actions: "setSidebar",
        },
        
        // Hover management (só funciona quando colapsado)
        MOUSE_ENTER: {
          guard: "isCollapsed",
          actions: "setHoveringTrue",
        },
        MOUSE_LEAVE: [
          // Se tem grupos expandidos, primeiro fecha eles, depois remove hover com delay
          {
            guard: ({ context }) => isCollapsed(context) && hasExpandedGroups(context),
            actions: ["collapseAllGroups"],
            target: ".closingMenus",
          },
          // Sem grupos, remove hover imediatamente
          {
            guard: "isCollapsed",
            actions: "setHoveringFalse",
          },
        ],
        
        // Mobile menu
        SET_MOBILE_OPEN: {
          actions: "setMobileOpen",
        },
        
        // Group management
        TOGGLE_GROUP: {
          actions: "toggleGroup",
        },
        EXPAND_GROUP: {
          actions: "expandGroup",
        },
        COLLAPSE_GROUP: {
          actions: "collapseGroup",
        },
        COLLAPSE_ALL_GROUPS: {
          actions: "collapseAllGroups",
        },
        INIT_ACTIVE_GROUPS: {
          actions: "initActiveGroups",
        },
      },
      initial: "active",
      states: {
        active: {
          description: "Estado padrão, sidebar operacional",
        },
        closingMenus: {
          description: "Aguardando animação de fechamento dos menus",
          after: {
            MENU_CLOSE_DELAY: {
              target: "active",
              actions: "setHoveringFalse",
            },
          },
        },
      },
    },
  },
});

export type NavigationMachine = typeof navigationMachine;
