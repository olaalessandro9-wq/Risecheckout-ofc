// src/components/layout/Topbar.tsx
import { Bell, Menu } from "lucide-react";
import clsx from "clsx";
import ThemeToggle from "@/components/ThemeToggle";
import { UserAvatar } from "@/components/layout/UserAvatar";

type TopbarProps = {
  scrolled?: boolean;
  onNotificationsClick?: () => void;
  onMenuClick?: () => void;
};

export function Topbar({ scrolled, onNotificationsClick, onMenuClick }: TopbarProps) {
  return (
    <header
      className={clsx(
        "sticky top-0 z-40",
        // fundo translúcido e blur para efeito premium
        "backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "bg-background/70",
        // só mostra separador/sombra quando scrolled = true
        scrolled ? "shadow-sm border-b border-border/60" : "border-b border-transparent"
      )}
    >
      <div className="flex h-14 w-full items-center justify-between gap-2 px-4 md:px-6 lg:px-8">
        {/* Menu mobile (visível apenas em telas pequenas) */}
        <button
          type="button"
          aria-label="Menu"
          onClick={onMenuClick}
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent hover:bg-foreground/5 transition"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Espaçador para centralizar os botões à direita em desktop */}
        <div className="flex-1 md:flex-none" />

        <div className="flex items-center gap-3">
          {/* Notificações */}
          <button
            type="button"
            aria-label="Notificações"
            onClick={onNotificationsClick}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent hover:bg-foreground/5 transition"
          >
            <Bell className="h-5 w-5" />
          </button>

          {/* Toggle de tema */}
          <ThemeToggle />

          {/* Avatar do usuário */}
          <UserAvatar />
        </div>
      </div>
    </header>
  );
}
