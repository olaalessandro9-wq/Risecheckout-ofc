/**
 * SidebarFooter - Footer do Sidebar com Email e Botão Sair
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10 (Selective Subscription + Memoização)
 * 
 * Exibe email do usuário e botão de logout.
 * Usa useAuthUser + useAuthActions (Selective Subscription) para evitar
 * re-renders durante background auth sync.
 * 
 * React.memo garante que o componente só re-renderiza quando props mudam.
 */

import { memo } from "react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useAuthActions } from "@/hooks/useAuthActions";

// ============================================================================
// TYPES
// ============================================================================

interface SidebarFooterProps {
  /** Se o sidebar está colapsado (ocultar email) */
  isCollapsed: boolean;
}

// ============================================================================
// COMPONENT (MEMOIZED + SELECTIVE SUBSCRIPTION)
// ============================================================================

export const SidebarFooter = memo(function SidebarFooter({ isCollapsed }: SidebarFooterProps) {
  // RISE V3: Usa hooks seletivos em vez de useUnifiedAuth completo
  // Isso previne re-renders quando loading states mudam
  const { email } = useAuthUser();
  const { logout, isLoggingOut } = useAuthActions();

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
        disabled={isLoggingOut}
        className={cn(
          "flex w-full items-center rounded-md bg-destructive/90 text-sm font-medium text-destructive-foreground hover:bg-destructive transition",
          isCollapsed ? "justify-center px-3 py-2.5" : "justify-center gap-2 px-3 py-2",
          isLoggingOut && "opacity-50 cursor-not-allowed"
        )}
        title={isCollapsed ? "Sair" : undefined}
      >
        <LogOut className={isCollapsed ? "h-6 w-6 shrink-0" : "h-5 w-5"} />
        {!isCollapsed && (isLoggingOut ? "Saindo..." : "Sair")}
      </button>
    </div>
  );
});
