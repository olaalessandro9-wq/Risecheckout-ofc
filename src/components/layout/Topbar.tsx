// src/components/layout/Topbar.tsx
import { Menu, PanelLeft, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";
import { UserAvatar } from "@/components/layout/UserAvatar";
import type { SidebarState } from "@/modules/navigation";

type TopbarProps = {
  scrolled?: boolean;
  onMenuClick?: () => void;
  /** Estado atual do sidebar */
  sidebarState?: SidebarState;
  /** Callback para ciclar estado do sidebar */
  onSidebarToggle?: () => void;
};

export function Topbar({ 
  scrolled, 
  onMenuClick,
  sidebarState = 'collapsed',
  onSidebarToggle,
}: TopbarProps) {
  // Ícone do toggle baseado no estado
  const getSidebarIcon = () => {
    switch (sidebarState) {
      case 'hidden':
        return <PanelLeft className="h-5 w-5" />;
      case 'collapsed':
        return <PanelLeftClose className="h-5 w-5" />;
      case 'expanded':
        return <PanelLeftOpen className="h-5 w-5" />;
    }
  };

  // Tooltip do toggle
  const getSidebarTooltip = () => {
    switch (sidebarState) {
      case 'hidden':
        return 'Mostrar sidebar';
      case 'collapsed':
        return 'Expandir sidebar';
      case 'expanded':
        return 'Ocultar sidebar';
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40",
        // REMOVIDO: backdrop-blur (causa jank durante transições de layout)
        // Substituído por background sólido premium
        "bg-background/98",
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

        {/* Toggle do Sidebar (visível apenas em desktop) */}
        <button
          type="button"
          aria-label={getSidebarTooltip()}
          title={getSidebarTooltip()}
          onClick={onSidebarToggle}
          className="hidden md:inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent hover:bg-foreground/5 transition"
        >
          {getSidebarIcon()}
        </button>

        {/* Espaçador para centralizar os botões à direita */}
        <div className="flex-1" />

        <div className="flex items-center gap-3">
          {/* Toggle de tema */}
          <ThemeToggle />

          {/* Avatar do usuário */}
          <UserAvatar />
        </div>
      </div>
    </header>
  );
}
