/**
 * ApprovalFilter - Filtro de tipo de aprovação
 * 
 * Responsabilidade única: Checkboxes Imediata/Moderação
 * 
 * @see RISE Protocol V3 - Single Responsibility Principle
 */

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { MarketplaceFilters } from "@/services/marketplace";

interface ApprovalFilterProps {
  filters: MarketplaceFilters;
  onApprovalChange: (type: "immediate" | "moderation", checked: boolean) => void;
  onSelectAll: () => void;
}

export function ApprovalFilter({
  filters,
  onApprovalChange,
  onSelectAll,
}: ApprovalFilterProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">Aprovação</Label>
        <button onClick={onSelectAll} className="text-xs text-primary hover:underline">
          (Selecionar todos)
        </button>
      </div>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="imediata"
            checked={filters.approvalImmediate || false}
            onCheckedChange={(checked) => onApprovalChange("immediate", checked === true)}
          />
          <label
            htmlFor="imediata"
            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Imediata
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="moderacao"
            checked={filters.approvalModeration || false}
            onCheckedChange={(checked) => onApprovalChange("moderation", checked === true)}
          />
          <label
            htmlFor="moderacao"
            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Mediante moderação
          </label>
        </div>
      </div>
    </div>
  );
}
