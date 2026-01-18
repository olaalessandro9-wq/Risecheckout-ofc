/**
 * SortFilter - Filtro de ordenação
 * 
 * Responsabilidade única: Select de ordenação
 * 
 * @see RISE Protocol V3 - Single Responsibility Principle
 */

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MarketplaceFilters } from "@/services/marketplace";

interface SortFilterProps {
  filters: MarketplaceFilters;
  onFiltersChange: (filters: MarketplaceFilters) => void;
}

export function SortFilter({
  filters,
  onFiltersChange,
}: SortFilterProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="sortBy" className="text-xs font-medium">
        Ordenar por
      </Label>
      <Select
        value={filters.sortBy || "recent"}
        onValueChange={(value: string) =>
          onFiltersChange({ ...filters, sortBy: value as "recent" | "popular" | "commission" })
        }
      >
        <SelectTrigger id="sortBy" className="h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Mais Recentes</SelectItem>
          <SelectItem value="popular">Mais Populares</SelectItem>
          <SelectItem value="commission">Maior Comissão</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
