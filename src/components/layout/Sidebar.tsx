// src/components/layout/Sidebar.tsx

import { useMemo, useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePermissions } from "@/hooks/usePermissions";
import { NavContent, buildNavItems, hasActiveChild } from "./sidebar";
import type { NavItemType } from "./sidebar";

// ============================================================================
// INTERFACE
// ============================================================================

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
  onExpandChange?: (expanded: boolean) => void;
}

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Sidebar principal da aplicação.
 * 
 * - Desktop: Sidebar colapsável que expande no hover
 * - Mobile: Sheet deslizante
 * 
 * Refatorado para seguir RISE ARCHITECT PROTOCOL (< 300 linhas)
 */
export function Sidebar({ mobileOpen = false, setMobileOpen, onExpandChange }: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const initializedRef = useRef(false);
  const location = useLocation();
  const { canAccessAdminPanel, role, canHaveAffiliates } = usePermissions();
  const isOwner = role === "owner";

  // Constrói itens de navegação baseado nas permissões
  const navItems = useMemo(
    () => buildNavItems({ canAccessAdminPanel, isOwner, canHaveAffiliates }),
    [canAccessAdminPanel, isOwner, canHaveAffiliates]
  );

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

  // Handlers de hover
  const handleMouseEnter = () => {
    setIsHovered(true);
    onExpandChange?.(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onExpandChange?.(false);
  };

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
    isHovered,
  };

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
          width: isHovered ? '260px' : '64px',
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
