/**
 * SidebarFooter - Footer do Sidebar com Email e Botão Sair
 * 
 * Exibe email do usuário e botão de logout.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Componentes Pequenos
 */

import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";

// ============================================================================
// TYPES
// ============================================================================

interface SidebarFooterProps {
  /** Se o sidebar está colapsado (ocultar email) */
  isCollapsed: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SidebarFooter({ isCollapsed }: SidebarFooterProps) {
  const { user, logout } = useUnifiedAuth();
  const email = user?.email;

  return (
    <div className="mt-auto border-t border-border/50 p-3">
      {/* Email (apenas quando expandido) */}
      {!isCollapsed && email && (
        <div
          className="truncate text-xs text-muted-foreground mb-2"
          title={email}
        >
          {email}
        </div>
      )}

      {/* Botão Sair */}
      <button
        type="button"
        onClick={logout}
        className={cn(
          "flex w-full items-center rounded-md bg-destructive/90 text-sm font-medium text-destructive-foreground hover:bg-destructive transition",
          isCollapsed ? "justify-center px-3 py-2.5" : "justify-center gap-2 px-3 py-2"
        )}
        title={isCollapsed ? "Sair" : undefined}
      >
        <LogOut className={isCollapsed ? "h-6 w-6 shrink-0" : "h-5 w-5"} />
        {!isCollapsed && "Sair"}
      </button>
    </div>
  );
}
