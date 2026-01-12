// src/components/layout/sidebar/navUtils.ts

import type { NavItem } from "./types";

/**
 * Verifica se uma rota está ativa (considera rotas aninhadas)
 */
export const isActivePath = (pathname: string, itemPath: string): boolean => {
  if (itemPath === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname.startsWith(itemPath);
};

/**
 * Verifica se algum filho está ativo
 */
export const hasActiveChild = (pathname: string, children?: NavItem[]): boolean => {
  if (!children) return false;
  return children.some((child) => child.to && isActivePath(pathname, child.to));
};
