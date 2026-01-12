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
  Settings2,
  BarChart3,
  ChevronDown,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { UserFooter } from "./UserFooter";
import { useMemo, useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { HELP_CENTER_URL, SUPPORT_WHATSAPP_URL } from "@/lib/links";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type NavItem = {
  label: string;
  icon: React.ElementType;
  to?: string;
  external?: string;
  requiresAdmin?: boolean;
  children?: NavItem[];
};

/**
 * buildNavItems - Constrói itens de navegação baseado no role do usuário
 * 
 * Owner: Vê "Gateways" (não "Financeiro") - credenciais via Secrets
 * Outros: Vêm "Financeiro" para configurar suas próprias credenciais
 */
function buildNavItems(params: { canAccessAdminPanel: boolean; isOwner: boolean; canHaveAffiliates: boolean }): NavItem[] {
  const base: NavItem[] = [
    { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
    { label: "Produtos", icon: Package, to: "/dashboard/produtos" },
    { label: "Marketplace", icon: Store, to: "/dashboard/marketplace" },
    // Condicional: Owner vê "Gateways", demais veem "Financeiro"
    params.isOwner
      ? { label: "Gateways", icon: Wallet, to: "/dashboard/gateways" }
      : { label: "Financeiro", icon: Banknote, to: "/dashboard/financeiro" },
    // Menu expansível "Ferramentas"
    {
      label: "Ferramentas",
      icon: Settings2,
      children: [
        { label: "Pixels", icon: BarChart3, to: "/dashboard/pixels" },
        { label: "Integrações", icon: Plug, to: "/dashboard/integracoes" },
      ],
    },
    { label: "Administração", icon: ShieldCheck, to: "/dashboard/admin", requiresAdmin: true },
    { label: "Suporte pelo WhatsApp", icon: LifeBuoy, external: SUPPORT_WHATSAPP_URL },
    { label: "Ajuda", icon: HelpCircle, external: HELP_CENTER_URL },
  ];

  // Afiliados só aparece para quem pode ter afiliados (owners)
  if (params.canHaveAffiliates) {
    base.splice(3, 0, { label: "Afiliados", icon: Users, to: "/dashboard/afiliados" });
  }

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

// Verifica se algum filho está ativo
const hasActiveChild = (pathname: string, children?: NavItem[]): boolean => {
  if (!children) return false;
  return children.some((child) => child.to && isActivePath(pathname, child.to));
};

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
  onExpandChange?: (expanded: boolean) => void;
}

export function Sidebar({ mobileOpen = false, setMobileOpen, onExpandChange }: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const initializedRef = useRef(false);
  const location = useLocation();
  const { canAccessAdminPanel, role, canHaveAffiliates } = usePermissions();
  const isOwner = role === "owner";

  const navItems = useMemo(
    () => buildNavItems({ canAccessAdminPanel, isOwner, canHaveAffiliates }),
    [canAccessAdminPanel, isOwner, canHaveAffiliates]
  );

  // Inicializa menus com filhos ativos na primeira renderização
  useEffect(() => {
    if (initializedRef.current) return;
    
    const initialOpenMenus: Record<string, boolean> = {};
    navItems.forEach((item) => {
      if (item.children && hasActiveChild(location.pathname, item.children)) {
        initialOpenMenus[item.label] = true;
      }
    });
    
    if (Object.keys(initialOpenMenus).length > 0) {
      setOpenMenus(initialOpenMenus);
    }
    initializedRef.current = true;
  }, [navItems, location.pathname]);

  // Notificar AppShell quando hover mudar
  const handleMouseEnter = () => {
    setIsHovered(true);
    onExpandChange?.(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onExpandChange?.(false);
  };

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // Respeita sempre o toggle do usuário
  const isMenuOpen = (item: NavItem): boolean => {
    return openMenus[item.label] ?? false;
  };

  const NavContent = ({ fullWidth = false }: { fullWidth?: boolean }) => {
    const showLabels = fullWidth || isHovered;

    return (
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
            showLabels ? "gap-3" : "gap-0"
          )}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">
              R
            </div>
            {showLabels && (
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
              const hasChildren = item.children && item.children.length > 0;
              const isOpen = hasChildren && isMenuOpen(item);
              const childActive = hasActiveChild(location.pathname, item.children);

              // Renderiza item com sub-menu
              if (hasChildren) {
                return (
                  <li key={item.label}>
                    <Collapsible open={isOpen} onOpenChange={() => toggleMenu(item.label)}>
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "group/item relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200 outline-none",
                            childActive ? "bg-primary/10 shadow-sm" : "hover:bg-muted/50"
                          )}
                          title={!showLabels ? item.label : undefined}
                        >
                          <Icon className={cn(
                            "h-5 w-5 shrink-0 transition-all duration-300",
                            childActive ? "text-primary" : "text-muted-foreground group-hover/item:text-foreground"
                          )} />
                          {showLabels && (
                            <>
                              <span className={cn(
                                "flex-1 text-left font-medium whitespace-nowrap overflow-hidden text-ellipsis",
                                childActive ? "text-foreground" : "text-muted-foreground group-hover/item:text-foreground"
                              )}>
                                {item.label}
                              </span>
                              <ChevronDown 
                                className={cn(
                                  "h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out",
                                  isOpen ? "rotate-0" : "-rotate-90"
                                )} 
                              />
                            </>
                          )}

                          {/* Active Indicator Strip */}
                          {childActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1 bg-primary rounded-r-full" />
                          )}
                        </button>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                        <ul className={cn("mt-1 flex flex-col gap-1", showLabels ? "pl-4" : "pl-0")}>
                          {item.children!.map((child) => {
                            const ChildIcon = child.icon;
                            const isChildActive = child.to ? isActivePath(location.pathname, child.to) : false;

                            return (
                              <li key={child.label}>
                                <Link
                                  to={child.to!}
                                  className={cn(
                                    "group/child relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 outline-none",
                                    isChildActive
                                      ? "bg-primary/10 text-foreground font-medium"
                                      : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                                  )}
                                  title={!showLabels ? child.label : undefined}
                                  onClick={() => fullWidth && setMobileOpen?.(false)}
                                >
                                  <ChildIcon className={cn(
                                    "h-4 w-4 shrink-0 transition-all duration-300",
                                    isChildActive ? "text-primary" : "text-muted-foreground group-hover/child:text-foreground"
                                  )} />
                                  {showLabels && (
                                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                                      {child.label}
                                    </span>
                                  )}

                                  {/* Active Indicator for child */}
                                  {isChildActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-0.5 bg-primary rounded-r-full" />
                                  )}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  </li>
                );
              }

              // Renderiza item simples (sem filhos)
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

              return (
                <li key={item.label}>
                  {item.external ? (
                    <a
                      href={item.external}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={commonClasses}
                      title={!showLabels ? item.label : undefined}
                    >
                      {linkContent}
                    </a>
                  ) : (
                    <Link
                      to={item.to!}
                      className={commonClasses}
                      title={!showLabels ? item.label : undefined}
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

        <UserFooter isCollapsed={!showLabels} />
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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
