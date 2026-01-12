// src/components/layout/sidebar/NavItem.tsx

import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { NavItemProps } from "./types";

/**
 * Componente para renderizar um item de navegação simples (sem filhos)
 */
export function NavItem({ item, showLabels, isActive, onNavigate }: NavItemProps) {
  const Icon = item.icon;

  const linkContent = (
    <>
      <Icon className={cn(
        "h-5 w-5 shrink-0 transition-all duration-300",
        isActive ? "text-primary" : "text-muted-foreground group-hover/item:text-foreground",
        !isActive && "group-hover/item:scale-110"
      )} />
      {showLabels && (
        <span className={cn(
          "font-medium whitespace-nowrap overflow-hidden text-ellipsis",
          isActive ? "text-foreground" : "text-muted-foreground group-hover/item:text-foreground"
        )}>
          {item.label}
        </span>
      )}

      {/* Active Indicator Strip */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1 bg-primary rounded-r-full" />
      )}
    </>
  );

  const commonClasses = cn(
    "group/item relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200 outline-none",
    isActive
      ? "bg-primary/10 shadow-sm"
      : "hover:bg-muted/50"
  );

  if (item.external) {
    return (
      <li>
        <a
          href={item.external}
          target="_blank"
          rel="noopener noreferrer"
          className={commonClasses}
          title={!showLabels ? item.label : undefined}
        >
          {linkContent}
        </a>
      </li>
    );
  }

  return (
    <li>
      <Link
        to={item.to!}
        className={commonClasses}
        title={!showLabels ? item.label : undefined}
        onClick={onNavigate}
      >
        {linkContent}
      </Link>
    </li>
  );
}
