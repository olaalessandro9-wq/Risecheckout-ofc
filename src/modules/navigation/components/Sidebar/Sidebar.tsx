/**
 * Sidebar - Container Principal do Sidebar
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10 (Memoização Cirúrgica)
 * 
 * Gerencia renderização desktop (aside) e mobile (Sheet).
 * Recebe dados do useNavigation hook.
 * 
 * React.memo previne re-renders durante background auth sync.
 */

import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SidebarContent } from "./SidebarContent";
import { SIDEBAR_WIDTHS } from "../../types/navigation.types";
import type { UseNavigationReturn } from "../../hooks/useNavigation";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Largura fixa do sidebar (sempre 280px no DOM, nunca muda) */
const SIDEBAR_FIXED_WIDTH = SIDEBAR_WIDTHS.expanded; // 280

// ============================================================================
// TYPES
// ============================================================================

interface SidebarProps {
  /** Retorno do hook useNavigation */
  navigation: UseNavigationReturn;
}

// ============================================================================
// COMPONENT (MEMOIZED)
// ============================================================================

export const Sidebar = memo(function Sidebar({ navigation }: SidebarProps) {
  const {
    state,
    showLabels,
    visibleItems,
    setMobileOpen,
    handleMobileNavigate,
    isGroupExpanded,
    toggleGroup,
    handleMouseEnter,
    handleMouseLeave,
  } = navigation;

  // Calcular translateX baseado no estado (COMPOSITOR-ONLY)
  const translateX = useMemo(() => {
    if (state.sidebarState === "hidden") {
      return -SIDEBAR_FIXED_WIDTH; // -280: esconde tudo
    }
    if (state.sidebarState === "collapsed" && !state.isHovering) {
      return -(SIDEBAR_FIXED_WIDTH - SIDEBAR_WIDTHS.collapsed); // -200: mostra 80px
    }
    return 0; // expanded ou collapsed+hovering: mostra tudo
  }, [state.sidebarState, state.isHovering]);

  // Props compartilhados para SidebarContent
  const contentProps = {
    items: visibleItems,
    showLabels,
    isGroupExpanded,
    toggleGroup,
  };

  // ========================================
  // MOBILE SIDEBAR (Sheet)
  // ========================================
  
  const mobileSidebar = (
    <Sheet open={state.mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent
        side="left"
        className="p-0 w-[280px] border-r border-border/40 bg-background"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Menu de Navegação</SheetTitle>
        </SheetHeader>
        <SidebarContent
          {...contentProps}
          fullWidth
          onNavigate={handleMobileNavigate}
        />
      </SheetContent>
    </Sheet>
  );

  // ========================================
  // HIDDEN STATE (apenas mobile disponível)
  // ========================================
  
  if (state.sidebarState === "hidden") {
    return <>{mobileSidebar}</>;
  }

  // ========================================
  // DESKTOP + MOBILE
  // ========================================

  return (
    <>
      {/* Desktop Sidebar - FULL COMPOSITOR: largura fixa, animação via transform */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "hidden md:flex fixed left-0 top-0 z-50 h-screen shrink-0 flex-col",
          "border-r border-border/40 bg-background",
          "transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        )}
        style={{
          width: `${SIDEBAR_FIXED_WIDTH}px`,
          transform: `translateX(${translateX}px)`,
        }}
      >
        <SidebarContent {...contentProps} />
      </aside>

      {/* Mobile Sidebar */}
      {mobileSidebar}
    </>
  );
});
