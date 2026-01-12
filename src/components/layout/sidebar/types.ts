// src/components/layout/sidebar/types.ts

/**
 * Tipos compartilhados para componentes do Sidebar
 */

// ============================================================================
// SIDEBAR STATE (3 estados: oculto, colapsado, expandido)
// ============================================================================

export type SidebarState = 'hidden' | 'collapsed' | 'expanded';

export const SIDEBAR_WIDTHS = {
  hidden: 0,
  collapsed: 80,    // Era 64px - aumentado para ícones maiores
  expanded: 280,    // Era 260px - mais espaço para labels
} as const;

export const SIDEBAR_STORAGE_KEY = 'rise-sidebar-state';

// ============================================================================
// NAVIGATION TYPES
// ============================================================================

export interface NavItem {
  label: string;
  icon: React.ElementType;
  to?: string;
  external?: string;
  requiresAdmin?: boolean;
  children?: NavItem[];
}

export interface NavContentProps {
  fullWidth?: boolean;
  isHovered: boolean;
  navItems: NavItem[];
  openMenus: Record<string, boolean>;
  toggleMenu: (label: string) => void;
  isMenuOpen: (item: NavItem) => boolean;
  onNavigate?: () => void;
}

export interface NavItemProps {
  item: NavItem;
  showLabels: boolean;
  isActive: boolean;
  onNavigate?: () => void;
}

export interface NavItemGroupProps {
  item: NavItem;
  showLabels: boolean;
  isOpen: boolean;
  childActive: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}
