/**
 * useSidebarTransform - Compositor-Only Sidebar Transform Calculator
 * 
 * Hook puro que calcula translateX e visibleWidth para cada estado da sidebar.
 * A sidebar SEMPRE tem width fixa (SIDEBAR_WIDTHS.expanded = 280px).
 * O deslocamento visual é feito via transform: translateX (compositor-only).
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Full Compositor Architecture
 */

import { useMemo } from "react";
import type { SidebarState } from "@/modules/navigation/types/navigation.types";
import { SIDEBAR_WIDTHS } from "@/modules/navigation/types/navigation.types";

// ============================================================================
// TYPES
// ============================================================================

export interface SidebarTransformResult {
  /** Valor de translateX em pixels (negativo = escondido à esquerda) */
  readonly translateX: number;
  /** Largura visível da sidebar (para marginLeft do conteúdo principal) */
  readonly visibleWidth: number;
  /** Largura fixa real da sidebar (sempre SIDEBAR_WIDTHS.expanded) */
  readonly fixedWidth: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const FIXED_WIDTH = SIDEBAR_WIDTHS.expanded; // 280px

/**
 * Mapa de translateX por estado.
 * hidden:    esconde tudo (-280px)
 * collapsed: esconde parcialmente (-(280-80) = -200px) 
 * expanded:  mostra tudo (0px)
 */
const TRANSLATE_X_MAP: Readonly<Record<SidebarState, number>> = {
  hidden: -FIXED_WIDTH,
  collapsed: -(FIXED_WIDTH - SIDEBAR_WIDTHS.collapsed),
  expanded: 0,
} as const;

// ============================================================================
// HOOK
// ============================================================================

/**
 * Calcula transform e largura visível da sidebar baseado no estado atual.
 * 
 * Quando hovering sobre collapsed, expande temporariamente (translateX = 0).
 * O visibleWidth mantém-se em collapsed (80px) durante hover para não
 * deslocar o conteúdo principal — apenas a sidebar se expande visualmente.
 */
export function useSidebarTransform(
  sidebarState: SidebarState,
  isHovering: boolean
): SidebarTransformResult {
  return useMemo(() => {
    // Hover em collapsed: sidebar expande visualmente mas conteúdo não se move
    const isHoverExpand = sidebarState === "collapsed" && isHovering;

    const translateX = isHoverExpand ? 0 : TRANSLATE_X_MAP[sidebarState];
    const visibleWidth = isHoverExpand
      ? SIDEBAR_WIDTHS.collapsed // Conteúdo permanece no lugar
      : SIDEBAR_WIDTHS[sidebarState];

    return {
      translateX,
      visibleWidth,
      fixedWidth: FIXED_WIDTH,
    };
  }, [sidebarState, isHovering]);
}
