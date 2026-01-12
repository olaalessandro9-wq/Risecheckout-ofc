// src/components/layout/UserFooter.tsx
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import clsx from "clsx";

interface UserFooterProps {
  isCollapsed: boolean;
}

export function UserFooter({ isCollapsed }: UserFooterProps) {
  const { user, signOut } = useAuth();
  const email = user?.email;

  return (
    <div className="mt-auto border-t border-border/50 p-3">
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
        onClick={signOut}
        className={clsx(
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
