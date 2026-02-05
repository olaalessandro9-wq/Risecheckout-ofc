/**
 * SidebarItem - Item de Navegação com Prefetch
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10 (Memoização Cirúrgica)
 * 
 * Renderiza um item de navegação com prefetch de chunks e dados no hover.
 * Suporta rotas internas (com GuardedLink) e links externos.
 * 
 * React.memo previne re-renders durante background auth sync.
 */

import { memo } from "react";
import { useLocation } from "react-router-dom";
import { useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { GuardedLink } from "@/components/navigation/GuardedLink";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/hooks/usePermissions";
import { isActivePath } from "../../utils/navigationHelpers";
import type { NavItemConfig } from "../../types/navigation.types";

// ============================================================================
// TYPES
// ============================================================================

interface SidebarItemProps {
  /** Configuração do item */
  item: NavItemConfig;
  /** Se labels devem ser exibidos */
  showLabels: boolean;
  /** Callback quando navegação ocorre (para fechar mobile) */
  onNavigate?: () => void;
}

// ============================================================================
// ROUTE PREFETCH MAP - Prefetch de chunks JS no hover
// ============================================================================

const ROUTE_PREFETCH_MAP: Record<string, () => Promise<unknown>> = {
  '/dashboard': () => import('@/modules/dashboard'),
  '/dashboard/produtos': () => import('@/pages/Produtos'),
  '/dashboard/marketplace': () => import('@/pages/Marketplace'),
  '/dashboard/afiliados': () => import('@/pages/Afiliados'),
  '/dashboard/minhas-afiliacoes': () => import('@/pages/MinhasAfiliacoes'),
  '/dashboard/financeiro': () => import('@/pages/Financeiro'),
  '/dashboard/gateways': () => import('@/pages/owner/OwnerGateways'),
  '/dashboard/trackeamento': () => import('@/pages/Rastreamento'),
  '/dashboard/webhooks': () => import('@/pages/Webhooks'),
  '/dashboard/ajuda': () => import('@/pages/Ajuda'),
  '/dashboard/perfil': () => import('@/pages/Perfil'),
  '/dashboard/admin': () => import('@/pages/admin/AdminDashboard'),
};

// ============================================================================
// COMPONENT (MEMOIZED)
// ============================================================================

export const SidebarItem = memo(function SidebarItem({ 
  item, 
  showLabels, 
  onNavigate 
}: SidebarItemProps) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { role } = usePermissions();
  const Icon = item.icon;

  // Verificar se é "em breve" para o role atual
  const isComingSoon = useMemo(() => {
    return item.comingSoonForRoles?.includes(role) ?? false;
  }, [item.comingSoonForRoles, role]);

  // Type-safe: só calcula isActive para rotas
  const isActive = useMemo(() => {
    if (item.variant.type !== "route") return false;
    return isActivePath(location.pathname, item.variant.path, item.variant.exact);
  }, [item.variant, location.pathname]);

  // Prefetch de chunks JS e dados no hover
  const prefetchAll = useCallback(() => {
    if (item.variant.type !== 'route') return;
    const path = item.variant.path;
    
    // 1. Prefetch chunk JS
    const prefetcher = ROUTE_PREFETCH_MAP[path];
    if (prefetcher) {
      prefetcher();
    }
    
    // 2. Prefetch dados via React Query (exemplo para produtos)
    if (path === '/dashboard/produtos') {
      queryClient.prefetchQuery({
        queryKey: ['products:list'],
        staleTime: 1000 * 60 * 2, // 2 minutos
      });
    }
  }, [item.variant, queryClient]);

  // Classes compartilhadas
  const commonClasses = cn(
    "group/item relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors duration-200 outline-none",
    isActive ? "bg-primary/10 shadow-sm" : "hover:bg-muted/50"
  );

  // Conteúdo interno (ícone + label)
  const content = (
    <>
      <Icon
        className={cn(
          "h-6 w-6 shrink-0 transition-colors duration-200",
          isActive
            ? "text-primary"
            : "text-muted-foreground group-hover/item:text-foreground"
        )}
      />
      {showLabels && (
        <span
          className={cn(
            "font-medium whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-2",
            isActive
              ? "text-foreground"
              : "text-muted-foreground group-hover/item:text-foreground"
          )}
        >
          {item.label}
          {isComingSoon && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
              Em Breve
            </Badge>
          )}
        </span>
      )}

      {/* Active Indicator Strip */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1 bg-primary rounded-r-full" />
      )}
    </>
  );

  // Renderiza baseado no tipo da variante
  switch (item.variant.type) {
    case "route":
      return (
        <li>
          <GuardedLink
            to={item.variant.path}
            className={commonClasses}
            title={!showLabels ? item.label : undefined}
            onClick={onNavigate}
            onMouseEnter={prefetchAll}
          >
            {content}
          </GuardedLink>
        </li>
      );

    case "external":
      return (
        <li>
          <a
            href={item.variant.url}
            target="_blank"
            rel="noopener noreferrer"
            className={commonClasses}
            title={!showLabels ? item.label : undefined}
          >
            {content}
          </a>
        </li>
      );

    case "group":
      // Grupos são renderizados por SidebarGroup
      return null;

    default: {
      // Exhaustiveness check
      const _exhaustive: never = item.variant;
      return _exhaustive;
    }
  }
});
