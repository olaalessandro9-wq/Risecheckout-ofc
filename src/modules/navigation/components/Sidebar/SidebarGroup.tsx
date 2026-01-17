/**
 * SidebarGroup - Grupo Expansível de Navegação
 * 
 * Renderiza um item com sub-itens (children) usando Collapsible.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Componentes Type-Safe
 */

import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { isActivePath, hasActiveChild } from "../../utils/navigationHelpers";
import type { NavItemConfig, NavItemGroupVariant } from "../../types/navigation.types";

// ============================================================================
// TYPES
// ============================================================================

interface SidebarGroupProps {
  /** Configuração do item (deve ter variant.type === 'group') */
  item: NavItemConfig & { variant: NavItemGroupVariant };
  /** Se labels devem ser exibidos */
  showLabels: boolean;
  /** Se o grupo está expandido */
  isExpanded: boolean;
  /** Callback para toggle */
  onToggle: () => void;
  /** Callback quando navegação ocorre */
  onNavigate?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SidebarGroup({
  item,
  showLabels,
  isExpanded,
  onToggle,
  onNavigate,
}: SidebarGroupProps) {
  const location = useLocation();
  const Icon = item.icon;
  const children = item.variant.children;

  // Verifica se algum filho está ativo
  const childActive = useMemo(
    () => hasActiveChild(location.pathname, children),
    [location.pathname, children]
  );

  return (
    <li>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              "group/item relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200 outline-none",
              childActive ? "bg-primary/10 shadow-sm" : "hover:bg-muted/50"
            )}
            title={!showLabels ? item.label : undefined}
          >
            <Icon
              className={cn(
                "h-6 w-6 shrink-0 transition-all duration-300",
                childActive
                  ? "text-primary"
                  : "text-muted-foreground group-hover/item:text-foreground"
              )}
            />
            {showLabels && (
              <>
                <span
                  className={cn(
                    "flex-1 text-left font-medium whitespace-nowrap overflow-hidden text-ellipsis",
                    childActive
                      ? "text-foreground"
                      : "text-muted-foreground group-hover/item:text-foreground"
                  )}
                >
                  {item.label}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out",
                    isExpanded ? "rotate-0" : "-rotate-90"
                  )}
                />
              </>
            )}

            {/* Active Indicator Strip */}
            {childActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1 bg-primary rounded-r-full" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <ul className={cn("mt-1 flex flex-col gap-1", showLabels ? "pl-4" : "pl-0")}>
            {children.map((child) => (
              <SidebarGroupChild
                key={child.id}
                item={child}
                showLabels={showLabels}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

// ============================================================================
// CHILD COMPONENT
// ============================================================================

interface SidebarGroupChildProps {
  item: NavItemConfig;
  showLabels: boolean;
  onNavigate?: () => void;
}

function SidebarGroupChild({ item, showLabels, onNavigate }: SidebarGroupChildProps) {
  const location = useLocation();
  const ChildIcon = item.icon;

  // Type guard: children de grupo devem ser rotas
  if (item.variant.type !== "route") {
    return null;
  }

  const isChildActive = isActivePath(
    location.pathname,
    item.variant.path,
    item.variant.exact
  );

  return (
    <li>
      <Link
        to={item.variant.path}
        className={cn(
          "group/child relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 outline-none",
          isChildActive
            ? "bg-primary/10 text-foreground font-medium"
            : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
        )}
        title={!showLabels ? item.label : undefined}
        onClick={onNavigate}
      >
        <ChildIcon
          className={cn(
            "h-5 w-5 shrink-0 transition-all duration-300",
            isChildActive
              ? "text-primary"
              : "text-muted-foreground group-hover/child:text-foreground"
          )}
        />
        {showLabels && (
          <span className="whitespace-nowrap overflow-hidden text-ellipsis">
            {item.label}
          </span>
        )}

        {/* Active Indicator for child */}
        {isChildActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-0.5 bg-primary rounded-r-full" />
        )}
      </Link>
    </li>
  );
}
