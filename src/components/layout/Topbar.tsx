// src/components/layout/Topbar.tsx
import { Bell, Menu } from "lucide-react";
import clsx from "clsx";
import ThemeToggle from "@/components/ThemeToggle";

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
      <div className="mx-auto flex h-14 w-full max-w-[1280px] items-center justify-between gap-2 px-4">
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

        <div className="flex items-center gap-2">
          {/* Notificações */}
          <button
            type="button"
            aria-label="Notificações"
            onClick={onNotificationsClick}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent hover:bg-foreground/5 transition"
          >
            <Bell className="h-5 w-5" />
            {/* Badge de não lidas (exemplo opcional) */}
            {/* <span className="absolute -right-0.5 -top-0.5 inline-flex h-2 w-2 rounded-full bg-red-500" /> */}
          </button>

          {/* Toggle de tema */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
