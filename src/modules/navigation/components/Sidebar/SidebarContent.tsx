/**
 * SidebarContent - Composição do Conteúdo do Sidebar
 * 
 * Compõe Brand, Navegação e Footer.
 * Recebe dados do useNavigation hook.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Composição de Componentes
 */

import { SidebarBrand } from "./SidebarBrand";
import { SidebarItem } from "./SidebarItem";
import { SidebarGroup } from "./SidebarGroup";
import { SidebarFooter } from "./SidebarFooter";
import type { NavItemConfig, NavItemGroupVariant } from "../../types/navigation.types";

// ============================================================================
// TYPES
// ============================================================================

interface SidebarContentProps {
  /** Itens de navegação filtrados por permissões */
  items: readonly NavItemConfig[];
  /** Se labels devem ser exibidos */
  showLabels: boolean;
  /** Se está em modo fullWidth (mobile) */
  fullWidth?: boolean;
  /** Verifica se um grupo está expandido */
  isGroupExpanded: (groupId: string) => boolean;
  /** Toggle de grupo */
  toggleGroup: (groupId: string) => void;
  /** Callback quando navegação ocorre (para fechar mobile) */
  onNavigate?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SidebarContent({
  items,
  showLabels,
  fullWidth = false,
  isGroupExpanded,
  toggleGroup,
  onNavigate,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Brand / Logo */}
      <SidebarBrand showLabels={showLabels} fullWidth={fullWidth} />

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 custom-scrollbar">
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            // Renderiza grupo expansível
            if (item.variant.type === "group") {
              return (
                <SidebarGroup
                  key={item.id}
                  item={item as NavItemConfig & { variant: NavItemGroupVariant }}
                  showLabels={showLabels}
                  isExpanded={isGroupExpanded(item.id)}
                  onToggle={() => toggleGroup(item.id)}
                  onNavigate={onNavigate}
                />
              );
            }

            // Renderiza item simples
            return (
              <SidebarItem
                key={item.id}
                item={item}
                showLabels={showLabels}
                onNavigate={onNavigate}
              />
            );
          })}
        </ul>
      </nav>

      {/* Footer com email e logout */}
      <SidebarFooter isCollapsed={!showLabels} />
    </div>
  );
}
