/**
 * useAdminFilters - Hook reutilizável para filtros de busca
 * 
 * RISE Protocol V3 - Eliminação de duplicação de lógica
 * 
 * @version 1.0.0
 */

import { useState, useMemo, useCallback } from "react";

export interface FilterResult<T, F extends Record<string, unknown>> {
  /** Itens filtrados */
  filteredItems: T[];
  /** Termo de busca atual */
  searchTerm: string;
  /** Filtros ativos */
  filters: F;
  /** Atualizar termo de busca */
  setSearchTerm: (term: string) => void;
  /** Atualizar um filtro específico */
  setFilter: <K extends keyof F>(key: K, value: F[K]) => void;
  /** Atualizar múltiplos filtros */
  setFilters: (filters: Partial<F>) => void;
  /** Limpar todos os filtros */
  clearFilters: () => void;
  /** Verificar se há filtros ativos */
  hasActiveFilters: boolean;
}

export type SearchFieldExtractor<T> = (item: T) => string[];

export function useAdminFilters<T, F extends Record<string, unknown> = Record<string, unknown>>(
  items: T[],
  searchFields: SearchFieldExtractor<T>,
  initialFilters: F,
  filterFn?: (item: T, filters: F) => boolean
): FilterResult<T, F> {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFiltersState] = useState<F>(initialFilters);

  const filteredItems = useMemo(() => {
    let result = items;

    // Aplicar busca por texto
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((item) => {
        const fields = searchFields(item);
        return fields.some((field) => 
          field?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Aplicar filtros customizados
    if (filterFn) {
      result = result.filter((item) => filterFn(item, filters));
    }

    return result;
  }, [items, searchTerm, filters, searchFields, filterFn]);

  const setFilter = useCallback(<K extends keyof F>(key: K, value: F[K]) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setFilters = useCallback((newFilters: Partial<F>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setFiltersState(initialFilters);
  }, [initialFilters]);

  const hasActiveFilters = useMemo(() => {
    if (searchTerm.trim()) return true;
    return Object.entries(filters).some(([, value]) => 
      value !== undefined && value !== null && value !== "" && value !== "all"
    );
  }, [searchTerm, filters]);

  return {
    filteredItems,
    searchTerm,
    filters,
    setSearchTerm,
    setFilter,
    setFilters,
    clearFilters,
    hasActiveFilters,
  };
}
