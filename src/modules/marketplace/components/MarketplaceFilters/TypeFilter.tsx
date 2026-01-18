/**
 * TypeFilter - Filtro de tipo de produto
 * 
 * Responsabilidade única: Checkboxes E-book/Serviço/Curso
 * 
 * @see RISE Protocol V3 - Single Responsibility Principle
 */

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { MarketplaceFilters } from "@/services/marketplace";

interface TypeFilterProps {
  filters: MarketplaceFilters;
  onTypeChange: (type: "ebook" | "service" | "course", checked: boolean) => void;
  onSelectAll: () => void;
}

export function TypeFilter({
  filters,
  onTypeChange,
  onSelectAll,
}: TypeFilterProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">Tipo</Label>
        <button onClick={onSelectAll} className="text-xs text-primary hover:underline">
          (Selecionar todos)
        </button>
      </div>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="ebook"
            checked={filters.typeEbook || false}
            onCheckedChange={(checked) => onTypeChange("ebook", checked === true)}
          />
          <label
            htmlFor="ebook"
            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            E-book e arquivos
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="servico"
            checked={filters.typeService || false}
            onCheckedChange={(checked) => onTypeChange("service", checked === true)}
          />
          <label
            htmlFor="servico"
            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Serviço
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="curso"
            checked={filters.typeCourse || false}
            onCheckedChange={(checked) => onTypeChange("course", checked === true)}
          />
          <label
            htmlFor="curso"
            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Curso
          </label>
        </div>
      </div>
    </div>
  );
}
