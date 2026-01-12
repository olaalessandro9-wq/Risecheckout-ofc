// src/components/layout/Sidebar.tsx

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePermissions } from "@/hooks/usePermissions";
import { NavContent, buildNavItems, hasActiveChild } from "./sidebar";
import type { NavItemType } from "./sidebar";
import { 
  type SidebarState, 
  SIDEBAR_WIDTHS, 
  SIDEBAR_STORAGE_KEY 
} from "./sidebar/types";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Tempo para o menu fechar antes do sidebar colapsar (ms) */
const MENU_CLOSE_DELAY = 250;

// ============================================================================
// INTERFACE
// ============================================================================

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
  /** Estado atual do sidebar (controlado pelo AppShell) */
  sidebarState: SidebarState;
  /** Callback para mudar estado do sidebar */
  onStateChange: (state: SidebarState) => void;
  /** Callback para notificar mudanças de hover */
  onHoverChange?: (isHovering: boolean) => void;
}

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Sidebar principal da aplicação.
 * 
 * - Desktop: Sidebar com 3 estados (hidden/collapsed/expanded)
 * - Mobile: Sheet deslizante
 * - Animação em cascata: menus fecham antes do sidebar colapsar
 * - Hover expande temporariamente quando colapsado
 * 
 * Refatorado para seguir RISE ARCHITECT PROTOCOL (< 300 linhas)
 */
export function Sidebar({ 
  mobileOpen = false, 
  setMobileOpen, 
  sidebarState,
  onStateChange,
  onHoverChange,
}: SidebarProps) {
  // Hover temporário (apenas quando collapsed)
  const [isHovering, setIsHovering] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const initializedRef = useRef(false);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const location = useLocation();
  const { canAccessAdminPanel, role, canHaveAffiliates } = usePermissions();
  const isOwner = role === "owner";

  // Constrói itens de navegação baseado nas permissões
  const navItems = useMemo(
    () => buildNavItems({ canAccessAdminPanel, isOwner, canHaveAffiliates }),
    [canAccessAdminPanel, isOwner, canHaveAffiliates]
  );

  // Calcula se deve mostrar labels
  const showLabels = sidebarState === 'expanded' || (sidebarState === 'collapsed' && isHovering);

  // Calcula largura atual
  const currentWidth = useMemo(() => {
    if (sidebarState === 'hidden') return SIDEBAR_WIDTHS.hidden;
    if (sidebarState === 'collapsed' && isHovering) return SIDEBAR_WIDTHS.expanded;
    return SIDEBAR_WIDTHS[sidebarState];
  }, [sidebarState, isHovering]);

  // Inicializa menus com filhos ativos na primeira renderização
  useEffect(() => {
    if (initializedRef.current) return;
    
    const initialOpenMenus: Record<string, boolean> = {};
    navItems.forEach((item) => {
      if (item.children && hasActiveChild(location.pathname, item.children)) {
        initialOpenMenus[item.label] = true;
      }
    });
    
    if (Object.keys(initialOpenMenus).length > 0) {
      setOpenMenus(initialOpenMenus);
    }
    initializedRef.current = true;
  }, [navItems, location.pathname]);

  // Cleanup do timeout no unmount
  useEffect(() => {
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);

  // Fecha todos os menus abertos
  const closeAllMenus = useCallback(() => {
    setOpenMenus({});
  }, []);

  // Handler de entrada do mouse - hover temporário
  const handleMouseEnter = useCallback(() => {
    if (sidebarState !== 'collapsed') return;
    
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    setIsHovering(true);
    onHoverChange?.(true);
  }, [sidebarState, onHoverChange]);

  // Handler de saída do mouse - animação em cascata
  const handleMouseLeave = useCallback(() => {
    if (sidebarState !== 'collapsed') return;
    
    const hasOpenMenu = Object.values(openMenus).some(Boolean);

    if (hasOpenMenu) {
      // Primeiro fecha os menus (animação de 200ms no Collapsible)
      closeAllMenus();

      // Depois remove hover (aguarda menu fechar)
      collapseTimeoutRef.current = setTimeout(() => {
        setIsHovering(false);
        onHoverChange?.(false);
        collapseTimeoutRef.current = null;
      }, MENU_CLOSE_DELAY);
    } else {
      // Sem menus abertos, remove hover imediatamente
      setIsHovering(false);
      onHoverChange?.(false);
    }
  }, [sidebarState, openMenus, closeAllMenus, onHoverChange]);

  // Toggle de menu expansível
  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // Respeita sempre o toggle do usuário
  const isMenuOpen = (item: NavItemType): boolean => {
    return openMenus[item.label] ?? false;
  };

  // Handler para fechar mobile sidebar ao navegar
  const handleMobileNavigate = () => {
    setMobileOpen?.(false);
  };

  // Props compartilhados para NavContent
  const navContentProps = {
    navItems,
    openMenus,
    toggleMenu,
    isMenuOpen,
    isHovered: showLabels,
  };

  // Não renderiza sidebar hidden no desktop
  if (sidebarState === 'hidden') {
    return (
      <>
        {/* Mobile Sidebar (Sheet) - sempre disponível */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-[280px] border-r border-border/40 bg-background/95 backdrop-blur-xl">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu de Navegação</SheetTitle>
            </SheetHeader>
            <NavContent {...navContentProps} fullWidth={true} onNavigate={handleMobileNavigate} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

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
        <NavContent {...navContentProps} fullWidth={false} />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[280px] border-r border-border/40 bg-background/95 backdrop-blur-xl">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu de Navegação</SheetTitle>
          </SheetHeader>
          <NavContent {...navContentProps} fullWidth={true} onNavigate={handleMobileNavigate} />
        </SheetContent>
      </Sheet>
    </>
  );
}
