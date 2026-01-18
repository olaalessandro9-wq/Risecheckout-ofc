/**
 * useMarketplaceFilters - Hook para lógica de filtros do Marketplace
 * 
 * Responsabilidade única: Gerenciar estado e lógica de filtros
 * 
 * @see RISE Protocol V3 - Single Responsibility Principle
 */

import { useState, useCallback, useMemo } from "react";
import type { MarketplaceFilters } from "@/services/marketplace";

interface UseMarketplaceFiltersParams {
  filters: MarketplaceFilters;
  onFiltersChange: (filters: MarketplaceFilters) => void;
}

interface UseMarketplaceFiltersReturn {
  searchInput: string;
  setSearchInput: (value: string) => void;
  activeFiltersCount: number;
  handleSearch: () => void;
  handleClearSearch: () => void;
  handleClearAll: () => void;
  handleApprovalChange: (type: "immediate" | "moderation", checked: boolean) => void;
  handleTypeChange: (type: "ebook" | "service" | "course", checked: boolean) => void;
  handleSelectAllApproval: () => void;
  handleSelectAllTypes: () => void;
}

export function useMarketplaceFilters({
  filters,
  onFiltersChange,
}: UseMarketplaceFiltersParams): UseMarketplaceFiltersReturn {
  const [searchInput, setSearchInput] = useState(filters.search || "");

  const handleSearch = useCallback(() => {
    onFiltersChange({ ...filters, search: searchInput });
  }, [filters, searchInput, onFiltersChange]);

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    onFiltersChange({ ...filters, search: "" });
  }, [filters, onFiltersChange]);

  const handleClearAll = useCallback(() => {
    setSearchInput("");
    onFiltersChange({
      category: undefined,
      search: undefined,
      minCommission: undefined,
      maxCommission: undefined,
      sortBy: "recent",
      approvalImmediate: undefined,
      approvalModeration: undefined,
      typeEbook: undefined,
      typeService: undefined,
      typeCourse: undefined,
    });
  }, [onFiltersChange]);

  const handleApprovalChange = useCallback((type: "immediate" | "moderation", checked: boolean) => {
    if (type === "immediate") {
      onFiltersChange({ ...filters, approvalImmediate: checked || undefined });
    } else {
      onFiltersChange({ ...filters, approvalModeration: checked || undefined });
    }
  }, [filters, onFiltersChange]);

  const handleTypeChange = useCallback((type: "ebook" | "service" | "course", checked: boolean) => {
    if (type === "ebook") {
      onFiltersChange({ ...filters, typeEbook: checked || undefined });
    } else if (type === "service") {
      onFiltersChange({ ...filters, typeService: checked || undefined });
    } else {
      onFiltersChange({ ...filters, typeCourse: checked || undefined });
    }
  }, [filters, onFiltersChange]);

  const handleSelectAllApproval = useCallback(() => {
    const allSelected = filters.approvalImmediate && filters.approvalModeration;
    onFiltersChange({
      ...filters,
      approvalImmediate: allSelected ? undefined : true,
      approvalModeration: allSelected ? undefined : true,
    });
  }, [filters, onFiltersChange]);

  const handleSelectAllTypes = useCallback(() => {
    const allSelected = filters.typeEbook && filters.typeService && filters.typeCourse;
    onFiltersChange({
      ...filters,
      typeEbook: allSelected ? undefined : true,
      typeService: allSelected ? undefined : true,
      typeCourse: allSelected ? undefined : true,
    });
  }, [filters, onFiltersChange]);

  const activeFiltersCount = useMemo(() => {
    return [
      filters.category,
      filters.search,
      filters.minCommission,
      filters.maxCommission,
      filters.sortBy !== "recent" ? filters.sortBy : null,
      filters.approvalImmediate,
      filters.approvalModeration,
      filters.typeEbook,
      filters.typeService,
      filters.typeCourse,
    ].filter(Boolean).length;
  }, [filters]);

  return {
    searchInput,
    setSearchInput,
    activeFiltersCount,
    handleSearch,
    handleClearSearch,
    handleClearAll,
    handleApprovalChange,
    handleTypeChange,
    handleSelectAllApproval,
    handleSelectAllTypes,
  };
}
