/**
 * MarketplaceFilters - Orquestrador dos filtros do Marketplace
 * 
 * Responsabilidade única: Compor e organizar sub-componentes de filtro
 * 
 * Refatorado de 369 para ~80 linhas
 * @see RISE Protocol V3 - Single Responsibility Principle
 */

import type { Database } from "@/integrations/supabase/types";
import type { MarketplaceFilters as Filters } from "@/services/marketplace";
import { useMarketplaceFilters } from "./hooks/useMarketplaceFilters";
import { FilterHeader } from "./FilterHeader";
import { SearchFilter } from "./SearchFilter";
import { ApprovalFilter } from "./ApprovalFilter";
import { TypeFilter } from "./TypeFilter";
import { CategoryFilter } from "./CategoryFilter";
import { CommissionFilter } from "./CommissionFilter";
import { SortFilter } from "./SortFilter";
import { FilterActions } from "./FilterActions";

type MarketplaceCategory = Database["public"]["Tables"]["marketplace_categories"]["Row"];

interface MarketplaceFiltersProps {
  categories: MarketplaceCategory[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function MarketplaceFilters({
  categories,
  filters,
  onFiltersChange,
}: MarketplaceFiltersProps) {
  const {
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
  } = useMarketplaceFilters({ filters, onFiltersChange });

  return (
    <div className="space-y-6">
      <FilterHeader activeFiltersCount={activeFiltersCount} />

      <SearchFilter
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
      />

      <ApprovalFilter
        filters={filters}
        onApprovalChange={handleApprovalChange}
        onSelectAll={handleSelectAllApproval}
      />

      <TypeFilter
        filters={filters}
        onTypeChange={handleTypeChange}
        onSelectAll={handleSelectAllTypes}
      />

      <CategoryFilter
        categories={categories}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />

      <CommissionFilter filters={filters} onFiltersChange={onFiltersChange} />

      <SortFilter filters={filters} onFiltersChange={onFiltersChange} />

      <FilterActions onClearAll={handleClearAll} onApply={handleSearch} />
    </div>
  );
}
