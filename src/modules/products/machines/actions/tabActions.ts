/**
 * Tab Actions
 * 
 * Actions relacionadas à navegação de tabs.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Single Responsibility
 * @module products/machines/actions
 */

import { assign } from "xstate";

// ============================================================================
// TAB ACTIONS
// ============================================================================

/**
 * Define tab ativa
 */
export const assignActiveTab = assign({
  activeTab: ({ event }) => {
    if (event.type !== "SET_TAB") return "general";
    return event.tab;
  },
});

/**
 * Define erros por tab
 */
export const assignTabErrors = assign({
  tabErrors: ({ event }) => {
    if (event.type !== "SET_TAB_ERRORS") return {};
    return event.errors;
  },
});

/**
 * Limpa erros de tabs
 */
export const clearTabErrors = assign({
  tabErrors: () => ({}),
});
