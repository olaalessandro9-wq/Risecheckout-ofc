/**
 * CommissionFilter - Filtros de comissão mínima e máxima
 * 
 * Responsabilidade única: Inputs de comissão min/max
 * 
 * @see RISE Protocol V3 - Single Responsibility Principle
 */

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { MarketplaceFilters } from "@/services/marketplace";

interface CommissionFilterProps {
  filters: MarketplaceFilters;
  onFiltersChange: (filters: MarketplaceFilters) => void;
}

export function CommissionFilter({
  filters,
  onFiltersChange,
}: CommissionFilterProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="minCommission" className="text-xs font-medium">
          Comissão Mínima (%)
        </Label>
        <Input
          id="minCommission"
          type="number"
          min="0"
          max="100"
          placeholder="Ex: 20"
          value={filters.minCommission || ""}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              minCommission: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxCommission" className="text-xs font-medium">
          Comissão Máxima (%)
        </Label>
        <Input
          id="maxCommission"
          type="number"
          min="0"
          max="100"
          placeholder="Ex: 50"
          value={filters.maxCommission || ""}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              maxCommission: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          className="h-9 text-sm"
        />
      </div>
    </>
  );
}
