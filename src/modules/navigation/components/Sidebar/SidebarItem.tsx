/**
 * SidebarItem - Item de Navegação Simples
 * 
 * Renderiza um item de navegação sem sub-itens.
 * Suporta rotas internas (com GuardedLink) e links externos.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Componentes Type-Safe
 */

import { useLocation } from "react-router-dom";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { GuardedLink } from "@/components/navigation/GuardedLink";
import { isActivePath } from "../../utils/navigationHelpers";
import type { NavItemConfig } from "../../types/navigation.types";

// ============================================================================
// TYPES
// ============================================================================

interface SidebarItemProps {
  /** Configuração do item */
  item: NavItemConfig;
  /** Se labels devem ser exibidos */
  showLabels: boolean;
  /** Callback quando navegação ocorre (para fechar mobile) */
  onNavigate?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SidebarItem({ item, showLabels, onNavigate }: SidebarItemProps) {
  const location = useLocation();
  const Icon = item.icon;

  // Type-safe: só calcula isActive para rotas
  const isActive = useMemo(() => {
    if (item.variant.type !== "route") return false;
    return isActivePath(location.pathname, item.variant.path, item.variant.exact);
  }, [item.variant, location.pathname]);

  // Classes compartilhadas
  const commonClasses = cn(
    "group/item relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200 outline-none",
    isActive ? "bg-primary/10 shadow-sm" : "hover:bg-muted/50"
  );

  // Conteúdo interno (ícone + label)
  const content = (
    <>
      <Icon
        className={cn(
          "h-6 w-6 shrink-0 transition-all duration-300",
          isActive
            ? "text-primary"
            : "text-muted-foreground group-hover/item:text-foreground",
          !isActive && "group-hover/item:scale-110"
        )}
      />
      {showLabels && (
        <span
          className={cn(
            "font-medium whitespace-nowrap overflow-hidden text-ellipsis",
            isActive
              ? "text-foreground"
              : "text-muted-foreground group-hover/item:text-foreground"
          )}
        >
          {item.label}
        </span>
      )}

      {/* Active Indicator Strip */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1 bg-primary rounded-r-full" />
      )}
    </>
  );

  // Renderiza baseado no tipo da variante
  switch (item.variant.type) {
    case "route":
      return (
        <li>
          <GuardedLink
            to={item.variant.path}
            className={commonClasses}
            title={!showLabels ? item.label : undefined}
            onClick={onNavigate}
          >
            {content}
          </GuardedLink>
        </li>
      );

    case "external":
      return (
        <li>
          <a
            href={item.variant.url}
            target="_blank"
            rel="noopener noreferrer"
            className={commonClasses}
            title={!showLabels ? item.label : undefined}
          >
            {content}
          </a>
        </li>
      );

    case "group":
      // Grupos são renderizados por SidebarGroup
      return null;

    default: {
      // Exhaustiveness check
      const _exhaustive: never = item.variant;
      return _exhaustive;
    }
  }
}
