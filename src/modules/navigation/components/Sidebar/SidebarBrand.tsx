/**
 * SidebarBrand - Logo e Nome da Aplicação
 * 
 * Componente puro para renderizar a identidade visual no topo do sidebar.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Componentes Pequenos
 */

import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface SidebarBrandProps {
  /** Se labels devem ser exibidos */
  showLabels: boolean;
  /** Se está em modo fullWidth (mobile) */
  fullWidth?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SidebarBrand({ showLabels, fullWidth = false }: SidebarBrandProps) {
  return (
    <div
      className={cn(
        "flex items-center border-b border-border/40 transition-[padding,height] duration-300",
        fullWidth ? "h-20 px-6" : "h-[88px] justify-center"
      )}
    >
      <div
        className={cn(
          "flex items-center overflow-hidden transition-[gap] duration-300",
          showLabels ? "gap-3" : "gap-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg shadow-sm">
          R
        </div>

        {/* Nome (animado) */}
        {showLabels && (
          <span className="font-bold tracking-tight text-foreground whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
            RiseCheckout
          </span>
        )}
      </div>
    </div>
  );
}
