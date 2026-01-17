/**
 * Sidebar - Container Principal do Sidebar
 * 
 * Gerencia renderização desktop (aside) e mobile (Sheet).
 * Recebe dados do useNavigation hook.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Componente Container
 */

import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SidebarContent } from "./SidebarContent";
import type { UseNavigationReturn } from "../../hooks/useNavigation";

// ============================================================================
// TYPES
// ============================================================================

interface SidebarProps {
  /** Retorno do hook useNavigation */
  navigation: UseNavigationReturn;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function Sidebar({ navigation }: SidebarProps) {
  const {
    state,
    showLabels,
    currentWidth,
    visibleItems,
    setMobileOpen,
    handleMobileNavigate,
    isGroupExpanded,
    toggleGroup,
    handleMouseEnter,
    handleMouseLeave,
  } = navigation;

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
        className="p-0 w-[280px] border-r border-border/40 bg-background/95 backdrop-blur-xl"
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
      {/* Desktop Sidebar */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "hidden md:flex fixed left-0 top-0 z-50 h-screen shrink-0 flex-col",
          "border-r border-border/40 bg-background/80 backdrop-blur-xl",
          "transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[width]"
        )}
        style={{
          width: `${currentWidth}px`,
        }}
      >
        <SidebarContent {...contentProps} />
      </aside>

      {/* Mobile Sidebar */}
      {mobileSidebar}
    </>
  );
}
