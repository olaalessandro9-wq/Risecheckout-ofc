// src/components/layout/sidebar/types.ts

/**
 * Tipos compartilhados para componentes do Sidebar
 */

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
