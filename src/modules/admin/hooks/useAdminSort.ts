/**
 * useAdminSort - Hook reutilizável para ordenação
 * 
 * RISE Protocol V3 - Eliminação de duplicação de lógica
 * 
 * @version 1.0.0
 */

import { useState, useMemo, useCallback } from "react";
import type { SortDirection } from "../types/admin.types";

export interface SortResult<T, F extends string> {
  /** Itens ordenados */
  sortedItems: T[];
  /** Campo de ordenação atual */
  sortField: F;
  /** Direção da ordenação */
  sortDirection: SortDirection;
  /** Alternar ordenação por campo */
  toggleSort: (field: F) => void;
  /** Definir ordenação específica */
  setSort: (field: F, direction: SortDirection) => void;
  /** Resetar para ordenação padrão */
  resetSort: () => void;
}

export type SortComparator<T, F extends string> = (
  a: T,
  b: T,
  field: F,
  direction: SortDirection
) => number;

export function useAdminSort<T, F extends string>(
  items: T[],
  defaultField: F,
  defaultDirection: SortDirection,
  comparator: SortComparator<T, F>
): SortResult<T, F> {
  const [sortField, setSortField] = useState<F>(defaultField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultDirection);

  const sortedItems = useMemo(() => {
    const sorted = [...items];
    sorted.sort((a, b) => comparator(a, b, sortField, sortDirection));
    return sorted;
  }, [items, sortField, sortDirection, comparator]);

  const toggleSort = useCallback((field: F) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }, [sortField]);

  const setSort = useCallback((field: F, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  }, []);

  const resetSort = useCallback(() => {
    setSortField(defaultField);
    setSortDirection(defaultDirection);
  }, [defaultField, defaultDirection]);

  return {
    sortedItems,
    sortField,
    sortDirection,
    toggleSort,
    setSort,
    resetSort,
  };
}

// ============================================
// COMPARATORS PRÉ-DEFINIDOS
// ============================================

/**
 * Comparador para usuários
 */
export function createUserComparator<T extends { 
  profile?: { name?: string } | null;
  total_gmv: number;
  orders_count: number;
}>(): SortComparator<T, "name" | "gmv" | "orders"> {
  return (a, b, field, direction) => {
    let comparison = 0;
    
    switch (field) {
      case "name":
        comparison = (a.profile?.name || "").localeCompare(b.profile?.name || "");
        break;
      case "gmv":
        comparison = a.total_gmv - b.total_gmv;
        break;
      case "orders":
        comparison = a.orders_count - b.orders_count;
        break;
    }
    
    return direction === "desc" ? -comparison : comparison;
  };
}

/**
 * Comparador para produtos
 */
export function createProductComparator<T extends {
  name: string;
  total_gmv: number;
  orders_count: number;
  price: number;
  created_at: string | null;
}>(): SortComparator<T, "name" | "gmv" | "orders" | "price" | "date"> {
  return (a, b, field, direction) => {
    let comparison = 0;
    
    switch (field) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "gmv":
        comparison = a.total_gmv - b.total_gmv;
        break;
      case "orders":
        comparison = a.orders_count - b.orders_count;
        break;
      case "price":
        comparison = a.price - b.price;
        break;
      case "date":
        comparison = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        break;
    }
    
    return direction === "desc" ? -comparison : comparison;
  };
}
