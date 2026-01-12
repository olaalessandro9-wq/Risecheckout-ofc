// src/components/layout/sidebar/NavContent.tsx

import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { UserFooter } from "../UserFooter";
import { NavItem } from "./NavItem";
import { NavItemGroup } from "./NavItemGroup";
import { isActivePath, hasActiveChild } from "./navUtils";
import type { NavContentProps, NavItem as NavItemType } from "./types";

/**
 * Componente que renderiza o conteúdo de navegação do sidebar
 */
export function NavContent({ 
  fullWidth = false, 
  isHovered,
  navItems,
  openMenus,
  toggleMenu,
  isMenuOpen,
  onNavigate,
}: NavContentProps) {
  const location = useLocation();
  const showLabels = fullWidth || isHovered;

  return (
    <div className="flex flex-col h-full">
      {/* Brand / Logo */}
      <div
        className={cn(
          "flex items-center border-b border-border/40 transition-all duration-300",
          fullWidth ? "h-20 px-6" : "h-[88px] justify-center"
        )}
      >
        <div className={cn(
          "flex items-center overflow-hidden transition-all duration-300",
          showLabels ? "gap-3" : "gap-0"
        )}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">
            R
          </div>
          {showLabels && (
            <span className="font-bold tracking-tight text-foreground whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
              RiseCheckout
            </span>
          )}
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 custom-scrollbar">
        <ul className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = item.to ? isActivePath(location.pathname, item.to) : false;
            const hasChildren = item.children && item.children.length > 0;
            const isOpen = hasChildren && isMenuOpen(item);
            const childActive = hasActiveChild(location.pathname, item.children);

            // Renderiza item com sub-menu
            if (hasChildren) {
              return (
                <NavItemGroup
                  key={item.label}
                  item={item}
                  showLabels={showLabels}
                  isOpen={isOpen}
                  childActive={childActive}
                  onToggle={() => toggleMenu(item.label)}
                  onNavigate={onNavigate}
                />
              );
            }

            // Renderiza item simples
            return (
              <NavItem
                key={item.label}
                item={item}
                showLabels={showLabels}
                isActive={isActive}
                onNavigate={onNavigate}
              />
            );
          })}
        </ul>
      </nav>

      <UserFooter isCollapsed={!showLabels} />
    </div>
  );
}
