/**
 * SidebarBrand - Logo e Nome da Aplicação
 * 
 * Componente puro para renderizar a identidade visual no topo do sidebar.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Componentes Pequenos
 */

import { cn } from "@/lib/utils";
import { RiseLogo } from "@/components/brand/RiseLogo";

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
        "flex items-center border-b border-border/40 transition-all duration-300",
        fullWidth ? "h-20 px-6" : "h-[88px] justify-center"
      )}
    >
      <div
        className={cn(
          "flex items-center overflow-hidden transition-all duration-300",
          showLabels ? "gap-3" : "gap-0"
        )}
      >
        {/* Logo */}
        <RiseLogo size="md" variant="default" />

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
