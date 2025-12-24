// src/components/layout/Sidebar.tsx
import {
  LayoutDashboard,
  Package,
  Users,
  Banknote,
  Plug,
  ShieldCheck,
  LifeBuoy,
  HelpCircle,
  Store,
  Wallet,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { UserFooter } from "./UserFooter";
import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { HELP_CENTER_URL, SUPPORT_WHATSAPP_URL } from "@/lib/links";
import { usePermissions } from "@/hooks/usePermissions";

type Item = {
  label: string;
  icon: React.ElementType;
  to?: string;
  external?: string;
  requiresAdmin?: boolean;
};

/**
 * buildNavItems - Constrói itens de navegação baseado no role do usuário
 * 
 * Owner: Vê "Gateways" (não "Financeiro") - credenciais via Secrets
 * Outros: Vêm "Financeiro" para configurar suas próprias credenciais
 */
function buildNavItems(params: { canAccessAdminPanel: boolean; isOwner: boolean }): Item[] {
  const base: Item[] = [
    { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
    { label: "Produtos", icon: Package, to: "/dashboard/produtos" },
    { label: "Marketplace", icon: Store, to: "/dashboard/marketplace" },
    { label: "Afiliados", icon: Users, to: "/dashboard/afiliados" },
    // Condicional: Owner vê "Gateways", demais veem "Financeiro"
    params.isOwner
      ? { label: "Gateways", icon: Wallet, to: "/dashboard/gateways" }
      : { label: "Financeiro", icon: Banknote, to: "/dashboard/financeiro" },
    { label: "Integrações", icon: Plug, to: "/dashboard/integracoes" },
    { label: "Administração", icon: ShieldCheck, to: "/dashboard/admin", requiresAdmin: true },
    { label: "Suporte pelo WhatsApp", icon: LifeBuoy, external: SUPPORT_WHATSAPP_URL },
    { label: "Ajuda", icon: HelpCircle, external: HELP_CENTER_URL },
  ];

  return base.filter((item) => {
    if (!item.requiresAdmin) return true;
    return params.canAccessAdminPanel;
  });
}

// Função para verificar rota ativa (considera rotas aninhadas)
const isActivePath = (pathname: string, itemPath: string): boolean => {
  if (itemPath === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname.startsWith(itemPath);
};

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export function Sidebar({ mobileOpen = false, setMobileOpen }: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  const { canAccessAdminPanel, role } = usePermissions();
  const isOwner = role === "owner";

  const navItems = useMemo(
    () => buildNavItems({ canAccessAdminPanel, isOwner }),
    [canAccessAdminPanel, isOwner]
  );

  const NavContent = ({ fullWidth = false }: { fullWidth?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Brand / Logo */}
      <div
        className={cn(
          "flex items-center border-b border-border/40 transition-all duration-300",
          fullWidth ? "h-20 px-6" : "h-[88px] justify-center"
        )}
      >
        <div className={cn(
          "flex items-center overflow-hidden transition-all duration-300",
          (fullWidth || isHovered) ? "gap-3" : "gap-0"
        )}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">
            R
          </div>
          {(fullWidth || isHovered) && (
            <span className="font-bold tracking-tight text-foreground whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
              RiseCheckout
            </span>
          )}
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 custom-scrollbar">
        <ul className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.to ? isActivePath(location.pathname, item.to) : false;

            const linkContent = (
              <>
                <Icon className={cn(
                  "h-5 w-5 shrink-0 transition-all duration-300",
                  isActive ? "text-primary" : "text-muted-foreground group-hover/item:text-foreground",
                  !isActive && "group-hover/item:scale-110"
                )} />
                {(fullWidth || isHovered) && (
                  <span className={cn(
                    "font-medium whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-300 animate-in fade-in slide-in-from-left-1",
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

            return (
              <li key={item.label}>
                {item.external ? (
                  <a
                    href={item.external}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={commonClasses}
                    title={!isHovered && !fullWidth ? item.label : undefined}
                  >
                    {linkContent}
                  </a>
                ) : (
                  <Link
                    to={item.to!}
                    className={commonClasses}
                    title={!isHovered && !fullWidth ? item.label : undefined}
                    onClick={() => fullWidth && setMobileOpen?.(false)}
                  >
                    {linkContent}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <UserFooter isCollapsed={!fullWidth && !isHovered} />
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "hidden md:flex fixed left-0 top-0 z-50 h-screen shrink-0 flex-col",
          "border-r border-border/40 bg-background/80 backdrop-blur-xl",
          "transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[width]"
        )}
        style={{
          width: isHovered ? '260px' : '64px',
        }}
      >
        <NavContent fullWidth={false} />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[280px] border-r border-border/40 bg-background/95 backdrop-blur-xl">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu de Navegação</SheetTitle>
          </SheetHeader>
          <NavContent fullWidth={true} />
        </SheetContent>
      </Sheet>
    </>
  );
}
