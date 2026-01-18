/**
 * CategoryFilter - Filtro de categoria
 * 
 * Responsabilidade única: Select de categorias do marketplace
 * 
 * @see RISE Protocol V3 - Single Responsibility Principle
 */

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";
import type { MarketplaceFilters } from "@/services/marketplace";

type MarketplaceCategory = Database["public"]["Tables"]["marketplace_categories"]["Row"];

interface CategoryFilterProps {
  categories: MarketplaceCategory[];
  filters: MarketplaceFilters;
  onFiltersChange: (filters: MarketplaceFilters) => void;
}

export function CategoryFilter({
  categories,
  filters,
  onFiltersChange,
}: CategoryFilterProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="category" className="text-xs font-medium">
          Categoria
        </Label>
        <button className="text-xs text-primary hover:underline">
          (Selecionar todos)
        </button>
      </div>
      <Select
        value={filters.category || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            category: value === "all" ? undefined : value,
          })
        }
      >
        <SelectTrigger id="category" className="h-9 text-sm">
          <SelectValue placeholder="Todas as categorias" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as categorias</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.icon} {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
