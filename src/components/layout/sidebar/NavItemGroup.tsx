// src/components/layout/sidebar/NavItemGroup.tsx

import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { isActivePath } from "./navUtils";
import type { NavItemGroupProps } from "./types";

/**
 * Componente para renderizar um item de navegação com sub-itens (expansível)
 */
export function NavItemGroup({ 
  item, 
  showLabels, 
  isOpen, 
  childActive, 
  onToggle,
  onNavigate 
}: NavItemGroupProps) {
  const location = useLocation();
  const Icon = item.icon;

  return (
    <li>
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              "group/item relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200 outline-none",
              childActive ? "bg-primary/10 shadow-sm" : "hover:bg-muted/50"
            )}
            title={!showLabels ? item.label : undefined}
          >
            <Icon className={cn(
              "h-6 w-6 shrink-0 transition-all duration-300",
              childActive ? "text-primary" : "text-muted-foreground group-hover/item:text-foreground"
            )} />
            {showLabels && (
              <>
                <span className={cn(
                  "flex-1 text-left font-medium whitespace-nowrap overflow-hidden text-ellipsis",
                  childActive ? "text-foreground" : "text-muted-foreground group-hover/item:text-foreground"
                )}>
                  {item.label}
                </span>
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out",
                    isOpen ? "rotate-0" : "-rotate-90"
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
            {item.children!.map((child) => {
              const ChildIcon = child.icon;
              const isChildActive = child.to ? isActivePath(location.pathname, child.to) : false;

              return (
                <li key={child.label}>
                  <Link
                    to={child.to!}
                    className={cn(
                      "group/child relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 outline-none",
                      isChildActive
                        ? "bg-primary/10 text-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                    )}
                    title={!showLabels ? child.label : undefined}
                    onClick={onNavigate}
                  >
                    <ChildIcon className={cn(
                      "h-5 w-5 shrink-0 transition-all duration-300",
                      isChildActive ? "text-primary" : "text-muted-foreground group-hover/child:text-foreground"
                    )} />
                    {showLabels && (
                      <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                        {child.label}
                      </span>
                    )}

                    {/* Active Indicator for child */}
                    {isChildActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-0.5 bg-primary rounded-r-full" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}
